import { EmbodimentDirector } from '@amyu/embodiment';
import type { AvatarFrame, ConversationState, Emotion, Gesture } from '@amyu/avatar-contract';
import { LatencyMetrics } from '@amyu/observability';
import { DemoTimeline, type DemoKind, type DemoStatus } from './demo';

export interface LabEvent { id: number; at: number; type: string; detail: string }

/** A local development session. React presents this service; it never animates the rig. */
export class LabSession {
  readonly director = new EmbodimentDirector({ seed: 71421 });
  readonly metrics = new LatencyMetrics();
  events: LabEvent[] = [];
  paused = false;
  pointerTracking = true;
  state: ConversationState = 'idle';
  emotion: Emotion = 'neutral';
  intensity = 0.55;
  speechEnergy = 0;
  reducedMotion = false;
  poseOverrides: Partial<Pick<AvatarFrame, 'headTilt' | 'eyeOpenness' | 'mouthOpen' | 'smile' | 'frown'>> = {};
  elapsedMs = 0;
  private nextId = 0;
  private hovered = false;
  private lastAwakeState: Exclude<ConversationState, 'sleeping'> = 'idle';
  private timeline: DemoTimeline | null = null;
  private pendingStateMetric?: () => number;
  private pendingAffectMetric?: () => number;

  constructor() { this.log('runtime.ready', 'Local life engine initialized'); }
  get frame(): AvatarFrame { return { ...this.director.getSnapshot(), ...this.poseOverrides }; }
  get demo(): DemoStatus | null { return this.timeline?.snapshot() ?? null; }
  get touring(): boolean { return this.timeline?.kind === 'states'; }
  tick(deltaMs: number): AvatarFrame {
    if (this.paused) return this.frame;
    const delta = Math.min(64, Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0));
    this.elapsedMs += delta;
    if (this.timeline) {
      const sample = this.timeline.advance(delta);
      if (sample.phase !== this.state) this.applyState(sample.phase);
      this.applySpeechEnergy(sample.speechEnergy);
      if (sample.done) {
        this.timeline = null;
        this.log('demo.completed', sample.kind);
      }
    }
    const frame = this.director.tick(delta);
    this.pendingStateMetric?.(); this.pendingStateMetric = undefined;
    this.pendingAffectMetric?.(); this.pendingAffectMetric = undefined;
    return { ...frame, ...this.poseOverrides };
  }
  setState(state: ConversationState): void {
    this.cancelDemo('manual state');
    this.applyState(state);
  }
  private applyState(state: ConversationState): void {
    this.state = state;
    if (state !== 'sleeping') this.lastAwakeState = state;
    if (state !== 'speaking') this.speechEnergy = 0;
    this.pendingStateMetric = this.metrics.start('avatar_state_latency_ms');
    this.director.setConversationState(state);
    this.log('conversation.state', state);
  }
  setAwake(awake: boolean): void {
    this.cancelDemo('awake control');
    if (!awake && this.state !== 'sleeping') this.lastAwakeState = this.state;
    this.director.setAwake(awake);
    this.state = awake ? this.lastAwakeState : 'sleeping';
    this.speechEnergy = 0;
    this.log('embodiment.awake', String(awake));
  }
  setEmotion(emotion: Emotion): void {
    this.emotion = emotion;
    this.pendingAffectMetric = this.metrics.start('affect_latency_ms');
    this.director.setEmotion(emotion, this.intensity);
    this.log('embodiment.affect', `${emotion} · ${this.intensity.toFixed(2)}`);
  }
  setIntensity(value: number): void {
    this.intensity = Math.max(0, Math.min(1, value));
    this.director.setEmotion(this.emotion, this.intensity);
  }
  setSpeechEnergy(value: number): void {
    this.cancelDemo('manual speech energy');
    this.applySpeechEnergy(value);
  }
  private applySpeechEnergy(value: number): void {
    this.speechEnergy = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    this.director.setSpeechEnergy(this.speechEnergy);
  }
  gesture(gesture: Gesture): void {
    this.director.triggerGesture(gesture);
    this.log('embodiment.gesture', gesture);
  }
  pointer(x: number, y: number, proximity: number, hovered: boolean): void {
    if (!this.pointerTracking) return;
    this.director.setPointer({ x, y, proximity, hovered });
    if (hovered !== this.hovered) {
      this.hovered = hovered;
      this.log(hovered ? 'pointer.enter' : 'pointer.leave', hovered ? 'Curious attention' : 'Return to ambient attention');
    }
  }
  setTracking(enabled: boolean): void {
    this.pointerTracking = enabled;
    this.director.pointerLeave();
    this.hovered = false;
    this.log('pointer.tracking', enabled ? 'enabled' : 'disabled');
  }
  pointerLeave(): void {
    this.director.pointerLeave();
    if (this.hovered) this.log('pointer.leave', 'Return to ambient attention');
    this.hovered = false;
  }
  gaze(x: number, y: number): void {
    this.setTracking(false);
    this.director.setGaze(x, y);
  }
  setPoseOverride(field: keyof LabSession['poseOverrides'], value: number): void {
    this.cancelDemo('manual pose');
    const min = field === 'headTilt' ? -1 : 0;
    this.poseOverrides[field] = Math.min(1, Math.max(min, Number.isFinite(value) ? value : 0));
    this.log('rig.override', `${field} = ${this.poseOverrides[field]?.toFixed(2)}`);
  }
  clearPoseOverrides(): void { this.poseOverrides = {}; this.log('rig.override.cleared', 'Local life controls restored'); }
  click(): void {
    if (this.state === 'sleeping') this.setState('idle');
    this.director.reactToClick(); this.log('pointer.click', 'Local contextual reaction');
  }
  setPaused(value: boolean): void { this.paused = value; this.log('runtime.motion', value ? 'paused' : 'resumed'); }
  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.director.setReducedMotion(value);
    this.log('runtime.reduced_motion', String(value));
  }
  reset(): void {
    this.cancelDemo('reset');
    this.paused = false;
    this.state = 'idle';
    this.lastAwakeState = 'idle';
    this.emotion = 'neutral';
    this.intensity = 0.55;
    this.speechEnergy = 0;
    this.poseOverrides = {};
    this.director.resetToIdle();
    this.director.setEmotion('neutral', 0.55);
    this.director.setSpeechEnergy(0);
    this.setTracking(true);
    this.log('runtime.reset', 'Idle · neutral · cursor attention');
  }
  toggleTour(): void {
    if (this.touring) this.stopDemo();
    else this.playStateDemo();
  }
  playSpeakingDemo(): void { this.startDemo('speaking'); }
  playStateDemo(): void { this.startDemo('states'); }
  stopDemo(): void {
    this.cancelDemo('stop');
    this.applyState('idle');
    this.applySpeechEnergy(0);
  }
  private startDemo(kind: DemoKind): void {
    this.cancelDemo('restart');
    this.paused = false;
    this.poseOverrides = {};
    this.director.resetToIdle();
    this.director.setEmotion(this.emotion, this.intensity);
    this.timeline = new DemoTimeline(kind);
    const first = this.timeline.snapshot();
    this.applyState(first.phase);
    this.applySpeechEnergy(0);
    this.log('demo.started', kind === 'speaking' ? 'Speaking · 8s synthetic visual envelope · no audio' : 'Idle 2s · Listening 3s · Thinking 3s · Speaking 5s · Idle 2s');
  }
  private cancelDemo(reason: string): void {
    if (!this.timeline) return;
    const kind = this.timeline.kind;
    this.timeline = null;
    // Interrupt cached speech even while motion is paused, then preserve the selected state.
    // The caller may choose idle or another state after cancellation; affect is untouched.
    this.director.setConversationState('idle');
    this.director.setConversationState(this.state);
    this.applySpeechEnergy(0);
    this.log('demo.cancelled', `${kind} · ${reason}`);
  }
  clearEvents(): void { this.events = []; }
  log(type: string, detail: string): void {
    this.events = [{ id: this.nextId++, at: this.elapsedMs, type, detail }, ...this.events].slice(0, 120);
  }
}
