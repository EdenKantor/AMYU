import { EmbodimentDirector } from '@amyu/embodiment';
import type { AvatarFrame, ConversationState, Emotion, Gesture } from '@amyu/avatar-contract';
import { LatencyMetrics } from '@amyu/observability';

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
  private tourIndex = -1;
  private tourElapsed = 0;
  private pendingStateMetric?: () => number;
  private pendingAffectMetric?: () => number;

  constructor() { this.log('runtime.ready', 'Local life engine initialized'); }
  get frame(): AvatarFrame { return { ...this.director.getSnapshot(), ...this.poseOverrides }; }
  get touring(): boolean { return this.tourIndex >= 0; }
  tick(deltaMs: number): AvatarFrame {
    if (this.paused) return this.frame;
    const delta = Math.min(64, Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0));
    this.elapsedMs += delta;
    if (this.touring) {
      this.tourElapsed += delta;
      if (this.state === 'speaking') { this.speechEnergy = 0.3 + Math.abs(Math.sin(this.elapsedMs / 140)) * 0.6; this.director.setSpeechEnergy(this.speechEnergy); }
      if (this.tourElapsed >= 2200) { this.tourElapsed = 0; this.advanceTour(); }
    }
    const frame = this.director.tick(delta);
    this.pendingStateMetric?.(); this.pendingStateMetric = undefined;
    this.pendingAffectMetric?.(); this.pendingAffectMetric = undefined;
    return { ...frame, ...this.poseOverrides };
  }
  setState(state: ConversationState): void {
    this.state = state;
    if (state !== 'sleeping') this.lastAwakeState = state;
    if (state !== 'speaking') this.speechEnergy = 0;
    this.pendingStateMetric = this.metrics.start('avatar_state_latency_ms');
    this.director.setConversationState(state);
    this.log('conversation.state', state);
  }
  setAwake(awake: boolean): void {
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
    this.speechEnergy = Math.max(0, Math.min(1, value));
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
    this.tourIndex = -1;
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
    if (this.touring) { this.reset(); return; }
    this.paused = false;
    this.tourIndex = 0;
    this.tourElapsed = 0;
    this.applyTourStep();
    this.log('scenario.started', 'Six states · local deterministic sequence');
  }
  clearEvents(): void { this.events = []; }
  log(type: string, detail: string): void {
    this.events = [{ id: this.nextId++, at: this.elapsedMs, type, detail }, ...this.events].slice(0, 120);
  }
  private advanceTour(): void {
    this.tourIndex++;
    if (this.tourIndex >= 6) { this.reset(); this.log('scenario.completed', 'All six conversation states exercised'); }
    else this.applyTourStep();
  }
  private applyTourStep(): void {
    const steps: [ConversationState, Emotion, Gesture][] = [
      ['idle', 'neutral', 'bounce'], ['listening', 'curious', 'head_tilt'],
      ['thinking', 'focused', 'shrug'], ['speaking', 'happy', 'nod'],
      ['acting', 'excited', 'wave'], ['sleeping', 'neutral', 'nod']
    ];
    const [state, emotion, gesture] = steps[this.tourIndex];
    this.setState(state); this.setEmotion(emotion); this.gesture(gesture);
    if (state !== 'speaking') this.director.setSpeechEnergy(0);
  }
}
