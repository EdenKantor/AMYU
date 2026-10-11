import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import RiveCanvas from '@rive-app/canvas-advanced';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { conversationStates, emotions, type AvatarFrame, type ConversationState } from '@amyu/avatar-contract';
import { friendlyFloatingBotRig, mapFriendlyFloatingBot } from '../src/friendly-floating-bot';
import { diagnoseAnimationMappings, RiveAnimationMixer } from '../src/animations';
import { inspectRiveFile } from '../src/inspection';
import { verifiedCapabilities } from '../src/rig';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type File = Awaited<ReturnType<Runtime['load']>>;
type Command = (string | number)[];
type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };
interface Gradient { kind: string; args: number[]; stops: [number, string][] }
interface Draw { kind: string; style: string | Gradient | undefined; geometry: Command[]; clips: Command[][] }
const identity = (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const multiply = (m: Matrix, n: Matrix): Matrix => ({
  a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e, f: m.b * n.e + m.d * n.f + m.f,
});
const transform = (commands: Command[], matrix: Matrix): Command[] => commands.map(([name, ...args]) => {
  const result: Command = [name];
  for (let index = 0; index < args.length; index += 2) {
    const x = args[index] as number; const y = args[index + 1] as number;
    result.push(matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f);
  }
  return result;
});
class RecordingPath {
  commands: Command[] = [];
  moveTo(...args: number[]): void { this.commands.push(['moveTo', ...args]); }
  lineTo(...args: number[]): void { this.commands.push(['lineTo', ...args]); }
  bezierCurveTo(...args: number[]): void { this.commands.push(['bezierCurveTo', ...args]); }
  closePath(): void { this.commands.push(['closePath']); }
  addPath(path: RecordingPath, matrix: Matrix): void { this.commands.push(...transform(path.commands, matrix)); }
}
function frame(state: ConversationState = 'idle', overrides: Partial<AvatarFrame> = {}): AvatarFrame {
  return {
    timeMs: 1800, state, emotion: 'neutral', emotionIntensity: 0, presence: 'present', awake: state !== 'sleeping',
    stateWeights: Object.fromEntries(conversationStates.map(value => [value, value === state ? 1 : 0])) as AvatarFrame['stateWeights'],
    emotionWeights: Object.fromEntries(emotions.map(value => [value, value === 'neutral' ? 1 : 0])) as AvatarFrame['emotionWeights'],
    gaze: { x: 0, y: 0 }, headRotationX: 0, headRotationY: 0, headTilt: 0,
    bodyLeanX: 0, bodyLeanY: 0, breathing: 0.5, blink: 0, eyeOpenness: 1, eyeScale: 1, eyeSquint: 0,
    mouthOpen: 0, speechEnergy: state === 'speaking' ? 0.8 : 0, mouthWidth: 0.45, smile: 0, frown: 0,
    bounce: 0, anticipation: 0, squash: 0, animationEnergy: 0.12, gesture: null, ...overrides,
  };
}
const stable = (value: unknown): string => JSON.stringify(value, (_key, item) => typeof item === 'number' ? Math.round(item * 1e3) / 1e3 : item);
function eyeHeights(draws: Draw[]): number[] {
  // Actual white visor-pill bounds recorded in the original binary audit.
  return draws.filter(({ kind, style }) => kind === 'fill' && style === 'rgba(255,255,255,1)').flatMap(({ geometry }) => {
    const x: number[] = []; const y: number[] = [];
    for (const [, ...coordinates] of geometry) for (let index = 0; index < coordinates.length; index += 2) {
      x.push(coordinates[index] as number); y.push(coordinates[index + 1] as number);
    }
    const minX = Math.min(...x); const maxX = Math.max(...x);
    const minY = Math.min(...y); const maxY = Math.max(...y);
    return minX > 180 && maxX < 230 && minY > 220 && maxY < 250 ? [maxY - minY] : [];
  });
}
/** Preserve path count/order, paint and clips; tolerate WASM float rounding only. */
function expectEquivalent(actual: unknown, expected: unknown, path = 'draws'): void {
  if (typeof expected === 'number') { expect(actual, path).toBeCloseTo(expected, 3); return; }
  if (Array.isArray(expected)) {
    expect(Array.isArray(actual)).toBe(true);
    expect(actual).toHaveLength(expected.length);
    expected.forEach((value, index) => expectEquivalent((actual as unknown[])[index], value, `${path}[${index}]`));
  } else if (expected !== null && typeof expected === 'object') {
    expect(Object.keys(actual as object)).toEqual(Object.keys(expected));
    for (const [key, value] of Object.entries(expected)) expectEquivalent((actual as Record<string, unknown>)[key], value, `${path}.${key}`);
  } else expect(actual).toEqual(expected);
}

describe('actual Friendly Floating Bot conversation mapping', () => {
  let runtime: Runtime;
  let file: File;
  let info: ReturnType<typeof inspectRiveFile>;
  beforeAll(async () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    vi.stubGlobal('Path2D', RecordingPath);
    vi.stubGlobal('DOMMatrix', class { a = 1; b = 0; c = 0; d = 1; e = 0; f = 0; });
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('@rive-app/canvas-advanced/rive.wasm');
    runtime = await RiveCanvas({ locateFile: () => wasmPath, wasmBinary: new Uint8Array(await readFile(wasmPath)).buffer });
    file = await runtime.load(await readFile(new URL('../../../assets/character/third-party/friendly-floating-bot.riv', import.meta.url)), undefined, false);
    info = inspectRiveFile(runtime, file);
  });
  afterAll(() => { file?.unref(); vi.unstubAllGlobals(); });

  /** Actual WASM draw commands, not a replacement for product visual review. */
  function geometry(snapshot: AvatarFrame, history: AvatarFrame[] = []): Draw[] {
    const board = file.artboardByName(friendlyFloatingBotRig.artboard);
    const mixer = new RiveAnimationMixer(runtime, board, friendlyFloatingBotRig);
    let matrix = identity(); let clips: Command[][] = [];
    const stack: { matrix: Matrix; clips: Command[][] }[] = [];
    const draws: Draw[] = [];
    const gradient = (kind: string, args: number[]) => ({
      kind, args, stops: [] as [number, string][],
      addColorStop(offset: number, color: string) { this.stops.push([offset, color]); },
    });
    const context = {
      fillStyle: undefined as string | Gradient | undefined, strokeStyle: undefined as string | Gradient | undefined,
      save() { stack.push({ matrix: { ...matrix }, clips: [...clips] }); },
      restore() { const state = stack.pop()!; matrix = state.matrix; clips = state.clips; },
      transform(a: number, b: number, c: number, d: number, e: number, f: number) { matrix = multiply(matrix, { a, b, c, d, e, f }); },
      clearRect() {}, setLineDash() {},
      clip(path: RecordingPath) { if (path?.commands) clips.push(transform(path.commands, matrix)); },
      createLinearGradient(...args: number[]) { return gradient('linear-gradient', args); },
      createRadialGradient(...args: number[]) { return gradient('radial-gradient', args); },
      fill(path: RecordingPath) { this.record('fill', this.fillStyle, path); },
      stroke(path: RecordingPath) { this.record('stroke', this.strokeStyle, path); },
      record(kind: string, style: string | Gradient | undefined, path: RecordingPath) {
        draws.push({ kind, style: typeof style === 'object' ? { kind: style.kind, args: [...style.args], stops: [...style.stops] } : style,
          geometry: transform(path.commands, matrix), clips: structuredClone(clips) });
      },
    };
    const renderer = runtime.makeRenderer({ width: 600, height: 600, getContext: () => context } as unknown as HTMLCanvasElement);
    try {
      for (const current of [...history, snapshot]) {
        const diagnostics = diagnoseAnimationMappings(friendlyFloatingBotRig, info.animations, current);
        // Match the renderer's authored-only baseline/reset/overlay ordering.
        mixer.apply(diagnostics, 1 / 60, 'baseline');
        mixer.resetToRest();
        mixer.apply(diagnostics, 0, 'baseline');
        mixer.apply(diagnostics, 1 / 60, 'overlay');
        board.advance(1 / 60);
      }
      renderer.clear(); board.draw(renderer); runtime.resolveAnimationFrame();
      return draws;
    } finally { renderer.delete(); mixer.dispose(); board.delete(); }
  }

  it('maps only real downloaded timelines and reports absent independent controls honestly', () => {
    const main = info.animations.filter(({ artboard }) => artboard === friendlyFloatingBotRig.artboard);
    expect(main).toHaveLength(10);
    expect(diagnoseAnimationMappings(friendlyFloatingBotRig, info.animations, frame()).every(({ status }) => status === 'MAPPED')).toBe(true);
    const inputs = info.stateMachines.find(({ artboard, name }) => artboard === friendlyFloatingBotRig.artboard && name === friendlyFloatingBotRig.stateMachine)!.inputs;
    expect(inputs.map(({ name }) => name)).toEqual([' Receive down', 'Number 1', 'eceive', 'istracking']);
    expect(verifiedCapabilities(friendlyFloatingBotRig, inputs, main)).toMatchObject({ gaze: 'unsupported', headControl: 'unsupported', blink: 'unsupported', continuousMouth: 'unsupported', visemes: 'unsupported', emotionBlend: 'unsupported', gestures: { wave: 'supported' } });
    expect(verifiedCapabilities(friendlyFloatingBotRig, inputs, main.filter(({ name }) => name !== 'welcome loop')).gestures.wave).toBe('unsupported');
  });

  it('produces six distinct actual state drawings at the same clock phase', () => {
    const drawings = conversationStates.map(state => geometry(frame(state)));
    expect(drawings.every(paths => paths.length > 20)).toBe(true);
    expect(new Set(drawings.map(stable)).size).toBe(6);
  });

  it('returns speech gain zero to actual rest and varies actual geometry with gain', () => {
    const idle = geometry(frame());
    expectEquivalent(geometry(frame('speaking', { speechEnergy: 0 })), idle);
    const samples = [0.2, 0.6, 1].map(speechEnergy => geometry(frame('speaking', { speechEnergy })));
    expect(new Set([idle, ...samples].map(stable)).size).toBe(4);
    expectEquivalent(geometry(frame('speaking', { speechEnergy: 1, awake: false })), idle);
  });

  it('clears speech, cube, particles, hands and draw order after interrupted or repeated states', () => {
    const wave = frame('idle', { gesture: { name: 'wave', progress: 0.5, intensity: 1 } });
    const states = [frame('listening'), frame('thinking'), frame('speaking'), frame('acting'), frame('sleeping'), wave];
    const target = frame('idle', { timeMs: 10000 });
    // Nested authored props own clocks advanced by the artboard. Compare equal
    // frame counts so free-running nested animation is not mistaken for a latch.
    const clean = geometry(target, [frame()]);
    for (const previous of states) expectEquivalent(geometry(target, [previous]), clean, `after ${previous.gesture?.name ?? previous.state}`);
    const repeated = Array.from({ length: 10 }, () => states).flat();
    const repeatedClean = geometry(target, repeated.map(() => frame()));
    expectEquivalent(geometry(target, repeated), repeatedClean);
    expectEquivalent(geometry(frame('speaking', { timeMs: 10000, speechEnergy: 0 }), repeated), repeatedClean);
  });

  it('gives the peak wave priority over active state poses and returns cleanly to idle', () => {
    const gesture = { name: 'wave', progress: 0.5, intensity: 1 } as const;
    const idleWave = geometry(frame('idle', { gesture }), [frame()]);
    const cleanReturn = geometry(frame(), [frame(), frame()]);
    for (const state of ['listening', 'thinking', 'speaking', 'acting'] as const) {
      const source = frame(state);
      const wave = frame(state, { gesture });
      expectEquivalent(geometry(wave, [source]), idleWave, `wave from ${state}`);
      expectEquivalent(geometry(frame(), [source, wave]), cleanReturn, `idle after ${state} wave`);
    }
  });

  it('holds the measured closed-eye authored pose throughout sleep and wakes cleanly', () => {
    const asleep = geometry(frame('sleeping', { timeMs: 2000 }));
    const closedEyes = eyeHeights(asleep);
    const openEyes = eyeHeights(geometry(frame()));
    expect(closedEyes).toHaveLength(2); expect(openEyes).toHaveLength(2);
    closedEyes.forEach(height => expect(height).toBeLessThan(1.2));
    openEyes.forEach(height => expect(height).toBeGreaterThan(12));
    expect(mapFriendlyFloatingBot(frame('sleeping')).Idle.progress).toBeCloseTo(1 / 14);
    expectEquivalent(geometry(frame('sleeping', { timeMs: 200000 })), asleep);
    expect(stable(asleep)).not.toEqual(stable(geometry(frame())));
    expectEquivalent(geometry(frame(), [frame('sleeping')]), geometry(frame()));
  });

  it('holds reduced-motion poses across time, attenuates actual speech geometry and preserves closed sleep', () => {
    // Keep artboard advance counts equal: nested authored props also own clocks.
    for (const state of conversationStates) {
      expectEquivalent(
        geometry(frame(state, { reducedMotion: true, timeMs: 200000 })),
        geometry(frame(state, { reducedMotion: true, timeMs: 2000 })),
        `reduced-motion ${state}`,
      );
    }
    // Sample normal motion at the held authored phase so only speech amplitude
    // changes; compare actual binary geometry, including its coupled hand poses.
    const heldPhaseTimeMs = (29 / 24) / 0.2 / 2 * 1000;
    const quiet = geometry(frame('speaking', { reducedMotion: true, speechEnergy: 1 }));
    const normal = geometry(frame('speaking', { timeMs: heldPhaseTimeMs, speechEnergy: 1 }));
    const attenuated = geometry(frame('speaking', { timeMs: heldPhaseTimeMs, speechEnergy: 0.3 }));
    const rest = geometry(frame('idle', { reducedMotion: true }));
    expect(new Set([rest, quiet, normal].map(stable)).size).toBe(3);
    expectEquivalent(quiet, attenuated);
    expectEquivalent(geometry(frame('speaking', { reducedMotion: true, speechEnergy: 0 })), rest);
    const sleepingEyes = eyeHeights(geometry(frame('sleeping', { reducedMotion: true })));
    expect(sleepingEyes).toHaveLength(2);
    sleepingEyes.forEach(height => expect(height).toBeLessThan(1.2));
  });

  it('keeps all output mixes and phases finite and bounded for malformed continuous values', () => {
    for (const value of [NaN, Infinity, -Infinity, -100, 100]) {
      const sample = frame('speaking', {
        timeMs: value, speechEnergy: value,
        stateWeights: Object.fromEntries(conversationStates.map(state => [state, value])) as AvatarFrame['stateWeights'],
        gesture: { name: 'wave', progress: value, intensity: value },
      });
      for (const output of Object.values(mapFriendlyFloatingBot(sample))) {
        expect(Number.isFinite(output.mix)).toBe(true);
        expect(output.mix).toBeGreaterThanOrEqual(0); expect(output.mix).toBeLessThanOrEqual(1);
        expect(Number.isFinite(output.progress)).toBe(true);
        expect(output.progress).toBeGreaterThanOrEqual(0); expect(output.progress).toBeLessThanOrEqual(1);
      }
    }
  });
});
