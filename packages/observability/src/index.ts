export const latencyMetricNames = [
  'speech_start_detection_ms', 'speech_end_detection_ms', 'provider_first_audio_ms',
  'barge_in_stop_ms', 'affect_latency_ms', 'avatar_state_latency_ms',
  'vision_capture_ms', 'vision_analysis_ms', 'tool_execution_ms',
] as const;
export type LatencyMetricName = typeof latencyMetricNames[number];
export type MonotonicClock = () => number;

/** A fixed-size ring avoids session-length-dependent memory growth. */
export class BoundedEventLog<T> {
  private readonly items: (T | undefined)[];
  private next = 0;
  private count = 0;
  readonly capacity: number;

  constructor(capacity = 100) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10_000) throw new RangeError('Log capacity must be an integer between 1 and 10000');
    this.capacity = capacity;
    this.items = new Array<T | undefined>(capacity);
  }

  push(item: T): void {
    this.items[this.next] = item;
    this.next = (this.next + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }

  snapshot(): T[] {
    const start = this.count < this.capacity ? 0 : this.next;
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) result.push(this.items[(start + i) % this.capacity] as T);
    return result;
  }

  clear(): void { this.items.fill(undefined); this.next = 0; this.count = 0; }
  get size(): number { return this.count; }
}

export interface MetricSummary {
  name: LatencyMetricName;
  count: number;
  lastMs: number;
  meanMs: number;
  p95Ms: number;
  maxMs: number;
  retainedSamples: number;
}

interface MetricBucket {
  samples: BoundedEventLog<number>;
  count: number;
  sum: number;
  max: number;
  last: number;
}

function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
}

export class LatencyMetrics {
  private readonly buckets = new Map<LatencyMetricName, MetricBucket>();

  constructor(private readonly clock: MonotonicClock = () => performance.now(), private readonly windowSize = 256) {
    if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > 10_000) throw new RangeError('Metric window must be an integer between 1 and 10000');
  }

  record(name: LatencyMetricName, durationMs: number): void {
    if (!latencyMetricNames.some((metric) => metric === name)) throw new TypeError('Unknown latency metric');
    if (!Number.isFinite(durationMs) || durationMs < 0) throw new RangeError('Duration must be finite and nonnegative');
    let bucket = this.buckets.get(name);
    if (!bucket) {
      bucket = { samples: new BoundedEventLog<number>(this.windowSize), count: 0, sum: 0, max: 0, last: 0 };
      this.buckets.set(name, bucket);
    }
    bucket.samples.push(durationMs); bucket.count++; bucket.sum += durationMs;
    bucket.max = Math.max(bucket.max, durationMs); bucket.last = durationMs;
  }

  /** Stop is idempotent so an error and a cleanup path cannot double-count latency. */
  start(name: LatencyMetricName): () => number {
    const started = this.clock();
    let duration: number | undefined;
    return () => {
      if (duration === undefined) { duration = Math.max(0, this.clock() - started); this.record(name, duration); }
      return duration;
    };
  }

  async measure<T>(name: LatencyMetricName, work: () => Promise<T>): Promise<T> {
    const stop = this.start(name);
    try { return await work(); } finally { stop(); }
  }

  snapshot(): MetricSummary[] {
    return latencyMetricNames.flatMap((name) => {
      const bucket = this.buckets.get(name);
      if (!bucket) return [];
      return [{
        name, count: bucket.count, lastMs: bucket.last, meanMs: bucket.sum / bucket.count,
        p95Ms: percentile(bucket.samples.snapshot(), 0.95), maxMs: bucket.max,
        retainedSamples: bucket.samples.size,
      }];
    });
  }

  reset(): void { this.buckets.clear(); }
}

export interface FrameMetricsSnapshot {
  fps: number;
  frameTimeMs: number;
  p95FrameTimeMs: number;
  droppedFrames: number;
  samples: number;
}

export class FrameMetrics {
  private readonly frameTimes: BoundedEventLog<number>;
  private droppedFrames = 0;

  constructor(windowSize = 120, private readonly targetFps = 60) {
    if (!Number.isFinite(targetFps) || targetFps <= 0) throw new RangeError('Target FPS must be positive');
    this.frameTimes = new BoundedEventLog<number>(windowSize);
  }

  record(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.frameTimes.push(deltaMs);
    this.droppedFrames += Math.max(0, Math.round(deltaMs / (1000 / this.targetFps)) - 1);
  }

  snapshot(): FrameMetricsSnapshot {
    const samples = this.frameTimes.snapshot();
    const mean = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
    return {
      fps: mean ? 1000 / mean : 0,
      frameTimeMs: mean,
      p95FrameTimeMs: percentile(samples, 0.95),
      droppedFrames: this.droppedFrames,
      samples: samples.length,
    };
  }

  reset(): void { this.frameTimes.clear(); this.droppedFrames = 0; }
}
