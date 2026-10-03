import { clamp, type GazeTarget } from '@amyu/avatar-contract';
import { approach, SeededRandom, smoothstep } from './math';

export interface LocalLifeFrame {
  blink: number;
  breathing: number;
  headX: number;
  headY: number;
  tilt: number;
  postureX: number;
  postureY: number;
  gaze: GazeTarget;
}

/** Calm autonomous behavior. Timers are advanced exclusively by the director clock. */
export class LocalLifeEngine {
  private readonly random: SeededRandom;
  private readonly phase: number;
  private readonly breathPeriod: number;
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
      this.blinkDurationMs = this.random.between(140, 210);
      if (this.doubleBlink) {
        this.doubleBlink = false;
        this.nextBlinkMs = this.timeMs + this.random.between(2300, 5900);
      } else {
        this.doubleBlink = this.random.next() < 0.12;
        this.nextBlinkMs = this.timeMs + (this.doubleBlink ? this.random.between(280, 420) : this.random.between(2300, 5900));
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
    const closing = blinkProgress / 0.42;
    const opening = (1 - blinkProgress) / 0.58;
    const blink = blinkProgress >= 0 && blinkProgress <= 1 ? smoothstep(Math.min(closing, opening)) : 0;
    const t = this.timeMs / 1000;

    return {
      blink,
      breathing: (Math.sin((this.timeMs / this.breathPeriod) * Math.PI * 2 + this.phase) + 1) / 2,
      headX: Math.sin(t * 0.71 + this.phase) * 0.025 + Math.sin(t * 1.13) * 0.012,
      headY: Math.sin(t * 0.53 + this.phase) * 0.025,
      tilt: Math.sin(t * 0.31 + this.phase) * 0.025,
      postureX: this.posture.x,
      postureY: this.posture.y,
      gaze: { ...this.gaze },
    };
  }
}
