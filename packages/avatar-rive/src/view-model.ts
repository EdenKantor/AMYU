import type RiveCanvas from '@rive-app/canvas-advanced';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type File = Awaited<ReturnType<Runtime['load']>>;
type Artboard = ReturnType<File['defaultArtboard']>;
type Machine = InstanceType<Runtime['StateMachineInstance']>;
type ModelInstance = ReturnType<ReturnType<File['viewModelByName']>['defaultInstance']>;
type Trigger = ReturnType<ModelInstance['trigger']>;

export interface RiveViewModelBindingSpec {
  name: string;
  instance?: string;
  clickTriggers?: readonly string[];
}
export interface RiveViewModelBindingInfo {
  model: string;
  instance: string | null;
  status: 'MAPPED' | 'UNMAPPED';
  triggers: Array<{ name: string; status: 'MAPPED' | 'UNMAPPED'; reason?: string }>;
  reason?: string;
}

/** Optional actual VM binding; owns its instance reference, not the artwork. */
export class RiveViewModelBinding {
  readonly info: RiveViewModelBindingInfo;
  private instance?: ModelInstance;
  private triggers = new Map<string, Trigger>();
  private pending = new Set<string>();

  constructor(file: File, artboard: Artboard, machine: Machine | undefined, spec: RiveViewModelBindingSpec) {
    this.info = { model: spec.name, instance: spec.instance ?? null, status: 'UNMAPPED', triggers: [] };
    const model = file.viewModelByName(spec.name);
    if (!model) { this.info.reason = 'Requested ViewModel is absent from the actual file.'; return; }
    if (spec.instance && !model.getInstanceNames().includes(spec.instance)) {
      this.info.reason = 'Requested named ViewModel instance is absent.'; return;
    }
    this.instance = spec.instance ? model.instanceByName(spec.instance) : model.defaultInstance();
    if (!this.instance) { this.info.reason = 'ViewModel instance is unavailable.'; return; }
    try {
      if (machine) machine.bindViewModelInstance(this.instance);
      else artboard.bindViewModelInstance(this.instance);
      this.info.status = 'MAPPED';
      const actual = this.instance.getProperties();
      for (const name of spec.clickTriggers ?? []) {
        if (actual.find((property) => property.name === name)?.type !== 'trigger') {
          this.info.triggers.push({ name, status: 'UNMAPPED', reason: 'Requested property is absent or is not a trigger.' });
          continue;
        }
        const trigger = this.instance.trigger(name);
        if (!trigger) { this.info.triggers.push({ name, status: 'UNMAPPED', reason: 'Actual trigger accessor is unavailable.' }); continue; }
        this.triggers.set(name, trigger); this.info.triggers.push({ name, status: 'MAPPED' });
      }
    } catch (error) { this.dispose(); throw error; }
  }
  reactToClick(): void { for (const name of this.triggers.keys()) this.pending.add(name); }
  applyPending(): void {
    for (const name of this.pending) this.triggers.get(name)?.trigger();
    this.pending.clear();
  }
  dispose(): void {
    this.pending.clear(); this.triggers.clear();
    this.instance?.unref(); this.instance = undefined;
  }
}
