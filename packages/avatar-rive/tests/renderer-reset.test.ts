import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { conversationStates, emotions, type AvatarFrame } from '@amyu/avatar-contract';
import { RiveAvatarRenderer } from '../src/renderer';
import { expressiveFloatingRig } from '../src/expressive-floating';
import { interactiveCharacterRig } from '../src/interactive-character';
import { friendlyFloatingBotRig } from '../src/friendly-floating-bot';
import type { RiveRigAdapter } from '../src/rig';

// Keep the actual decoder and animation engine; only replace browser WASM fetch.
vi.mock('@rive-app/canvas-advanced', async () => {
  const actual = await vi.importActual<typeof import('@rive-app/canvas-advanced')>('@rive-app/canvas-advanced');
  return { ...actual, default: async (options: Parameters<typeof actual.default>[0]) => {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('@rive-app/canvas-advanced/rive.wasm');
    const bytes = await readFile(wasmPath);
    return actual.default({ ...options, locateFile: options?.locateFile ?? (() => wasmPath), wasmBinary: new Uint8Array(bytes).buffer });
  } };
});

class RecordingPath {
  commands: unknown[][] = [];
  moveTo(...values: number[]): void { this.commands.push(['move', ...values]); }
  lineTo(...values: number[]): void { this.commands.push(['line', ...values]); }
  bezierCurveTo(...values: number[]): void { this.commands.push(['curve', ...values]); }
  closePath(): void { this.commands.push(['close']); }
  addPath(path: RecordingPath, matrix: { a: number; b: number; c: number; d: number; e: number; f: number }): void {
    this.commands.push(['path', matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, path.commands]);
  }
}

describe('renderer reset using actual third-party artwork', () => {
  beforeAll(() => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    vi.stubGlobal('Path2D', RecordingPath);
    vi.stubGlobal('DOMMatrix', class { a = 1; b = 0; c = 0; d = 1; e = 0; f = 0; });
    vi.stubGlobal('fetch', async (url: string) => {
      const bytes = await readFile(new URL(`../../../assets/character/third-party/${url}`, import.meta.url));
      return new Response(new Uint8Array(bytes).buffer);
    });
  });
  afterAll(() => vi.unstubAllGlobals());

  async function scene(assetUrl: string, adapter: RiveRigAdapter, width = 600, height = 600) {
    const commands: string[] = [];
    const context = {
      save() { commands.push('save'); }, restore() { commands.push('restore'); },
      transform(...values: number[]) { commands.push(JSON.stringify(['transform', ...values])); },
      clearRect() { commands.length = 0; },
      clip(path: RecordingPath) { commands.push(JSON.stringify(['clip', path.commands])); }, setLineDash() {},
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
      fill(path: RecordingPath) { commands.push(JSON.stringify(['fill', path.commands])); },
      stroke(path: RecordingPath) { commands.push(JSON.stringify(['stroke', path.commands])); },
    };
    const canvas = {
      width, height, getContext: () => context,
      getBoundingClientRect: () => ({ width, height }),
    } as unknown as HTMLCanvasElement;
    const renderer = await RiveAvatarRenderer.create(canvas, { assetUrl, adapter });
    const frame: AvatarFrame = {
      timeMs: 1000, state: 'idle', emotion: 'neutral', emotionIntensity: 0, presence: 'present', awake: true,
      stateWeights: Object.fromEntries(conversationStates.map(state => [state, state === 'idle' ? 1 : 0])) as AvatarFrame['stateWeights'],
      emotionWeights: Object.fromEntries(emotions.map(emotion => [emotion, emotion === 'neutral' ? 1 : 0])) as AvatarFrame['emotionWeights'],
      gaze: { x: 0, y: 0 }, headRotationX: 0, headRotationY: 0, headTilt: 0,
      bodyLeanX: 0, bodyLeanY: 0, breathing: 0.5, blink: 0, eyeOpenness: 1, eyeScale: 1, eyeSquint: 0,
      mouthOpen: 0, speechEnergy: 0, mouthWidth: 0.45, smile: 0, frown: 0,
      bounce: 0, anticipation: 0, squash: 0, animationEnergy: 0.12, gesture: null,
    };
    return { renderer, frame, draw(deltaMs = 0) { renderer.render(frame, deltaMs); return [...commands]; } };
  }

  it('clears an active native reaction and queued VM trigger while preserving asset metadata', async () => {
    const current = await scene('interactive-character.riv', interactiveCharacterRig);
    try {
      const originalInfo = current.renderer.assetInfo;
      const rest = current.draw();
      current.renderer.reactToClick();
      for (let index = 0; index < 80; index++) current.draw(1000 / 60);
      expect(current.draw()).not.toEqual(rest);
      current.renderer.reactToClick();
      current.renderer.reset();
      expect(current.renderer.assetInfo).toBe(originalInfo);
      expect(current.renderer.assetInfo.viewModelBinding?.status).toBe('MAPPED');
      expect(current.draw()).toEqual(rest);

      // The reaction must remain usable after several reset/rebind/dispose cycles.
      for (let repetition = 0; repetition < 3; repetition++) {
        current.renderer.reactToClick();
        for (let index = 0; index < 80; index++) current.draw(1000 / 60);
        expect(current.draw()).not.toEqual(rest);
        current.renderer.reset();
        expect(current.draw()).toEqual(rest);
      }
    } finally { current.renderer.dispose(); }
    expect(() => { current.renderer.reset(); current.renderer.dispose(); }).not.toThrow();
  });

  it('clears solo preview and authored clocks so reset matches a fresh render', async () => {
    const current = await scene('expressive-floating.riv', expressiveFloatingRig);
    try {
      const rest = current.draw();
      const before = current.renderer.getAnimationMappingDiagnostics(current.frame).find(item => item.animation === 'Mouth-talk')?.progress;
      for (let index = 0; index < 13; index++) current.draw(1000 / 60);
      expect(current.renderer.getAnimationMappingDiagnostics(current.frame).find(item => item.animation === 'Mouth-talk')?.progress).not.toBe(before);
      current.renderer.setAnimationPreview({ name: 'Waving', progress: 0.5, mix: 1 });
      expect(current.draw()).not.toEqual(rest);
      current.renderer.reset();
      expect(current.renderer.animationPreview).toBeNull();
      expect(current.renderer.getAnimationMappingDiagnostics(current.frame).find(item => item.animation === 'Mouth-talk')?.progress).toBe(0);
      expect(current.draw()).toEqual(rest);
    } finally { current.renderer.dispose(); }
  });

  it.each([[360, 340], [300, 180], [560, 580], [700, 250]])('clips the original robot demo UI outside its framing at %i×%i', async (width, height) => {
    const current = await scene('friendly-floating-bot.riv', friendlyFloatingBotRig, width, height);
    const crop = JSON.stringify(['clip', [
      ['move', 50, 145], ['line', 320, 145], ['line', 320, 386], ['line', 50, 386], ['close'],
    ]]);
    try {
      for (const state of conversationStates) {
        current.frame.state = state;
        current.frame.stateWeights = Object.fromEntries(conversationStates.map(name => [name, name === state ? 1 : 0])) as AvatarFrame['stateWeights'];
        const draw = current.draw();
        const clipIndex = draw.indexOf(crop);
        expect(clipIndex).toBeGreaterThan(0);
        expect(draw.slice(0, clipIndex).some(command => command.startsWith('["transform"'))).toBe(true);
        expect(clipIndex).toBeLessThan(draw.findIndex(command => command.startsWith('["fill"')));
      }
      current.renderer.setAnimationPreview({ name: 'welcome loop', progress: 0.5, mix: 1 });
      expect(current.draw()).toContain(crop);
      current.renderer.reset();
      expect(current.draw()).toContain(crop);
      current.frame.presence = 'hidden';
      expect(current.draw()).toEqual([]);
    } finally { current.renderer.dispose(); }
  });
});
