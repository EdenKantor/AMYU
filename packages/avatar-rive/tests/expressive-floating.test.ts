import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import RiveCanvas from '@rive-app/canvas-advanced';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { conversationStates, emotions, type AvatarFrame } from '@amyu/avatar-contract';
import { expressiveFloatingRig, mapExpressiveFloatingAnimations } from '../src/expressive-floating';
import { diagnoseAnimationMappings, RiveAnimationMixer } from '../src/animations';
import { diagnoseMappings, verifiedCapabilities } from '../src/rig';
import { inspectRiveFile } from '../src/inspection';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type File = Awaited<ReturnType<Runtime['load']>>;
type Command = (string | number)[];
type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };
const identity = (): Matrix => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const multiply = (m: Matrix, n: Matrix): Matrix => ({
  a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e, f: m.b * n.e + m.d * n.f + m.f,
});
const transformCommands = (commands: Command[], matrix: Matrix): Command[] => commands.map(([name, ...args]) => {
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
  addPath(path: RecordingPath, matrix: Matrix): void { this.commands.push(...transformCommands(path.commands, matrix)); }
}
function frame(overrides: Partial<AvatarFrame> = {}): AvatarFrame {
  return {
    timeMs: 1000, state: 'idle', emotion: 'neutral', emotionIntensity: 0, presence: 'present', awake: true,
    stateWeights: Object.fromEntries(conversationStates.map((value) => [value, value === 'idle' ? 1 : 0])) as AvatarFrame['stateWeights'],
    emotionWeights: Object.fromEntries(emotions.map((value) => [value, value === 'neutral' ? 1 : 0])) as AvatarFrame['emotionWeights'],
    gaze: { x: 0, y: 0 }, headRotationX: 0, headRotationY: 0, headTilt: 0,
    bodyLeanX: 0, bodyLeanY: 0, breathing: 0.5, blink: 0, eyeOpenness: 1, eyeScale: 1, eyeSquint: 0,
    mouthOpen: 0, speechEnergy: 0, mouthWidth: 0.45, smile: 0, frown: 0,
    bounce: 0, anticipation: 0, squash: 0, animationEnergy: 0.12, gesture: null, ...overrides,
  };
}

describe('actual third-party Expressive Floating rig', () => {
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
    file = await runtime.load(await readFile(new URL('../../../assets/character/third-party/expressive-floating.riv', import.meta.url)), undefined, false);
    info = inspectRiveFile(runtime, file);
  });
  afterAll(() => { file?.unref(); vi.unstubAllGlobals(); });

  /** Capture actual WASM-issued vector paths, without claiming a pixel screenshot. */
  const geometry = (snapshot: AvatarFrame, waveProgress?: number, history: AvatarFrame[] = []): Command[][] => {
    const board = file.artboardByName('Artboard');
    const machine = new runtime.StateMachineInstance(board.stateMachineByName('State Machine 1'), board);
    const mixer = new RiveAnimationMixer(runtime, board, expressiveFloatingRig);
    const paths: Command[][] = [];
    const stack: Matrix[] = [];
    let matrix = identity();
    const context = {
      save() { stack.push({ ...matrix }); }, restore() { matrix = stack.pop()!; },
      transform(a: number, b: number, c: number, d: number, e: number, f: number) { matrix = multiply(matrix, { a, b, c, d, e, f }); },
      clearRect() {}, clip() {}, setLineDash() {},
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
      fill(path: RecordingPath) { paths.push(transformCommands(path.commands, matrix)); },
      stroke(path: RecordingPath) { paths.push(transformCommands(path.commands, matrix)); },
    };
    const canvas = { width: 600, height: 600, getContext: () => context } as unknown as HTMLCanvasElement;
    const renderer = runtime.makeRenderer(canvas);
    try {
      for (const current of [...history, snapshot]) {
        const values = expressiveFloatingRig.mapFrame(current);
        for (let index = 0; index < machine.inputCount(); index++) {
          const input = machine.input(index).asBool(); input.value = values[input.name];
        }
        const diagnostics = diagnoseAnimationMappings(expressiveFloatingRig, info.animations, current);
        if (waveProgress !== undefined) {
          const wave = diagnostics.find(({ animation }) => animation === 'Waving')!;
          wave.mix = 1; wave.progress = waveProgress;
        }
        mixer.apply(diagnostics, 1 / 60, 'baseline');
        machine.advanceAndApply(1 / 60);
        mixer.resetToRest();
        mixer.apply(diagnostics, 0, 'baseline');
        mixer.apply(diagnostics, 1 / 60, 'overlay');
        board.advance(1 / 60);
      }
      renderer.clear(); board.draw(renderer); runtime.resolveAnimationFrame();
      return paths;
    } finally { renderer.delete(); mixer.dispose(); machine.delete(); board.delete(); }
  };

  it('discovers exactly two real boolean inputs, eighteen animations, and no view models', () => {
    expect(info.artboards).toEqual(['Artboard']);
    expect(info.stateMachines[0].inputs).toEqual([
      { name: 'isTalking', type: 'boolean', typeId: 59 },
      { name: 'isListening', type: 'boolean', typeId: 59 },
    ]);
    expect(info.animations).toHaveLength(18); expect(info.viewModels).toEqual([]);
    expect(info.animations.map(({ name }) => name)).toEqual(expect.arrayContaining(['Thinking', 'Waving', 'Mouth-talk', 'Mouth-normal', 'Mouth-smile', 'EYES-open', 'EYES-close']));
  });

  it('keeps state-machine controls separate from authored animation mixes', () => {
    const quiet = frame({ state: 'speaking', speechEnergy: 0 });
    expect(expressiveFloatingRig.mapFrame(quiet)).toEqual({ isTalking: false, isListening: false });
    const speaking = frame({ state: 'speaking', speechEnergy: 0.7 });
    expect(diagnoseMappings(expressiveFloatingRig, info.stateMachines[0].inputs, speaking).map(({ value }) => value)).toEqual([true, false]);
    expect(diagnoseAnimationMappings(expressiveFloatingRig, info.animations, speaking).find(({ animation }) => animation === 'Mouth-talk')).toMatchObject({ status: 'MAPPED', mix: 0.7 });
    expect(mapExpressiveFloatingAnimations(quiet)['Mouth-talk'].mix).toBe(0);
    expect(verifiedCapabilities(expressiveFloatingRig, info.stateMachines[0].inputs, info.animations)).toMatchObject({ gaze: 'unsupported', headControl: 'unsupported', continuousMouth: 'unsupported', emotionBlend: 'unsupported', visemes: 'unsupported' });
  });

  it('draws identical rest geometry at speech zero and distinct graded speech paths', () => {
    const rest = geometry(frame());
    expect(rest.length).toBeGreaterThan(10);
    expect(geometry(frame({ state: 'speaking', speechEnergy: 0 }))).toEqual(rest);
    const low = geometry(frame({ state: 'speaking', speechEnergy: 0.3 }));
    const medium = geometry(frame({ state: 'speaking', speechEnergy: 0.7 }));
    const loud = geometry(frame({ state: 'speaking', speechEnergy: 1 }));
    expect(low).not.toEqual(rest); expect(medium).not.toEqual(low); expect(loud).not.toEqual(medium);
  });

  it('applies actual authored smile, closed eyes, thinking, and waving geometry', () => {
    const rest = geometry(frame());
    expect(geometry(frame({ smile: 1 }))).not.toEqual(rest);
    expect(geometry(frame({ state: 'listening', stateWeights: { ...frame().stateWeights, idle: 0, listening: 1 } }))).not.toEqual(rest);
    expect(geometry(frame({ eyeOpenness: 0, blink: 1 }))).not.toEqual(rest);
    expect(geometry(frame({ state: 'thinking', stateWeights: { ...frame().stateWeights, idle: 0, thinking: 1 } }))).not.toEqual(rest);
    expect(geometry(frame({ gesture: { name: 'wave', progress: 0.5, intensity: 1 } }))).not.toEqual(rest);
  });

  it('returns to the same authored idle geometry after thinking and wave on one artboard', () => {
    const target = frame({ timeMs: 5000 });
    const clean = geometry(target, undefined, [frame()]);
    const thinking = frame({ state: 'thinking', stateWeights: { ...frame().stateWeights, idle: 0, thinking: 1 } });
    const wave = frame({ gesture: { name: 'wave', progress: 0.5, intensity: 1 } });
    expect(geometry(target, undefined, [thinking])).toEqual(clean);
    expect(geometry(target, undefined, [wave])).toEqual(clean);
  });

  it('keeps authored speech moving beyond multiple full work-range durations', () => {
    const snapshots = Array.from({ length: 360 }, (_, index) => frame({
      timeMs: 1000 + index * 1000 / 60, state: 'speaking', speechEnergy: 1,
      stateWeights: { ...frame().stateWeights, idle: 0, speaking: 1 },
    }));
    const first = geometry(snapshots[300], undefined, snapshots.slice(0, 300));
    const later = geometry(snapshots[307], undefined, snapshots.slice(0, 307));
    expect(later).not.toEqual(first);
    const settled = Array.from({ length: 60 }, (_, index) => frame({ timeMs: 7000 + index * 1000 / 60 }));
    const after = geometry(settled[59], undefined, [...snapshots, ...settled.slice(0, 59)]);
    const clean = geometry(settled[59], undefined, Array.from({ length: 419 }, () => frame()));
    const afterNumbers = after.flat(2).filter((value): value is number => typeof value === 'number');
    const cleanNumbers = clean.flat(2).filter((value): value is number => typeof value === 'number');
    expect(afterNumbers).toHaveLength(cleanNumbers.length);
    // Native SM idle clocks differ after a state transition; allow its small
    // authored breathing variation, but reject a latched arm/head pose.
    const maximumDifference = Math.max(...afterNumbers.map((value, index) => Math.abs(value - cleanNumbers[index])));
    expect(maximumDifference).toBeLessThan(25);
  });

  it('frames the actual wave vectors and shadow with safe uniform crop bounds', () => {
    const bounds = expressiveFloatingRig.framing!.bounds;
    for (let sample = 0; sample <= 30; sample++) {
      // First draw is the full-artboard background, intentionally cropped.
      const paths = geometry(frame(), sample / 30).slice(1);
      for (const commands of paths) for (const [, ...coordinates] of commands) {
        for (let index = 0; index < coordinates.length; index += 2) {
          expect(coordinates[index]).toBeGreaterThan(bounds.minX);
          expect(coordinates[index]).toBeLessThan(bounds.maxX);
          expect(coordinates[index + 1]).toBeGreaterThan(bounds.minY);
          expect(coordinates[index + 1]).toBeLessThan(bounds.maxY);
        }
      }
    }
  });

  it('reports missing optional authored clips without inventing support', () => {
    const available = info.animations.filter(({ name }) => name !== 'Waving');
    expect(diagnoseAnimationMappings(expressiveFloatingRig, available, frame()).find(({ animation }) => animation === 'Waving')?.status).toBe('UNMAPPED');
    expect(verifiedCapabilities(expressiveFloatingRig, info.stateMachines[0].inputs, available).gestures.wave).toBe('unsupported');
  });
});
