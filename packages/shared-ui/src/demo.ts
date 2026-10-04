import { clamp, type ConversationState } from '@amyu/avatar-contract';

export type DemoKind = 'speaking' | 'states';

export interface DemoStatus {
  kind: DemoKind;
  phase: ConversationState;
  phaseIndex: number;
  phaseRemainingMs: number;
  elapsedMs: number;
  durationMs: number;
  remainingMs: number;
  progress: number;
  speechEnergy: number;
  done: boolean;
}

interface DemoPhase { state: ConversationState; durationMs: number }

export const speakingDemoDurationMs = 8000;
export const stateDemoPhases: readonly DemoPhase[] = [
  { state: 'idle', durationMs: 2000 },
  { state: 'listening', durationMs: 3000 },
  { state: 'thinking', durationMs: 3000 },
  { state: 'speaking', durationMs: 5000 },
  { state: 'idle', durationMs: 2000 },
];

// A silent visual sample with syllable-sized peaks, phrases and deliberate rest pauses.
// Time is relative to this demo, never to the companion's accumulated lifetime.
const speechKeyframes: readonly (readonly [number, number])[] = [
  [0, 0], [250, 0], [380, 0.25], [510, 0.7], [650, 0.35], [800, 0.9],
  [960, 0.15], [1100, 0.6], [1240, 0.3], [1380, 0.8], [1520, 0.2],
  [1690, 0.65], [1880, 0], [2250, 0], [2380, 0.3], [2500, 0.85],
  [2660, 0.4], [2840, 0.95], [3000, 0.25], [3150, 0.7], [3330, 0.1],
  [3500, 0.6], [3660, 0.3], [3830, 0], [4350, 0], [4470, 0.2],
  [4630, 0.8], [4820, 0.35], [4970, 1], [5150, 0.3], [5320, 0.65],
  [5510, 0.15], [5680, 0.75], [5850, 0.25], [6050, 0], [6400, 0],
  [6540, 0.25], [6690, 0.7], [6840, 0.35], [7000, 0.85], [7150, 0.2],
  [7300, 0.55], [7500, 0], [8000, 0],
];

/** Deterministic amplitude target; director attack/release smoothing supplies the envelope. */
export function syntheticSpeechEnergy(timeMs: number, durationMs = speakingDemoDurationMs): number {
  if (!Number.isFinite(timeMs) || !Number.isFinite(durationMs) || durationMs <= 0 || timeMs <= 0 || timeMs >= durationMs) return 0;
  const sampleMs = timeMs / durationMs * speakingDemoDurationMs;
  for (let index = 1; index < speechKeyframes.length; index++) {
    const [endMs, endEnergy] = speechKeyframes[index];
    if (sampleMs > endMs) continue;
    const [startMs, startEnergy] = speechKeyframes[index - 1];
    const fraction = clamp((sampleMs - startMs) / (endMs - startMs));
    const smooth = fraction * fraction * (3 - 2 * fraction);
    return startEnergy + (endEnergy - startEnergy) * smooth;
  }
  return 0;
}

/** One finite, caller-clocked visual demo. No timers, audio playback or network dependency. */
export class DemoTimeline {
  private elapsedMs = 0;
  private readonly phases: readonly DemoPhase[];
  readonly durationMs: number;

  constructor(readonly kind: DemoKind) {
    this.phases = kind === 'speaking' ? [{ state: 'speaking', durationMs: speakingDemoDurationMs }] : stateDemoPhases;
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
      remainingMs, progress: this.elapsedMs / this.durationMs,
    };
    if (remainingMs === 0) return { ...common, phase: 'idle', phaseIndex: this.phases.length, phaseRemainingMs: 0, speechEnergy: 0, done: true };
    let phaseStart = 0;
    for (let phaseIndex = 0; phaseIndex < this.phases.length; phaseIndex++) {
      const phase = this.phases[phaseIndex];
      if (this.elapsedMs < phaseStart + phase.durationMs) {
        const phaseTime = this.elapsedMs - phaseStart;
        return {
          ...common, phase: phase.state, phaseIndex,
          phaseRemainingMs: phase.durationMs - phaseTime,
          speechEnergy: phase.state === 'speaking' ? syntheticSpeechEnergy(phaseTime, phase.durationMs) : 0,
          done: false,
        };
      }
      phaseStart += phase.durationMs;
    }
    throw new Error('Demo timeline phase is missing');
  }
}
