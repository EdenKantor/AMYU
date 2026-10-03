import { clamp, normalizeGaze, type GazeTarget } from '@amyu/avatar-contract';
import { approach, SeededRandom } from './math';

export interface GazeControllerOptions {
  seed?: number;
  deadZone?: number;
  maxEyeRange?: number;
  maxHeadRange?: number;
  headWeight?: number;
  eyeResponseMs?: number;
  headResponseMs?: number;
  returnToNeutralMs?: number;
}

export interface GazeFrame {
  eyes: GazeTarget;
  head: GazeTarget;
  trackingWeight: number;
  attentionBreak: boolean;
}

/** Local attention with faster pupils, subtle slower head follow and occasional idle breaks. */
export class GazeController {
  private readonly random: SeededRandom;
  private readonly options: Required<GazeControllerOptions>;
  private target: GazeTarget = { x: 0, y: 0 };
  private targetWeight = 0;
  private weight = 0;
  private eyes: GazeTarget = { x: 0, y: 0 };
  private head: GazeTarget = { x: 0, y: 0 };
  private timeMs = 0;
  private nextBreakMs: number;
  private breakUntilMs = 0;
  private attentionBreak = false;

  constructor(options: GazeControllerOptions = {}) {
    this.options = {
      seed: options.seed ?? 113,
      deadZone: options.deadZone ?? 0.035,
      maxEyeRange: options.maxEyeRange ?? 0.9,
      maxHeadRange: options.maxHeadRange ?? 0.35,
      headWeight: options.headWeight ?? 0.28,
      eyeResponseMs: options.eyeResponseMs ?? 90,
      headResponseMs: options.headResponseMs ?? 320,
      returnToNeutralMs: options.returnToNeutralMs ?? 240,
    };
    const unitOptions = [this.options.deadZone, this.options.maxEyeRange, this.options.maxHeadRange, this.options.headWeight];
    const timeOptions = [this.options.eyeResponseMs, this.options.headResponseMs, this.options.returnToNeutralMs];
    if (unitOptions.some((value) => !Number.isFinite(value) || value < 0 || value > 1) || timeOptions.some((value) => !Number.isFinite(value) || value <= 0)) throw new RangeError('Invalid gaze range or timing');
    this.random = new SeededRandom(this.options.seed);
    this.nextBreakMs = this.random.between(6000, 11_000);
  }

  setTarget(x: number, y: number, weight = 1): void {
    const target = normalizeGaze({ x, y });
    this.target = Math.hypot(target.x, target.y) < this.options.deadZone ? { x: 0, y: 0 } : target;
    this.targetWeight = clamp(weight);
  }

  clear(): void { this.targetWeight = 0; }

  tick(deltaMs: number, context: { idle?: boolean; neutral?: GazeTarget } = {}): GazeFrame {
    const dt = clamp(deltaMs, 0, 64);
    this.timeMs += dt;
    if (context.idle && this.targetWeight > 0.1 && this.timeMs >= this.nextBreakMs) {
      this.breakUntilMs = this.timeMs + this.random.between(650, 1300);
      this.nextBreakMs = this.breakUntilMs + this.random.between(6000, 11_000);
    }
    this.attentionBreak = Boolean(context.idle && this.timeMs < this.breakUntilMs);
    const desiredWeight = this.targetWeight * (this.attentionBreak ? 0.22 : 1);
    this.weight = approach(this.weight, desiredWeight, dt, 120);
    const neutral = normalizeGaze(context.neutral ?? { x: 0, y: 0 });
    const eyeRange = this.options.maxEyeRange;
    const wantedEyes = {
      x: clamp(this.target.x, -eyeRange, eyeRange) * this.weight + neutral.x * (1 - this.weight),
      y: clamp(this.target.y, -eyeRange, eyeRange) * this.weight + neutral.y * (1 - this.weight),
    };
    const eyeResponse = this.targetWeight === 0 ? this.options.returnToNeutralMs : this.options.eyeResponseMs;
    const headRange = this.options.maxHeadRange;
    this.eyes.x = approach(this.eyes.x, clamp(wantedEyes.x, -eyeRange, eyeRange), dt, eyeResponse);
    this.eyes.y = approach(this.eyes.y, clamp(wantedEyes.y, -eyeRange, eyeRange), dt, eyeResponse);
    this.head.x = approach(this.head.x, clamp(wantedEyes.x * this.options.headWeight, -headRange, headRange), dt, this.options.headResponseMs);
    this.head.y = approach(this.head.y, clamp(wantedEyes.y * this.options.headWeight, -headRange, headRange), dt, this.options.headResponseMs);
    return this.getSnapshot();
  }

  getSnapshot(): GazeFrame {
    return { eyes: { ...this.eyes }, head: { ...this.head }, trackingWeight: this.weight, attentionBreak: this.attentionBreak };
  }
}
