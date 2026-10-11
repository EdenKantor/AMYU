import { clamp, type GazeTarget } from '@amyu/avatar-contract';
import { approach, SeededRandom, smoothstep } from './math';

export interface LocalLifeFrame {
  blink: number;
  breathing: number;
  eyeVariation: number;
  headX: number;
  headY: number;
  tilt: number;
  postureX: number;
  postureY: number;
  gaze: GazeTarget;
}

/** Fast close, a short closed hold, and a slower, soft reopening. */
export function blinkCurve(progress: number): number {
  if (!Number.isFinite(progress) || progress <= 0 || progress >= 1) return 0;
  if (progress < 0.28) return smoothstep(progress / 0.28);
  if (progress < 0.38) return 1;
  return smoothstep((1 - progress) / 0.62);
}

/** Calm autonomous behavior. Timers are advanced exclusively by the director clock. */
export class LocalLifeEngine {
  private readonly random: SeededRandom;
  private readonly phase: number;
  private breathPeriod: number;
  private breathPhase: number;
  private timeMs = 0;
  private nextBlinkMs: number;
  private blinkStartMs = Number.NEGATIVE_INFINITY;
  private blinkDurationMs = 180;
  private doubleBlink = false;
  private nextSaccadeMs: number;
  private nextPostureMs: number;
  private gaze = { x: 0, y: 0 };
  private gazeTarget = { x: 0, y: 0 };
  private posture = { x: 0, y: 0 };
  private postureTarget = { x: 0, y: 0 };

  constructor(seed = 42) {
    this.random = new SeededRandom(seed);
    this.phase = this.random.between(0, Math.PI * 2);
    this.breathPhase = this.phase;
    this.breathPeriod = this.random.between(3800, 4800);
    this.nextBlinkMs = this.random.between(1400, 4400);
    this.nextSaccadeMs = this.random.between(1100, 3000);
    this.nextPostureMs = this.random.between(5000, 9000);
  }

  tick(deltaMs: number): LocalLifeFrame {
    deltaMs = clamp(deltaMs, 0, 64);
    this.timeMs += deltaMs;

    if (this.timeMs >= this.nextBlinkMs) {
      this.blinkStartMs = this.timeMs;
      this.blinkDurationMs = this.random.between(210, 290);
      if (this.doubleBlink) {
        this.doubleBlink = false;
        this.nextBlinkMs = this.timeMs + this.random.between(2400, 6200);
      } else {
        this.doubleBlink = this.random.next() < 0.12;
        this.nextBlinkMs = this.timeMs + (this.doubleBlink ? this.blinkDurationMs + this.random.between(90, 170) : this.random.between(2400, 6200));
      }
    }

    if (this.timeMs >= this.nextSaccadeMs) {
      this.gazeTarget = { x: this.random.between(-0.26, 0.26), y: this.random.between(-0.15, 0.18) };
      this.nextSaccadeMs = this.timeMs + this.random.between(1500, 4600);
    }

    if (this.timeMs >= this.nextPostureMs) {
      this.postureTarget = { x: this.random.between(-0.09, 0.09), y: this.random.between(-0.045, 0.06) };
      this.nextPostureMs = this.timeMs + this.random.between(6000, 13000);
    }

    this.gaze.x = approach(this.gaze.x, this.gazeTarget.x, deltaMs, 90);
    this.gaze.y = approach(this.gaze.y, this.gazeTarget.y, deltaMs, 90);
    this.posture.x = approach(this.posture.x, this.postureTarget.x, deltaMs, 1600);
    this.posture.y = approach(this.posture.y, this.postureTarget.y, deltaMs, 1600);

    const blinkProgress = (this.timeMs - this.blinkStartMs) / this.blinkDurationMs;
    const blink = blinkCurve(blinkProgress);
    this.breathPhase += deltaMs / this.breathPeriod * Math.PI * 2;
    if (this.breathPhase >= Math.PI * 2) {
      this.breathPhase %= Math.PI * 2;
      // Change timing at a cycle boundary; the phase itself never jumps.
      this.breathPeriod = this.random.between(3800, 5200);
    }
    const t = this.timeMs / 1000;

    return {
      blink,
      breathing: (Math.sin(this.breathPhase) + 1) / 2,
      eyeVariation: Math.sin(t * 0.43 + this.phase) * 0.009 + Math.sin(t * 0.91) * 0.004,
      headX: Math.sin(t * 0.71 + this.phase) * 0.025 + Math.sin(t * 1.13) * 0.012,
      headY: Math.sin(t * 0.53 + this.phase) * 0.025,
      tilt: Math.sin(t * 0.31 + this.phase) * 0.025,
      postureX: this.posture.x,
      postureY: this.posture.y,
      gaze: { ...this.gaze },
    };
  }
}
