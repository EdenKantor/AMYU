import { describe, expect, it } from 'vitest';
import { LocalLifeEngine, blinkCurve } from '../src/index';

describe('local eye and breathing life', () => {
  it('closes faster than it reopens, holds full closure briefly and rests cleanly', () => {
    expect(blinkCurve(0)).toBe(0); expect(blinkCurve(1)).toBe(0);
    expect(blinkCurve(0.3)).toBe(1); expect(blinkCurve(0.37)).toBe(1);
    expect(blinkCurve(0.2)).toBeGreaterThan(blinkCurve(0.8));
    expect(blinkCurve(Number.NaN)).toBe(0);
  });
  it('varies natural blink intervals, includes occasional pairs and keeps breathing continuous', () => {
    const life = new LocalLifeEngine(71421);
    let previousBlink = false; let lastStart = 0; let previousBreath = life.tick(0).breathing;
    const intervals: number[] = [];
    for (let elapsed = 10; elapsed <= 180_000; elapsed += 10) {
      const frame = life.tick(10);
      const blinking = frame.blink > 0;
      if (blinking && !previousBlink) { if (lastStart) intervals.push(elapsed - lastStart); lastStart = elapsed; }
      expect(Math.abs(frame.breathing - previousBreath)).toBeLessThan(0.01);
      expect(Math.abs(frame.eyeVariation)).toBeLessThan(0.014);
      previousBlink = blinking; previousBreath = frame.breathing;
    }
    const pairs = intervals.filter(interval => interval < 650);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.length).toBeLessThan(intervals.length / 3);
    expect(new Set(intervals).size).toBeGreaterThan(20);
  });
});
