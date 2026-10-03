import {
  clamp, conversationStates, emotions, isConversationState, isEmotion, isGesture, normalizeGaze,
  type AvatarController, type AvatarFrame, type ConversationState, type Emotion,
  type GazeTarget, type Gesture, type GestureFrame, type PersonalityProfile, type PresenceState,
} from '@amyu/avatar-contract';
import { gestureDurations, gesturePose } from './gestures';
import { GazeController } from './gaze';
import { LocalLifeEngine } from './local-life';
import { approach } from './math';

export interface PointerContext extends GazeTarget {
  /** Distance normalized by the renderer: 0 = far away, 1 = close. */
  proximity: number;
  hovered: boolean;
}

export interface EmbodimentOptions {
  seed?: number;
  reducedMotion?: boolean;
  personality?: Partial<PersonalityProfile>;
}

function weights<T extends string>(names: readonly T[], first: T): Record<T, number> {
  return Object.fromEntries(names.map((name) => [name, name === first ? 1 : 0])) as Record<T, number>;
}

/** Semantic intent + deterministic local life -> renderer-independent physical pose. */
export class EmbodimentDirector implements AvatarController {
  private readonly life: LocalLifeEngine;
  private readonly gazeController: GazeController;
  private readonly personality: PersonalityProfile;
  private timeMs = 0;
  private state: ConversationState = 'idle';
  private lastAwakeState: Exclude<ConversationState, 'sleeping'> = 'idle';
  private lifecycle: { kind: 'wake' | 'sleep'; elapsedMs: number } | null = null;
  private emotion: Emotion = 'neutral';
  private targetIntensity = 0;
  private intensity = 0;
  private presence: PresenceState = 'present';
  private presenceAmount = 1;
  private reducedMotion: boolean;
  private stateBlend = weights(conversationStates, 'idle');
  private emotionBlend = weights(emotions, 'neutral');
  private manualGaze: (GazeTarget & { weight: number }) | null = null;
  private pointer: PointerContext | null = null;
  private gaze: GazeTarget = { x: 0, y: 0 };
  private hoverAmount = 0;
  private speechTarget = 0;
  private speechEnergy = 0;
  private gestureQueue: Gesture[] = [];
  private activeGesture: { name: Gesture; elapsedMs: number } | null = null;
  private clickTimes: number[] = [];
  private clickResponse = 0;
  private playfulConfusion = 0;
  private snapshot: AvatarFrame;

  constructor(options: EmbodimentOptions = {}) {
    this.life = new LocalLifeEngine(options.seed ?? 42);
    this.gazeController = new GazeController({ seed: (options.seed ?? 42) + 71 });
    this.reducedMotion = options.reducedMotion ?? false;
    this.personality = {
      calmness: clamp(options.personality?.calmness ?? 0.75),
      expressiveness: clamp(options.personality?.expressiveness ?? 0.8),
      playfulness: clamp(options.personality?.playfulness ?? 0.65),
    };
    this.snapshot = this.compose(0);
  }

  setConversationState(state: ConversationState): void {
    if (!isConversationState(state)) throw new TypeError('Unknown conversation state');
    if (this.state === 'sleeping' && state !== 'sleeping') this.lifecycle = { kind: 'wake', elapsedMs: 0 };
    if (this.state !== 'sleeping' && state === 'sleeping') this.lifecycle = { kind: 'sleep', elapsedMs: 0 };
    if (state !== 'sleeping') this.lastAwakeState = state;
    this.state = state;
    // Interruptions must stop mouth energy immediately even while posture blends out.
    if (state !== 'speaking') { this.speechTarget = 0; this.speechEnergy = 0; }
  }

  setEmotion(emotion: Emotion, intensity: number): void {
    if (!isEmotion(emotion)) throw new TypeError('Unknown emotion');
    this.emotion = emotion;
    this.targetIntensity = clamp(intensity);
  }

  setGaze(x: number, y: number, weight = 1): void {
    this.manualGaze = { ...normalizeGaze({ x, y }), weight: clamp(weight) };
    this.pointer = null;
  }
  setAwake(awake: boolean): void {
    if (!awake && this.state !== 'sleeping') this.setConversationState('sleeping');
    else if (awake && this.state === 'sleeping') this.setConversationState(this.lastAwakeState);
  }
  setSpeechEnergy(value: number): void { this.speechTarget = clamp(value); }
  setReducedMotion(value: boolean): void { this.reducedMotion = value; }

  setPresenceState(state: PresenceState): void {
    if (!['present', 'away', 'hidden'].includes(state)) throw new TypeError('Unknown presence state');
    this.presence = state;
  }

  setPointer(pointer: PointerContext): void {
    this.pointer = { ...normalizeGaze(pointer), proximity: clamp(pointer.proximity), hovered: Boolean(pointer.hovered) };
    this.manualGaze = null;
  }

  pointerLeave(): void { this.pointer = null; }

  reactToClick(): void {
    if (this.state === 'sleeping') this.setConversationState('idle');
    this.clickTimes = this.clickTimes.filter((time) => this.timeMs - time < 1400);
    this.clickTimes.push(this.timeMs);
    this.clickTimes = this.clickTimes.slice(-8);
    this.clickResponse = this.personality.playfulness;
    if (this.clickTimes.length >= 4) {
      this.playfulConfusion = 1;
      this.triggerGesture('shake_head');
    } else this.triggerGesture(this.clickTimes.length % 2 === 0 ? 'head_tilt' : 'bounce');
  }

  triggerGesture(gesture: Gesture): void {
    if (!isGesture(gesture)) throw new TypeError('Unknown gesture');
    // Keep current movement smooth under repeated clicks; never accumulate unbounded work.
    if (this.gestureQueue.length >= 3) this.gestureQueue.shift();
    this.gestureQueue.push(gesture);
  }

  resetToIdle(): void {
    this.state = 'idle'; this.emotion = 'neutral'; this.targetIntensity = 0;
    this.lastAwakeState = 'idle'; this.lifecycle = null;
    this.speechTarget = 0; this.speechEnergy = 0;
    this.manualGaze = null; this.pointer = null;
    this.gestureQueue = []; this.activeGesture = null;
    this.clickTimes = []; this.clickResponse = 0; this.playfulConfusion = 0;
  }

  /** Clock is caller-owned. A resumed tab never replays minutes of hidden motion. */
  tick(deltaMs: number): AvatarFrame {
    const dt = clamp(deltaMs, 0, 64);
    if (dt === 0) return this.getSnapshot();
    this.timeMs += dt;
    for (const state of conversationStates) this.stateBlend[state] = approach(this.stateBlend[state], state === this.state ? 1 : 0, dt, 220);
    for (const emotion of emotions) {
      const target = emotion === this.emotion ? this.targetIntensity : 0;
      const neutral = emotion === 'neutral' ? 1 - (this.emotion === 'neutral' ? 0 : this.targetIntensity) : target;
      this.emotionBlend[emotion] = approach(this.emotionBlend[emotion], neutral, dt, 330);
    }
    this.intensity = approach(this.intensity, this.targetIntensity, dt, 330);
    this.presenceAmount = approach(this.presenceAmount, this.presence === 'present' ? 1 : this.presence === 'away' ? 0.45 : 0, dt, 450);
    this.hoverAmount = approach(this.hoverAmount, this.pointer?.hovered ? 1 : 0, dt, 190);
    const energy = this.state === 'speaking' ? this.speechTarget : 0;
    this.speechEnergy = approach(this.speechEnergy, energy, dt, energy > this.speechEnergy ? 35 : 100);
    this.clickResponse = approach(this.clickResponse, 0, dt, 350);
    this.playfulConfusion = approach(this.playfulConfusion, 0, dt, 900);
    if (this.lifecycle) {
      this.lifecycle.elapsedMs += dt;
      if (this.lifecycle.elapsedMs >= 1500) this.lifecycle = null;
    }
    this.advanceGesture(dt);
    this.snapshot = this.compose(dt);
    return this.getSnapshot();
  }

  getSnapshot(): AvatarFrame {
    return {
      ...this.snapshot,
      gaze: { ...this.snapshot.gaze },
      stateWeights: { ...this.snapshot.stateWeights },
      emotionWeights: { ...this.snapshot.emotionWeights },
      gesture: this.snapshot.gesture ? { ...this.snapshot.gesture } : null,
    };
  }

  private advanceGesture(deltaMs: number): void {
    if (this.activeGesture) {
      this.activeGesture.elapsedMs += deltaMs;
      if (this.activeGesture.elapsedMs >= gestureDurations[this.activeGesture.name]) this.activeGesture = null;
    }
    if (!this.activeGesture && this.gestureQueue.length) {
      const name = this.gestureQueue.shift();
      if (name) this.activeGesture = { name, elapsedMs: 0 };
    }
  }

  private compose(deltaMs: number): AvatarFrame {
    const life = this.life.tick(deltaMs);
    const state = this.stateBlend;
    const e = this.emotionBlend;
    const motion = (this.reducedMotion ? 0.18 : 1) * this.presenceAmount * (1 - state.sleeping * 0.85);
    const calm = 1 - this.personality.calmness * 0.45;
    const affect = 0.5 + this.personality.expressiveness * 0.5;
    const thinkingLook = { x: 0.25, y: -0.32 };
    const baseGaze = {
      x: life.gaze.x * (1 - state.listening * 0.85) + thinkingLook.x * state.thinking,
      y: life.gaze.y * (1 - state.listening * 0.85) + thinkingLook.y * state.thinking,
    };
    if (this.pointer) this.gazeController.setTarget(this.pointer.x, this.pointer.y, this.pointer.proximity);
    else if (this.manualGaze) this.gazeController.setTarget(this.manualGaze.x, this.manualGaze.y, this.manualGaze.weight);
    else this.gazeController.clear();
    const gaze = this.gazeController.tick(deltaMs, { idle: state.idle > 0.5, neutral: baseGaze });
    this.gaze = gaze.eyes;

    const gesture: GestureFrame | null = this.activeGesture ? {
      name: this.activeGesture.name,
      progress: clamp(this.activeGesture.elapsedMs / gestureDurations[this.activeGesture.name]),
      intensity: this.reducedMotion ? 0.22 : 1,
    } : null;
    const pose = gesturePose(gesture);
    const smile = clamp((e.happy * 0.85 + e.excited + e.amused * 0.85 + e.empathetic * 0.35 + this.hoverAmount * 0.12) * affect);
    const frown = clamp((e.concerned * 0.6 + e.confused * 0.4 + this.playfulConfusion * 0.2) * affect);
    const anticipation = clamp(this.hoverAmount * 0.42 + state.listening * 0.18 + this.clickResponse * 0.25);
    const awake = 1 - state.sleeping * 0.95;
    const t = this.timeMs / 1000;
    const speakingMotion = Math.sin(t * 5.1) * this.speechEnergy * 0.06;
    const lifecycleLean = this.lifecycle ? Math.sin((this.lifecycle.elapsedMs / 1500) * Math.PI) * (this.lifecycle.kind === 'wake' ? -0.08 : 0.06) : 0;
    return {
      timeMs: this.timeMs, state: this.state, emotion: this.emotion,
      emotionIntensity: this.intensity, presence: this.presence, awake: this.state !== 'sleeping',
      stateWeights: { ...state }, emotionWeights: { ...e }, gaze: normalizeGaze(this.gaze),
      headRotationX: clamp((gaze.head.x + life.headX * calm + pose.headX) * motion, -1, 1),
      headRotationY: clamp((gaze.head.y * 0.72 + life.headY * calm + pose.headY + speakingMotion) * motion + state.sleeping * 0.18, -1, 1),
      headTilt: clamp((life.tilt * calm + e.curious * 0.2 - e.confused * 0.18 + pose.tilt + this.hoverAmount * 0.06) * motion, -1, 1),
      bodyLeanX: clamp((life.postureX + this.gaze.x * 0.055) * motion, -1, 1),
      bodyLeanY: clamp((life.postureY + pose.leanY + lifecycleLean - anticipation * 0.09 + state.acting * Math.sin(t * 1.8) * 0.03) * motion + state.sleeping * 0.12, -1, 1),
      breathing: life.breathing,
      blink: life.blink,
      eyeOpenness: clamp(awake * (1 - life.blink)),
      eyeScale: clamp(1 + (e.surprised * 0.17 + e.excited * 0.08 - e.concerned * 0.06) * affect, 0.75, 1.2),
      eyeSquint: clamp(e.amused * 0.3 + e.focused * 0.18 + this.playfulConfusion * 0.12),
      mouthOpen: clamp(this.speechEnergy * (0.3 + state.speaking * 0.7) + e.surprised * 0.12 * awake),
      speechEnergy: this.speechEnergy,
      mouthWidth: clamp(0.45 + smile * 0.3 - frown * 0.1 - this.speechEnergy * 0.08),
      smile, frown,
      bounce: clamp((pose.bounce + speakingMotion + this.clickResponse * 0.1) * this.presenceAmount, -1, 1),
      anticipation,
      squash: clamp(pose.squash * this.presenceAmount, -1, 1),
      animationEnergy: clamp((0.12 + state.listening * 0.1 + state.thinking * 0.06 + state.acting * 0.2 + this.speechEnergy * 0.4 + e.excited * 0.2) * motion),
      gesture,
    };
  }
}
