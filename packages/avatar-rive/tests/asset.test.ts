import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import RiveCanvas from '@rive-app/canvas-advanced';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import manifest from '../../../assets/character/rig-manifest.json';
import { inspectRiveFile } from '../src/inspection';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type RiveFile = Awaited<ReturnType<Runtime['load']>>;
type Artboard = ReturnType<RiveFile['defaultArtboard']>;
type Machine = InstanceType<Runtime['StateMachineInstance']>;

/**
 * Execute the real Rive WASM decoder and state machine in Node.
 * These browser shims record path construction/draw commands; they do not draw pixels.
 * Actual Canvas2D drawing belongs to the browser visual acceptance checks.
 */
class HeadlessPath {
  readonly commands: Array<{ operation: string; values: number[] }> = [];
  moveTo(...values: number[]): void { this.commands.push({ operation: 'move', values }); }
  lineTo(...values: number[]): void { this.commands.push({ operation: 'line', values }); }
  bezierCurveTo(...values: number[]): void { this.commands.push({ operation: 'curve', values }); }
  closePath(): void { this.commands.push({ operation: 'close', values: [] }); }
  addPath(path: HeadlessPath): void { this.commands.push(...path.commands); }
}

/** Original, test-only .riv containing one number, boolean and trigger input. */
function typedInputFixture(): Uint8Array {
  const uint = (number: number): Buffer => {
    const bytes: number[] = [];
    do { const byte = number & 127; number >>>= 7; bytes.push(number ? byte | 128 : byte); } while (number);
    return Buffer.from(bytes);
  };
  const string = (value: string) => Buffer.concat([uint(Buffer.byteLength(value)), Buffer.from(value)]);
  const float = (value: number) => { const bytes = Buffer.alloc(4); bytes.writeFloatLE(value); return bytes; };
  const object = (type: number, fields: Array<[number, Uint8Array]> = []) => Buffer.concat([
    uint(type), ...fields.flatMap(([key, bytes]) => [uint(key), bytes]), uint(0),
  ]);
  return Buffer.concat([
    Buffer.from('RIVE'), uint(7), uint(0), uint(0), uint(0), object(23),
    object(1, [[4, string('Typed inputs')], [7, float(100)], [8, float(100)]]),
    object(53, [[55, string('Typed')]]),
    object(56, [[138, string('energy')], [140, float(0)]]),
    object(59, [[138, string('listening')], [141, Buffer.from([0])]]),
    object(58, [[138, string('wave')]]),
    object(57, [[138, string('Layer')]]), object(63),
  ]);
}

describe('original Rive character binary', () => {
  let file: RiveFile;
  let artboard: Artboard;
  let machine: Machine;
  let runtime: Runtime;
  const inputs = new Map<string, ReturnType<Machine['input']>>();

  beforeAll(async () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    vi.stubGlobal('Path2D', HeadlessPath);
    vi.stubGlobal('DOMMatrix', class {});
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('@rive-app/canvas-advanced/rive.wasm');
    const wasm = await readFile(wasmPath);
    runtime = await RiveCanvas({ locateFile: () => wasmPath, wasmBinary: new Uint8Array(wasm).buffer });
    const bytes = await readFile(new URL('../../../assets/character/amyu-developer.riv', import.meta.url));
    file = await runtime.load(bytes, undefined, false);
    artboard = file.artboardByName(manifest.artboard);
    machine = new runtime.StateMachineInstance(artboard.stateMachineByName(manifest.stateMachine), artboard);
    for (let index = 0; index < machine.inputCount(); index++) {
      const input = machine.input(index);
      expect(input.type).toBe(56);
      inputs.set(input.name, input.asNumber());
    }
  });

  afterAll(() => {
    machine?.delete();
    artboard?.delete();
    file?.unref();
    vi.unstubAllGlobals();
  });

  const advance = () => { machine.advanceAndApply(1 / 60); artboard.advance(1 / 60); };
  const reset = () => {
    for (const input of manifest.inputs) inputs.get(input.name)!.value = input.initial;
    advance();
  };

  it('decodes the expected artboard, pose animations, and every numeric input', () => {
    expect(file.artboardCount()).toBe(1);
    expect(artboard.animationCount()).toBe(46);
    expect(artboard.stateMachineCount()).toBe(1);
    expect([...inputs.keys()].sort()).toEqual(manifest.inputs.map(({ name }) => name).sort());
  });

  it('introspects actual controls and reports inaccessible states/bindings as unknown', () => {
    const info = inspectRiveFile(runtime, file);
    expect(info.artboards).toEqual(['AMYU Developer']);
    expect(info.stateMachines[0].inputs).toHaveLength(23);
    expect(info.stateMachines[0].inputs.every(({ type }) => type === 'number')).toBe(true);
    expect(info.viewModels).toEqual([]);
    expect(info.bindings.status).toBe('unknown');
    expect(info.availableStates.status).toBe('unknown');
    expect(info.animations).toHaveLength(46);
  });

  it('discovers actual number, boolean and trigger types without guessing from names', async () => {
    const typedFile = await runtime.load(typedInputFixture(), undefined, false);
    const typedBoard = typedFile.artboardByName('Typed inputs');
    const typedMachine = new runtime.StateMachineInstance(typedBoard.stateMachineByName('Typed'), typedBoard);
    try {
      const info = inspectRiveFile(runtime, typedFile);
      expect(info.stateMachines[0].inputs).toEqual([
        { name: 'energy', type: 'number', typeId: 56 },
        { name: 'listening', type: 'boolean', typeId: 59 },
        { name: 'wave', type: 'trigger', typeId: 58 },
      ]);
      typedMachine.input(1).asBool().value = true;
      typedMachine.input(2).asTrigger().fire();
      typedMachine.advanceAndApply(1 / 60);
      expect(typedMachine.input(1).asBool().value).toBe(true);
    } finally { typedMachine.delete(); typedBoard.delete(); typedFile.unref(); }
  });

  it('centres the neutral pose and linearly drives actual gaze and mouth nodes', () => {
    reset();
    expect(artboard.node('body').x).toBeCloseTo(200);
    expect(artboard.node('body').scaleX).toBeCloseTo(1);
    expect(artboard.node('body').scaleY).toBeCloseTo(1);
    inputs.get('gazeX')!.value = 0.5;
    inputs.get('gazeY')!.value = -0.5;
    inputs.get('eyeOpen')!.value = 0;
    inputs.get('mouthOpen')!.value = 0.75;
    advance();
    expect(artboard.node('face').x).toBeCloseTo(6);
    expect(artboard.node('face').y).toBeCloseTo(-4.5);
    expect(artboard.node('leftEye').scaleY).toBeCloseTo(0.03);
    expect(artboard.node('mouthOpen').scaleY).toBeCloseTo(0.7525);
  });

  it('draws a visible closed mouth path that curves from frown to smile', () => {
    const drawn: HeadlessPath['commands'][] = [];
    const context = {
      globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '',
      save() {}, restore() {}, transform() {}, clearRect() {}, clip() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      fill: (path: HeadlessPath) => drawn.push([...path.commands]),
    };
    const renderer = runtime.makeRenderer({ width: 400, height: 440, getContext: () => context } as unknown as HTMLCanvasElement);
    try {
      for (const smile of [-1, 0, 1]) {
        reset();
        inputs.get('smile')!.value = smile;
        advance();
        drawn.length = 0;
        renderer.clear();
        artboard.draw(renderer);
        runtime.resolveAnimationFrame();
        // Unlike an input-value assertion, this catches a hidden artwork path.
        const mouth = drawn.find(commands => commands.some(({ operation, values }) => operation === 'move' && values[0] === -21 && values[1] === -2));
        expect(mouth, `closed mouth must reach the renderer at smile=${smile}`).toBeDefined();
        expect(mouth!.filter(({ operation }) => operation === 'curve')).toHaveLength(4);
        expect(mouth!.some(({ operation }) => operation === 'close')).toBe(true);
        const centers = mouth!.filter(({ operation, values }) => operation === 'curve' && Math.abs(values[4]) < 0.001).map(({ values }) => values[5]);
        expect(centers).toHaveLength(2);
        if (smile < 0) expect(Math.max(...centers)).toBeLessThan(0);
        if (smile > 0) expect(Math.min(...centers)).toBeGreaterThan(0);
      }
    } finally { renderer.delete(); }
  });

  it('runs the real state machine for 30 simulated minutes without pose drift', () => {
    reset();
    for (let index = 0; index < 108_000; index++) {
      inputs.get('bodyX')!.value = Math.sin(index / 110);
      inputs.get('mouthOpen')!.value = (Math.sin(index / 10) + 1) / 2;
      inputs.get('eyeOpen')!.value = index % 230 < 9 ? 0 : 1;
      advance();
    }
    reset();
    expect(artboard.node('body').x).toBeCloseTo(200);
    expect(artboard.node('body').y).toBeCloseTo(236);
    expect(artboard.node('leftEye').scaleY).toBeCloseTo(1.01, 2);
    expect(artboard.node('mouthOpen').scaleY).toBeCloseTo(0.01);
  }, 20_000);
});
