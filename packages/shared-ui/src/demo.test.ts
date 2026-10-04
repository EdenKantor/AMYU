import { describe, expect, it } from 'vitest';
import { DemoTimeline, syntheticSpeechEnergy } from './demo';

describe('local visual demo timeline', () => {
  it('uses the exact 15-second state sequence and phase boundaries', () => {
    const demo = new DemoTimeline('states');
    expect(demo.snapshot()).toMatchObject({ phase: 'idle', phaseRemainingMs: 2000, durationMs: 15_000 });
    expect(demo.advance(2000)).toMatchObject({ phase: 'listening', phaseRemainingMs: 3000 });
    expect(demo.advance(3000)).toMatchObject({ phase: 'thinking', phaseRemainingMs: 3000 });
    expect(demo.advance(3000)).toMatchObject({ phase: 'speaking', phaseRemainingMs: 5000, speechEnergy: 0 });
    expect(demo.advance(5000)).toMatchObject({ phase: 'idle', phaseRemainingMs: 2000, speechEnergy: 0 });
    expect(demo.advance(2000)).toMatchObject({ phase: 'idle', done: true, progress: 1, remainingMs: 0, speechEnergy: 0 });
    expect(demo.advance(10_000).elapsedMs).toBe(15_000);
  });

  it('provides an eight-second dynamic silent speaking sample with genuine rest pauses', () => {
    const demo = new DemoTimeline('speaking');
    let maxEnergy = 0;
    let zeroSamples = 0;
    const energies = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const frame = demo.advance(20);
      maxEnergy = Math.max(maxEnergy, frame.speechEnergy);
      if (frame.speechEnergy === 0) zeroSamples++;
      energies.add(Math.round(frame.speechEnergy * 100));
    }
    expect(maxEnergy).toBeGreaterThan(0.95);
    expect(zeroSamples).toBeGreaterThan(60);
    expect(energies.size).toBeGreaterThan(50);
    expect(demo.snapshot()).toMatchObject({ durationMs: 8000, done: true, phase: 'idle', speechEnergy: 0 });
  });

  it('repeats identical samples and is independent from tick partition at the same time', () => {
    const a = new DemoTimeline('speaking');
    const b = new DemoTimeline('speaking');
    for (let i = 0; i < 100; i++) a.advance(10);
    for (let i = 0; i < 50; i++) b.advance(20);
    expect(a.snapshot()).toEqual(b.snapshot());
    const replay = new DemoTimeline('speaking');
    expect(replay.advance(1000)).toEqual(a.snapshot());
    expect(syntheticSpeechEnergy(4970)).toBe(1);
  });

  it('does not advance on negative or nonfinite time and bounds the energy sample', () => {
    const demo = new DemoTimeline('states');
    demo.advance(-1); demo.advance(Number.NaN); demo.advance(Number.POSITIVE_INFINITY);
    expect(demo.snapshot().elapsedMs).toBe(0);
    expect(syntheticSpeechEnergy(Number.NaN)).toBe(0);
    expect(syntheticSpeechEnergy(100, 0)).toBe(0);
    expect(syntheticSpeechEnergy(-1)).toBe(0);
    expect(syntheticSpeechEnergy(9000)).toBe(0);
  });
});
