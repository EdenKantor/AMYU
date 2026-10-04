import type RiveCanvas from '@rive-app/canvas-advanced';
import { clamp, type AvatarFrame } from '@amyu/avatar-contract';
import type { AnimationMappingDiagnostic } from './inspection';
import type { RiveAnimationSpec, RiveRigAdapter } from './rig';

type Runtime = Awaited<ReturnType<typeof RiveCanvas>>;
type Artboard = ReturnType<Awaited<ReturnType<Runtime['load']>>['defaultArtboard']>;
type AnimationInstance = InstanceType<Runtime['LinearAnimationInstance']>;
interface AnimationTiming { duration: number; fps: number; workStart: number; workEnd: number; enableWorkArea: boolean }

export function diagnoseAnimationMappings(
  adapter: RiveRigAdapter,
  discovered: readonly { artboard: string; name: string }[],
  frame?: AvatarFrame,
): AnimationMappingDiagnostic[] {
  const actual = new Set(discovered.filter(({ artboard }) => artboard === adapter.artboard).map(({ name }) => name));
  const values = frame ? adapter.mapAnimations?.(frame) : undefined;
  return (adapter.animations ?? []).map((spec) => {
    const value = values?.[spec.name];
    const diagnostic: AnimationMappingDiagnostic = {
      control: spec.control, animation: spec.name, status: actual.has(spec.name) ? 'MAPPED' : 'UNMAPPED',
      mix: clamp(value?.mix ?? 0),
    };
    if (!actual.has(spec.name)) diagnostic.reason = 'Requested authored animation is absent from this artboard.';
    else if (values && (!value || !Number.isFinite(value.mix) || (value.progress !== undefined && !Number.isFinite(value.progress)))) {
      diagnostic.status = 'UNMAPPED'; diagnostic.reason = 'Adapter did not produce a valid animation value.';
    }
    if (value?.progress !== undefined) diagnostic.progress = clamp(value.progress);
    return diagnostic;
  });
}

/** Owns real WASM animation instances, with deterministic application order. */
export class RiveAnimationMixer {
  private clips = new Map<string, { instance: AnimationInstance; start: number; end: number; active: boolean; seconds: number; spec: RiveAnimationSpec }>();
  constructor(runtime: Runtime, artboard: Artboard, adapter: RiveRigAdapter) {
    for (const spec of adapter.animations ?? []) {
      const definition = artboard.animationByName(spec.name);
      if (!definition) continue;
      const instance = new runtime.LinearAnimationInstance(definition, artboard);
      // In 2.44.0 these verified getters are on LinearAnimation, despite the d.ts
      // placing duration/fps on the instance. Do not read nonexistent instance getters.
      const timing = definition as unknown as AnimationTiming;
      const fps = timing.fps || 60;
      const workStart = timing.enableWorkArea ? timing.workStart / fps : 0;
      const workEnd = (timing.enableWorkArea ? timing.workEnd : timing.duration) / fps;
      const start = workStart + (workEnd - workStart) * clamp(spec.playbackRange?.[0] ?? 0);
      const end = workStart + (workEnd - workStart) * clamp(spec.playbackRange?.[1] ?? 1);
      this.clips.set(spec.name, { instance, start, end, active: false, seconds: 0, spec });
    }
  }
  apply(diagnostics: readonly AnimationMappingDiagnostic[], elapsed: number, stage?: 'baseline' | 'overlay'): void {
    for (const diagnostic of diagnostics) {
      const clip = this.clips.get(diagnostic.animation);
      if (stage && clip && (clip.spec.stage ?? 'overlay') !== stage) continue;
      if (!clip || diagnostic.status !== 'MAPPED' || diagnostic.mix <= 0) {
        if (clip) clip.active = false;
        continue;
      }
      if (diagnostic.progress !== undefined) {
        clip.instance.time = clip.start + (clip.end - clip.start) * diagnostic.progress;
        clip.instance.advance(0);
      } else if (clip.spec.mode === 'loop') {
        if (!clip.active) clip.seconds = 0;
        clip.seconds += elapsed * (clip.spec.speed ?? 1);
        const length = clip.end - clip.start;
        clip.instance.time = clip.start + (length > 0 ? clip.seconds % length : 0);
        clip.instance.advance(0);
      } else {
        if (!clip.active) clip.instance.time = clip.start;
        clip.instance.advance(elapsed);
      }
      clip.instance.apply(diagnostic.mix);
      clip.active = true;
    }
  }
  /** Restore authored start poses for targets absent from the idle clip. */
  resetToRest(): void {
    for (const clip of this.clips.values()) {
      if (clip.spec.resetAtRest === undefined) continue;
      clip.instance.time = clip.start + (clip.end - clip.start) * clamp(clip.spec.resetAtRest);
      clip.instance.advance(0); clip.instance.apply(1);
    }
  }
  dispose(): void {
    for (const { instance } of this.clips.values()) instance.delete();
    this.clips.clear();
  }
}
