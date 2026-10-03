import { describe, expect, it } from 'vitest';
import { GazeController } from '../src/index';

function advance(controller: GazeController, duration = 2000, idle = false) {
  let frame = controller.getSnapshot();
  for (let elapsed = 0; elapsed < duration; elapsed += 16) frame = controller.tick(16, { idle });
  return frame;
}

describe('local gaze controller', () => {
  it('reacts with eyes faster than the subtler head', () => {
    const gaze = new GazeController();
    gaze.setTarget(1, 0);
    const first = gaze.tick(64);
    expect(first.eyes.x).toBeGreaterThan(0);
    expect(first.eyes.x).toBeGreaterThan(first.head.x / 0.28);
    const settled = advance(gaze, 3000);
    expect(settled.eyes.x).toBeCloseTo(0.9, 3);
    expect(settled.head.x).toBeCloseTo(0.9 * 0.28, 3);
  });

  it('applies dead zone, weight, range bounds and return-to-neutral easing', () => {
    const gaze = new GazeController();
    gaze.setTarget(0.02, 0.01);
    expect(advance(gaze).eyes).toEqual({ x: 0, y: 0 });
    gaze.setTarget(1, -1, 0.5);
    expect(advance(gaze).eyes.x).toBeCloseTo(0.45, 3);
    gaze.clear();
    const easing = gaze.tick(16);
    expect(easing.eyes.x).toBeGreaterThan(0.4);
    expect(easing.eyes.x).toBeLessThan(0.45);
    expect(advance(gaze).eyes.x).toBeLessThan(0.001);
  });

  it('occasionally breaks idle pointer attention with seeded behavior', () => {
    const a = new GazeController({ seed: 89 });
    const b = new GazeController({ seed: 89 });
    a.setTarget(0.8, 0); b.setTarget(0.8, 0);
    let breaks = 0;
    let previous = false;
    let smallest = 1;
    for (let frame = 0; frame < 4000; frame++) {
      const state = a.tick(16, { idle: true });
      expect(state).toEqual(b.tick(16, { idle: true }));
      if (state.attentionBreak && !previous) breaks++;
      if (state.attentionBreak) smallest = Math.min(smallest, state.trackingWeight);
      previous = state.attentionBreak;
    }
    expect(breaks).toBeGreaterThan(3);
    expect(smallest).toBeLessThan(0.3);
    a.setTarget(0.8, 0);
    expect(advance(a, 30_000, false).attentionBreak).toBe(false);
  });

  it('handles invalid input without moving toward a corner or producing NaN', () => {
    const gaze = new GazeController();
    gaze.setTarget(Number.NaN, Number.POSITIVE_INFINITY);
    expect(advance(gaze).eyes).toEqual({ x: 0, y: 0 });
    expect(gaze.tick(Number.NaN).eyes).toEqual({ x: 0, y: 0 });
    expect(() => new GazeController({ headResponseMs: 0 })).toThrow(RangeError);
  });
});
