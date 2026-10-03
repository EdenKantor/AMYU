import { describe, expect, it } from 'vitest';
import { BoundedEventLog, FrameMetrics, LatencyMetrics } from '../src/index';

describe('bounded local instrumentation', () => {
  it('retains recent events in chronological order after wrapping', () => {
    const log = new BoundedEventLog<number>(3);
    for (let i = 0; i < 1000; i++) log.push(i);
    expect(log.size).toBe(3);
    expect(log.snapshot()).toEqual([997, 998, 999]);
    log.clear();
    expect(log.snapshot()).toEqual([]);
    expect(() => new BoundedEventLog(0)).toThrow(RangeError);
  });

  it('uses a monotonic clock and records an idempotent stop once', () => {
    let now = 100;
    const metrics = new LatencyMetrics(() => now);
    const stop = metrics.start('barge_in_stop_ms');
    now = 112;
    expect(stop()).toBe(12);
    now = 200;
    expect(stop()).toBe(12);
    expect(metrics.snapshot()).toEqual([{
      name: 'barge_in_stop_ms', count: 1, lastMs: 12, meanMs: 12,
      p95Ms: 12, maxMs: 12, retainedSamples: 1,
    }]);
  });

  it('keeps total statistics and a bounded percentile window', () => {
    const metrics = new LatencyMetrics(() => 0, 10);
    for (let i = 1; i <= 100; i++) metrics.record('avatar_state_latency_ms', i);
    expect(metrics.snapshot()[0]).toMatchObject({ count: 100, retainedSamples: 10, meanMs: 50.5, lastMs: 100, p95Ms: 100 });
    expect(() => metrics.record('avatar_state_latency_ms', Number.NaN)).toThrow(RangeError);
    metrics.reset(); expect(metrics.snapshot()).toEqual([]);
  });

  it('records timing when asynchronous work fails', async () => {
    let now = 0;
    const metrics = new LatencyMetrics(() => now);
    await expect(metrics.measure('tool_execution_ms', async () => { now = 8; throw new Error('failed'); })).rejects.toThrow('failed');
    expect(metrics.snapshot()[0]?.lastMs).toBe(8);
  });

  it('reports frame rate, missed frame slots and bounded samples', () => {
    const frames = new FrameMetrics(60);
    for (let i = 0; i < 120; i++) frames.record(1000 / 60);
    expect(frames.snapshot().fps).toBeCloseTo(60);
    expect(frames.snapshot().samples).toBe(60);
    frames.record(50);
    frames.record(Number.NaN); frames.record(0);
    expect(frames.snapshot().droppedFrames).toBe(2);
    frames.reset();
    expect(frames.snapshot().fps).toBe(0);
  });
});
