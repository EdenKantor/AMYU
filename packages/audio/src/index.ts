export type VisemeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface LipSyncFrame {
  /** Semantic speech energy in [0, 1], consumed by AvatarController. */
  energy: number;
  /** Reserved for a future driver with audio-timed viseme metadata. */
  visemes?: Readonly<Record<string, number>>;
  viseme?: VisemeIndex;
}

export interface LipSyncInput {
  deltaMs: number;
  /** Outgoing assistant PCM; never requires microphone access. */
  pcm?: ArrayLike<number>;
  normalizedEnergy?: number;
  visemes?: Readonly<Record<string, number>>;
  viseme?: VisemeIndex;
}

export interface LipSyncDriver {
  update(input: LipSyncInput): LipSyncFrame;
  getFrame(): LipSyncFrame;
  reset(): void;
}

/** Future extension point only. No viseme driver or fifteen-mouth implementation is shipped. */
export interface VisemeLipSyncDriver extends LipSyncDriver {
  setViseme(viseme: VisemeIndex, audioTimeMs: number): void;
}

export interface AmplitudeLipSyncOptions {
  noiseFloor?: number;
  saturationRms?: number;
  attackMs?: number;
  releaseMs?: number;
}

function unit(value: number): number { return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0; }

/** Malformed PCM values are treated as silence so non-finite input cannot poison a frame. */
export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let squares = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i] ?? 0;
    const bounded = Number.isFinite(value) ? Math.min(1, Math.max(-1, value)) : 0;
    squares += bounded * bounded;
  }
  return Math.sqrt(squares / samples.length);
}

export class AmplitudeLipSyncDriver implements LipSyncDriver {
  private energy = 0;
  private readonly noiseFloor: number;
  private readonly saturationRms: number;
  private readonly attackMs: number;
  private readonly releaseMs: number;

  constructor(options: AmplitudeLipSyncOptions = {}) {
    this.noiseFloor = options.noiseFloor ?? 0.015;
    this.saturationRms = options.saturationRms ?? 0.25;
    this.attackMs = options.attackMs ?? 35;
    this.releaseMs = options.releaseMs ?? 120;
    if (!Number.isFinite(this.noiseFloor) || !Number.isFinite(this.saturationRms) || this.noiseFloor < 0 || this.saturationRms <= this.noiseFloor || this.saturationRms > 1) throw new RangeError('RMS noise floor must be below a positive saturation threshold at most 1');
    if (![this.attackMs, this.releaseMs].every((value) => Number.isFinite(value) && value > 0)) throw new RangeError('Lip sync time constants must be positive');
  }

  update(input: LipSyncInput): LipSyncFrame {
    const target = input.pcm ? unit((rms(input.pcm) - this.noiseFloor) / (this.saturationRms - this.noiseFloor)) : unit(input.normalizedEnergy ?? 0);
    const deltaMs = Number.isFinite(input.deltaMs) ? Math.max(0, input.deltaMs) : 0;
    const timeConstant = target > this.energy ? this.attackMs : this.releaseMs;
    this.energy = unit(this.energy + (target - this.energy) * (1 - Math.exp(-deltaMs / timeConstant)));
    return this.getFrame();
  }

  sample(pcm: ArrayLike<number>, deltaMs: number): number { return this.update({ pcm, deltaMs }).energy; }
  processEnergy(normalizedEnergy: number, deltaMs: number): number { return this.update({ normalizedEnergy, deltaMs }).energy; }
  getFrame(): LipSyncFrame { return { energy: this.energy }; }
  reset(): void { this.energy = 0; }
}

/** Reads an analyser already attached to playback. It never delays or starts audio. */
export class WebAudioAmplitudeSource {
  private buffer: Float32Array<ArrayBuffer>;

  constructor(private readonly analyser: AnalyserNode, readonly driver: LipSyncDriver = new AmplitudeLipSyncDriver()) {
    this.buffer = new Float32Array(analyser.fftSize);
  }

  sample(deltaMs: number): LipSyncFrame {
    if (this.buffer.length !== this.analyser.fftSize) this.buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(this.buffer);
    return this.driver.update({ pcm: this.buffer, deltaMs });
  }

  /** Call immediately when playback is interrupted, before the next animation frame. */
  reset(): void { this.driver.reset(); }
}
