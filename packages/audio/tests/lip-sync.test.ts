import { describe, expect, it } from 'vitest';
import { AmplitudeLipSyncDriver, rms } from '../src/index';

describe('amplitude lip sync', () => {
  it('measures PCM RMS and treats malformed samples as silence', () => {
    expect(rms(new Float32Array([0.5, -0.5]))).toBe(0.5);
    expect(rms([])).toBe(0);
    expect(rms([Number.NaN, Number.POSITIVE_INFINITY])).toBe(0);
    expect(rms([4, -4])).toBe(1);
  });

  it('gates background noise and bounds loud PCM energy', () => {
    const driver = new AmplitudeLipSyncDriver();
    expect(driver.sample([0.001, -0.001], 1000)).toBe(0);
    expect(driver.sample([1, -1], 1000)).toBeCloseTo(1);
    expect(driver.getFrame().energy).toBeLessThanOrEqual(1);
  });

  it('attacks quickly and releases gently based on elapsed audio time', () => {
    const driver = new AmplitudeLipSyncDriver({ attackMs: 20, releaseMs: 100 });
    expect(driver.processEnergy(1, 20)).toBeCloseTo(1 - Math.exp(-1));
    const high = driver.processEnergy(1, 100);
    const release = driver.processEnergy(0, 20);
    expect(release).toBeCloseTo(high * Math.exp(-0.2));
    expect(release).toBeGreaterThan(0.8);
    driver.reset(); expect(driver.getFrame().energy).toBe(0);
  });

  it('produces the same envelope at different sampling frame rates', () => {
    const a = new AmplitudeLipSyncDriver();
    const b = new AmplitudeLipSyncDriver();
    for (let i = 0; i < 100; i++) a.processEnergy(0.7, 10);
    for (let i = 0; i < 50; i++) b.processEnergy(0.7, 20);
    expect(a.getFrame().energy).toBeCloseTo(b.getFrame().energy, 12);
  });

  it('handles non-finite timing and refuses broken configuration', () => {
    const driver = new AmplitudeLipSyncDriver();
    expect(driver.processEnergy(1, Number.NaN)).toBe(0);
    expect(driver.processEnergy(Number.NaN, 16)).toBe(0);
    expect(() => new AmplitudeLipSyncDriver({ saturationRms: 0 })).toThrow(RangeError);
    expect(() => new AmplitudeLipSyncDriver({ attackMs: -1 })).toThrow(RangeError);
  });
});
