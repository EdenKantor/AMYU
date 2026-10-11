import { describe, expect, it } from 'vitest';
import type { Gesture } from '@amyu/avatar-contract';
import { DemoTimeline, syntheticSpeechEnergy, type DemoKind, type DemoStatus } from './demo';

function phases(kind: DemoKind, supported: Gesture[] = []): DemoStatus[] {
  const timeline = new DemoTimeline(kind, supported);
  const result: DemoStatus[] = [];
  while (!timeline.snapshot().done) {
    const phase = timeline.snapshot(); result.push(phase);
    timeline.advance(phase.phaseRemainingMs);
  }
  return result;
}

describe('development visual QA timeline', () => {
  it('uses every exact boundary in the requested 38-second full state sequence', () => {
    const sequence = phases('states');
    expect(sequence.map(({ phase, phaseRemainingMs }) => [phase, phaseRemainingMs])).toEqual([
      ['idle', 4000], ['listening', 5000], ['thinking', 5000], ['speaking', 10_000],
      ['acting', 4000], ['sleeping', 5000], ['idle', 2000], ['idle', 3000],
    ]);
    expect(sequence[6].label).toBe('Wake');
    const demo = new DemoTimeline('states');
    expect(demo.advance(38_000)).toMatchObject({ phase: 'idle', done: true, progress: 1, remainingMs: 0, speechEnergy: 0 });
    expect(demo.advance(10_000).elapsedMs).toBe(38_000);
  });

  it('provides irregular strong/weak syllables and micro, phrase and sentence silence in 12 seconds', () => {
    const demo = new DemoTimeline('speaking');
    let maximum = 0; let previousVoiced = false; let bursts = 0;
    const pauseLengths: number[] = []; let pauseMs = 0;
    const energies = new Set<number>();
    for (let elapsed = 0; elapsed < 12_000; elapsed += 10) {
      const { speechEnergy } = demo.advance(10);
      maximum = Math.max(maximum, speechEnergy); energies.add(Math.round(speechEnergy * 100));
      const voiced = speechEnergy > 0;
      if (voiced && !previousVoiced) { bursts++; if (pauseMs) pauseLengths.push(pauseMs); pauseMs = 0; }
      if (!voiced) pauseMs += 10;
      previousVoiced = voiced;
    }
    expect(bursts).toBe(28); expect(maximum).toBeGreaterThan(0.98); expect(energies.size).toBeGreaterThan(80);
    expect(pauseLengths.some(ms => ms >= 40 && ms <= 100)).toBe(true);
    expect(pauseLengths.some(ms => ms >= 400 && ms <= 800)).toBe(true);
    expect(pauseLengths.some(ms => ms >= 850)).toBe(true);
    expect(demo.snapshot()).toMatchObject({ durationMs: 12_000, done: true, phase: 'idle', speechEnergy: 0 });
  });

  it('repeats cadence regardless of tick partition and remains bounded for invalid input', () => {
    const a = new DemoTimeline('speaking'); const b = new DemoTimeline('speaking');
    for (let i = 0; i < 100; i++) a.advance(10);
    for (let i = 0; i < 50; i++) b.advance(20);
    expect(a.snapshot()).toEqual(b.snapshot());
    const replay = new DemoTimeline('speaking'); expect(replay.advance(1000)).toEqual(a.snapshot());
    replay.advance(-1); replay.advance(Number.NaN); replay.advance(Number.POSITIVE_INFINITY);
    expect(replay.snapshot().elapsedMs).toBe(1000);
    expect(syntheticSpeechEnergy(Number.NaN)).toBe(0);
    expect(syntheticSpeechEnergy(100, 0)).toBe(0);
    expect(syntheticSpeechEnergy(-1)).toBe(0);
    expect(syntheticSpeechEnergy(12_000)).toBe(0);
  });

  it('reviews single and double blinks without introducing a waking semantic enum', () => {
    const demo = new DemoTimeline('eyes');
    expect(demo.durationMs).toBe(20_000);
    expect(demo.advance(11_580)).toMatchObject({ label: 'Single blink', blink: 1, eyeOpenness: 0 });
    expect(demo.advance(200).eyeOpenness).toBe(0.86);
    expect(demo.advance(1800)).toMatchObject({ label: 'Double blink', blink: 1 });
    expect(demo.advance(400)).toMatchObject({ label: 'Double blink', blink: 1 });
    expect(demo.advance(6020)).toMatchObject({ phase: 'idle', done: true, eyeOpenness: null, blink: null });
  });

  it('includes the specified edges, ten listening toggles and exact 500ms rapid transitions', () => {
    const sequence = phases('stress', ['wave']);
    expect(sequence.slice(0, 10).map(({ phase }) => phase)).toEqual(['idle', 'listening', 'thinking', 'speaking', 'listening', 'speaking', 'thinking', 'idle', 'sleeping', 'idle']);
    const attention = sequence.filter(({ label }) => label === 'Idle ↔ Listening');
    expect(attention).toHaveLength(20);
    expect(attention.map(({ phase }) => phase)).toEqual(Array.from({ length: 10 }, () => ['listening', 'idle']).flat());
    const rapid = sequence.filter(({ label }) => label === 'Rapid 500ms transition');
    expect(rapid).toHaveLength(30); expect(rapid.every(({ phaseRemainingMs }) => phaseRemainingMs === 500)).toBe(true);
    for (const state of ['speaking', 'thinking']) expect(sequence.filter(({ label }) => label === `${state} → Idle`)).toHaveLength(20);
    expect(sequence.filter(({ gesture }) => gesture === 'wave')).toHaveLength(10);
    expect(new DemoTimeline('stress', ['wave']).durationMs).toBe(113_000);
    expect(phases('stress').some(({ gesture }) => gesture !== null)).toBe(false);
    expect(new DemoTimeline('stress').durationMs).toBe(92_000);
  });

  it('tests only verified gestures across all four states, interruptions and neutral returns', () => {
    const sequence = phases('gestures', ['wave', 'wave']);
    expect(sequence.filter(({ gesture }) => gesture).map(({ phase }) => phase)).toEqual(['idle', 'idle', 'listening', 'listening', 'thinking', 'thinking', 'speaking', 'speaking']);
    expect(sequence.filter(({ label }) => label === 'Interrupted gesture neutral return')).toHaveLength(4);
    expect(new DemoTimeline('gestures', ['wave']).durationMs).toBe(20_400);
    expect(phases('gestures')).toHaveLength(1);
    expect(phases('gestures')[0]).toMatchObject({ gesture: null, label: 'No verified supported gesture' });
  });
});
