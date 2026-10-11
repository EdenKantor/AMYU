import { clamp, isGesture, type ConversationState, type Gesture } from '@amyu/avatar-contract';
import { blinkCurve, gestureDurations } from '@amyu/embodiment';

export type DemoKind = 'speaking' | 'states' | 'eyes' | 'stress' | 'gestures';
export interface DemoStatus {
  kind: DemoKind;
  phase: ConversationState;
  label: string;
  phaseIndex: number;
  phaseCount: number;
  repetition: number | null;
  phaseRemainingMs: number;
  elapsedMs: number;
  durationMs: number;
  remainingMs: number;
  progress: number;
  speechEnergy: number;
  gesture: Gesture | null;
  eyeOpenness: number | null;
  blink: number | null;
  done: boolean;
}
interface DemoPhase {
  state: ConversationState; label: string; durationMs: number;
  repetition?: number; gesture?: Gesture; eyes?: 'single' | 'double';
}
export const speakingDemoDurationMs = 12_000;
export const eyeDemoDurationMs = 20_000;
export const stateDemoPhases: readonly DemoPhase[] = [
  { state: 'idle', label: 'Idle', durationMs: 4000 },
  { state: 'listening', label: 'Listening', durationMs: 5000 },
  { state: 'thinking', label: 'Thinking', durationMs: 5000 },
  { state: 'speaking', label: 'Speaking', durationMs: 10_000 },
  { state: 'acting', label: 'Acting', durationMs: 4000 },
  { state: 'sleeping', label: 'Sleeping', durationMs: 5000 },
  { state: 'idle', label: 'Wake', durationMs: 2000 },
  { state: 'idle', label: 'Idle return', durationMs: 3000 },
];

// Irregular syllables grouped into phrases and sentences. Each pulse reaches
// rest; spacing supplies micro, phrase and sentence pauses.
const syllables: readonly (readonly [number, number, number])[] = [
  [320, 150, 0.42], [520, 210, 0.84], [790, 150, 0.55],
  [1140, 310, 0.96], [1510, 140, 0.38], [1720, 230, 0.72],
  [2460, 180, 0.58], [2700, 270, 0.9], [3020, 150, 0.35],
  [3230, 340, 0.76], [3660, 210, 0.48], [3950, 290, 1],
  [5110, 160, 0.32], [5330, 220, 0.64], [5600, 360, 0.93],
  [6030, 150, 0.45], [6270, 240, 0.7],
  [7100, 280, 0.86], [7440, 150, 0.5], [7660, 190, 0.65],
  [7940, 400, 0.98], [8420, 170, 0.4], [8660, 300, 0.8],
  [9670, 180, 0.54], [9940, 250, 0.88], [10270, 150, 0.37],
  [10490, 310, 0.69], [10910, 210, 0.46],
];
/** Silent sentence cadence; amplitude smoothing remains in the director. */
export function syntheticSpeechEnergy(timeMs: number, durationMs = speakingDemoDurationMs): number {
  if (!Number.isFinite(timeMs) || !Number.isFinite(durationMs) || durationMs <= 0 || timeMs <= 0 || timeMs >= durationMs) return 0;
  const sampleMs = timeMs / durationMs * speakingDemoDurationMs;
  for (const [start, duration, peak] of syllables) {
    const p = (sampleMs - start) / duration;
    if (p < 0 || p >= 1) continue;
    const ramp = p < 0.22 ? p / 0.22 : p < 0.4 ? 1 : (1 - p) / 0.6;
    const eased = clamp(ramp);
    return peak * eased * eased * (3 - 2 * eased);
  }
  return 0;
}
function uniqueGestures(values: readonly Gesture[]): Gesture[] {
  return [...new Set(values.filter(isGesture))];
}
function stressPhases(supported: readonly Gesture[]): DemoPhase[] {
  const result: DemoPhase[] = [];
  const add = (state: ConversationState, durationMs: number, label: string, repetition?: number, gesture?: Gesture) => result.push({ state, durationMs, label, repetition, gesture });
  // Ten destinations produce the nine requested edges, in the exact order.
  for (const state of ['idle', 'listening', 'thinking', 'speaking', 'listening', 'speaking', 'thinking', 'idle', 'sleeping', 'idle'] as const) add(state, 1500, `Edge review · ${state}`);
  for (let repetition = 1; repetition <= 10; repetition++) {
    add('listening', 1000, 'Idle ↔ Listening', repetition);
    add('idle', 1000, 'Idle ↔ Listening', repetition);
  }
  for (let repetition = 1; repetition <= 10; repetition++) {
    for (const state of ['listening', 'thinking', 'speaking'] as const) add(state, 500, 'Rapid 500ms transition', repetition);
  }
  for (const state of ['speaking', 'thinking'] as const) {
    for (let repetition = 1; repetition <= 10; repetition++) {
      add(state, 1000, `${state} → Idle`, repetition);
      add('idle', 1000, `${state} → Idle`, repetition);
    }
  }
  if (supported.includes('wave')) for (let repetition = 1; repetition <= 10; repetition++) {
    // Alternate natural completion and deliberate interruption.
    add('idle', repetition % 2 ? gestureDurations.wave + 150 : 650, 'Wave → Idle', repetition, 'wave');
    add('idle', 1000, 'Wave neutral return', repetition);
  }
  add('idle', 2000, 'Neutral return');
  return result;
}
function gesturePhases(supported: readonly Gesture[]): DemoPhase[] {
  if (!supported.length) return [{ state: 'idle', label: 'No verified supported gesture', durationMs: 2000 }];
  const result: DemoPhase[] = [];
  for (const gesture of supported) for (const state of ['idle', 'listening', 'thinking', 'speaking'] as const) {
    result.push({ state, label: `${gesture} from ${state}`, durationMs: gestureDurations[gesture] + 300, gesture });
    result.push({ state: 'idle', label: 'Gesture neutral return', durationMs: 1200 });
    result.push({ state, label: `${gesture} interruption`, durationMs: 500, gesture });
    result.push({ state: 'idle', label: 'Interrupted gesture neutral return', durationMs: 1200 });
  }
  result.push({ state: 'idle', label: 'Neutral return', durationMs: 2000 });
  return result;
}
/** Finite development QA only. The application supplies time and asset support. */
export class DemoTimeline {
  private elapsedMs = 0;
  private readonly phases: readonly DemoPhase[];
  readonly durationMs: number;
  constructor(readonly kind: DemoKind, supportedGestures: readonly Gesture[] = []) {
    const supported = uniqueGestures(supportedGestures);
    this.phases = kind === 'states' ? stateDemoPhases : kind === 'speaking'
      ? [{ state: 'speaking', label: 'Sentence cadence', durationMs: speakingDemoDurationMs }]
      : kind === 'eyes' ? [
        { state: 'idle', label: 'Relaxed eyes', durationMs: 2000 },
        { state: 'listening', label: 'Attentive eyes', durationMs: 3000 },
        { state: 'thinking', label: 'Thinking eyes', durationMs: 3000 },
        { state: 'speaking', label: 'Speaking eyes', durationMs: 3000 },
        { state: 'idle', label: 'Single blink', durationMs: 2000, eyes: 'single' },
        { state: 'idle', label: 'Double blink', durationMs: 2000, eyes: 'double' },
        { state: 'sleeping', label: 'Closed sleeping eyes', durationMs: 3000 },
        { state: 'idle', label: 'Wake eye return', durationMs: 2000 },
      ] : kind === 'stress' ? stressPhases(supported) : gesturePhases(supported);
    this.durationMs = this.phases.reduce((sum, phase) => sum + phase.durationMs, 0);
  }
  advance(deltaMs: number): DemoStatus {
    if (Number.isFinite(deltaMs) && deltaMs > 0) this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + deltaMs);
    return this.snapshot();
  }
  snapshot(): DemoStatus {
    const remainingMs = Math.max(0, this.durationMs - this.elapsedMs);
    const common = {
      kind: this.kind, elapsedMs: this.elapsedMs, durationMs: this.durationMs,
      remainingMs, progress: this.elapsedMs / this.durationMs, phaseCount: this.phases.length,
    };
    if (remainingMs === 0) return { ...common, phase: 'idle', label: 'Complete', phaseIndex: this.phases.length, repetition: null, phaseRemainingMs: 0, speechEnergy: 0, gesture: null, eyeOpenness: null, blink: null, done: true };
    let phaseStart = 0;
    for (let phaseIndex = 0; phaseIndex < this.phases.length; phaseIndex++) {
      const phase = this.phases[phaseIndex];
      if (this.elapsedMs < phaseStart + phase.durationMs) {
        const phaseTime = this.elapsedMs - phaseStart;
        let blink: number | null = null;
        if (phase.eyes) {
          blink = blinkCurve((phaseTime - 500) / 260);
          if (phase.eyes === 'double') blink = Math.max(blink, blinkCurve((phaseTime - 890) / 240));
        }
        return {
          ...common, phase: phase.state, label: phase.label, phaseIndex, repetition: phase.repetition ?? null,
          phaseRemainingMs: phase.durationMs - phaseTime,
          // Short stress/gesture phases sample the start of a sentence; do not
          // squeeze an entire sentence into a 500ms transition.
          speechEnergy: phase.state === 'speaking' ? syntheticSpeechEnergy(phaseTime, this.kind === 'states' ? phase.durationMs : speakingDemoDurationMs) : 0,
          gesture: phase.gesture ?? null, blink, eyeOpenness: blink === null ? null : 0.86 * (1 - blink), done: false,
        };
      }
      phaseStart += phase.durationMs;
    }
    throw new Error('Demo timeline phase is missing');
  }
}
