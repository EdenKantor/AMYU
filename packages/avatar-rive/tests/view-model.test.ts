import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import RiveCanvas from '@rive-app/canvas-advanced';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RiveViewModelBinding, type RiveViewModelBindingSpec } from '../src/view-model';
import { interactiveCharacterRig } from '../src/interactive-character';
import { inspectRiveFile } from '../src/inspection';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type File = Awaited<ReturnType<Runtime['load']>>;

/** Execute the original Candidate C VM/state machine; this is not pixel QA. */
describe('actual Candidate C ViewModel binding', () => {
  let runtime: Runtime;
  let file: File;
  beforeAll(async () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('@rive-app/canvas-advanced/rive.wasm');
    runtime = await RiveCanvas({ locateFile: () => wasmPath, wasmBinary: new Uint8Array(await readFile(wasmPath)).buffer });
    file = await runtime.load(await readFile(new URL('../../../assets/character/third-party/interactive-character.riv', import.meta.url)), undefined, false);
  });
  afterAll(() => { file?.unref(); vi.unstubAllGlobals(); });

  function scene(spec: RiveViewModelBindingSpec = interactiveCharacterRig.viewModel!) {
    const board = file.artboardByName(interactiveCharacterRig.artboard);
    const machine = new runtime.StateMachineInstance(board.stateMachineByName(interactiveCharacterRig.stateMachine), board);
    const binding = new RiveViewModelBinding(file, board, machine, spec);
    return {
      binding,
      advance(frames: number): string[] {
        const changes: string[] = [];
        for (let frame = 0; frame < frames; frame++) {
          binding.applyPending(); machine.advanceAndApply(1 / 60); board.advance(1 / 60);
          for (let index = 0; index < machine.stateChangedCount(); index++) changes.push(machine.stateChangedNameByIndex(index));
        }
        return changes;
      },
      dispose() { machine.delete(); board.delete(); binding.dispose(); },
    };
  }

  it('discovers a trigger-only model and no numeric or boolean state-machine inputs', () => {
    const info = inspectRiveFile(runtime, file);
    expect(info.stateMachines).toEqual([{ artboard: 'Carrot main', name: 'State Machine 1', inputs: [] }]);
    expect(info.viewModels).toEqual([{ name: 'ViewModel1', properties: [{ name: 'triggerProperty', type: 'trigger' }], instances: ['Instance'] }]);
    expect(info.animations).toHaveLength(12);
  });

  it('binds a real VM click reaction, returns to idle and can react again without stale triggers', () => {
    const current = scene();
    try {
      expect(current.binding.info).toMatchObject({ status: 'MAPPED', triggers: [{ name: 'triggerProperty', status: 'MAPPED' }] });
      expect(current.advance(90)).toContain('idle');
      for (let iteration = 0; iteration < 3; iteration++) {
        // A burst within one render tick must remain one pending reaction.
        for (let click = 0; click < 10; click++) current.binding.reactToClick();
        const changes = current.advance(360);
        expect(changes.filter((name) => name === 'active')).toHaveLength(1);
        expect(changes.at(-1)).toBe('idle');
        expect(current.advance(90)).not.toContain('active');
      }
    } finally { current.dispose(); }
    expect(() => { current.binding.dispose(); current.binding.reactToClick(); current.binding.applyPending(); }).not.toThrow();
  });

  it.each([
    { name: 'absent ViewModel', spec: { name: 'missing-model' }, reason: 'Requested ViewModel is absent from the actual file.' },
    { name: 'absent named instance', spec: { name: 'ViewModel1', instance: 'missing-instance' }, reason: 'Requested named ViewModel instance is absent.' },
  ])('keeps an $name unmapped without firing a native reaction', ({ spec, reason }) => {
    const current = scene(spec);
    try {
      expect(current.binding.info).toMatchObject({ status: 'UNMAPPED', reason });
      current.binding.reactToClick();
      expect(current.advance(120)).not.toContain('active');
    } finally { current.dispose(); }
  });

  it('reports an absent trigger without inventing a working property', () => {
    const current = scene({ name: 'ViewModel1', instance: 'Instance', clickTriggers: ['not-a-trigger'] });
    try {
      expect(current.binding.info).toMatchObject({ status: 'MAPPED', triggers: [{ name: 'not-a-trigger', status: 'UNMAPPED' }] });
      current.binding.reactToClick();
      expect(current.advance(120)).not.toContain('active');
    } finally { current.dispose(); }
  });
});
