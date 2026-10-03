import { clamp } from '@amyu/avatar-contract';

/** Continuous exponential response: a time constant is independent of frame rate. */
export function approach(current: number, target: number, deltaMs: number, timeConstantMs: number): number {
  return current + (target - current) * (1 - Math.exp(-deltaMs / timeConstantMs));
}

export function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/** Reproducible local randomness. No global Math.random or wall clock. */
export class SeededRandom {
  private value: number;

  constructor(seed: number) { this.value = (Number.isFinite(seed) ? seed : 0) >>> 0; }

  next(): number {
    this.value = (this.value + 0x6d2b79f5) >>> 0;
    let t = this.value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  between(min: number, max: number): number { return min + this.next() * (max - min); }
}
