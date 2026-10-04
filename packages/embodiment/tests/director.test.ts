import { describe, expect, it } from 'vitest';
import { conversationStates, emotions, type AvatarFrame } from '@amyu/avatar-contract';
import { EmbodimentDirector } from '../src/index';

function advance(director: EmbodimentDirector, ms = 2000): AvatarFrame {
  let frame = director.getSnapshot();
  for (let remaining = ms; remaining > 0; remaining -= 16) frame = director.tick(Math.min(16, remaining));
  return frame;
}

describe('EmbodimentDirector', () => {
  it('smooths state and emotion transitions instead of popping expressions', () => {
    const director = new EmbodimentDirector();
    director.setConversationState('listening');
    director.setEmotion('happy', 0.9);
    const first = director.tick(16);
    expect(first.stateWeights.listening).toBeGreaterThan(0);
    expect(first.stateWeights.listening).toBeLessThan(0.1);
    expect(first.smile).toBeLessThan(0.1);
    const settled = advance(director);
    expect(settled.stateWeights.listening).toBeGreaterThan(0.999);
    expect(settled.smile).toBeGreaterThan(0.6);
    expect(Object.values(settled.stateWeights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(Object.values(settled.emotionWeights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
  });

  it('produces repeatable frames for the same seed and semantic input sequence', () => {
    const a = new EmbodimentDirector({ seed: 19 });
    const b = new EmbodimentDirector({ seed: 19 });
    for (let frame = 0; frame < 1800; frame++) {
      if (frame % 300 === 0) {
        const state = conversationStates[(frame / 300) % conversationStates.length] ?? 'idle';
        a.setConversationState(state); b.setConversationState(state);
        a.setEmotion('curious', 0.7); b.setEmotion('curious', 0.7);
      }
      expect(a.tick(16)).toEqual(b.tick(16));
    }
    expect(new EmbodimentDirector({ seed: 20 }).tick(16)).not.toEqual(a.getSnapshot());
  });

  it('uses elapsed time for semantic response at different frame rates', () => {
    const a = new EmbodimentDirector();
    const b = new EmbodimentDirector();
    a.setEmotion('concerned', 0.8); b.setEmotion('concerned', 0.8);
    for (let frame = 0; frame < 100; frame++) a.tick(10);
    for (let frame = 0; frame < 50; frame++) b.tick(20);
    for (const emotion of emotions) expect(a.getSnapshot().emotionWeights[emotion]).toBeCloseTo(b.getSnapshot().emotionWeights[emotion], 12);
  });

  it('tracks local pointer proximity, hover and click without an AI call', () => {
    const director = new EmbodimentDirector();
    director.setPointer({ x: 0.8, y: -0.4, proximity: 1, hovered: true });
    const frame = advance(director);
    expect(frame.gaze.x).toBeCloseTo(0.8, 3);
    expect(frame.gaze.y).toBeCloseTo(-0.4, 3);
    expect(frame.headRotationX).toBeGreaterThan(0.1);
    expect(frame.anticipation).toBeGreaterThan(0.3);
    director.reactToClick();
    expect(director.tick(16).gesture?.name).toBe('bounce');
    director.pointerLeave();
    expect(advance(director).anticipation).toBeLessThan(0.01);
  });

  it('accepts weighted semantic gaze and smoothly changes awake state', () => {
    const director = new EmbodimentDirector();
    director.setConversationState('listening');
    director.setGaze(0.8, -0.4, 0.5);
    const gaze = advance(director);
    expect(gaze.gaze.x).toBeGreaterThan(0.35);
    expect(gaze.gaze.x).toBeLessThan(0.45);
    expect(gaze.headRotationX).toBeLessThan(gaze.gaze.x * 0.4);
    director.setAwake(false);
    expect(director.tick(16).awake).toBe(false);
    expect(advance(director).state).toBe('sleeping');
    director.setAwake(true);
    const awake = advance(director);
    expect(awake.awake).toBe(true);
    expect(awake.state).toBe('listening');
    expect(awake.gesture).toBeNull();
  });

  it('stops audio mouth movement immediately on a listening interruption', () => {
    const director = new EmbodimentDirector();
    director.setConversationState('speaking');
    director.setSpeechEnergy(0.9);
    expect(advance(director, 1000).mouthOpen).toBeGreaterThan(0.85);
    director.setConversationState('listening');
    const pausedClock = director.getSnapshot();
    expect(pausedClock.state).toBe('listening');
    expect(pausedClock.awake).toBe(true);
    expect(pausedClock.speechEnergy).toBe(0);
    expect(pausedClock.mouthOpen).toBe(0);
    expect(pausedClock.stateWeights.speaking).toBeGreaterThan(0.9);
    expect(director.tick(16).mouthOpen).toBe(0);
    expect(director.getSnapshot().stateWeights.speaking).toBeGreaterThan(0.8);
  });

  it('smoothly closes eyes on sleep and wakes with a local click', () => {
    const director = new EmbodimentDirector();
    director.setConversationState('sleeping');
    expect(advance(director, 3000).eyeOpenness).toBeLessThan(0.06);
    director.reactToClick();
    expect(director.tick(16).state).toBe('idle');
    expect(advance(director, 3000).eyeOpenness).toBeGreaterThan(0.9);
  });

  it('bounds the gesture backlog under repeated aggressive clicking', () => {
    const director = new EmbodimentDirector();
    director.triggerGesture('wave'); director.tick(16);
    for (let i = 0; i < 1000; i++) director.reactToClick();
    expect(director.tick(16).eyeSquint).toBeGreaterThan(0);
    expect(advance(director, 6000).gesture).toBeNull();
  });

  it('does not expose mutable internal frame objects', () => {
    const director = new EmbodimentDirector();
    const frame = director.tick(16);
    frame.gaze.x = 99; frame.stateWeights.idle = 99; frame.emotionWeights.happy = 99;
    expect(director.getSnapshot().gaze.x).not.toBe(99);
    expect(director.getSnapshot().stateWeights.idle).not.toBe(99);
  });

  it('caps suspended-frame time and handles nonfinite continuous inputs', () => {
    const director = new EmbodimentDirector();
    expect(director.tick(60_000).timeMs).toBe(64);
    expect(director.tick(Number.NaN).timeMs).toBe(64);
    director.setSpeechEnergy(Number.POSITIVE_INFINITY);
    director.setEmotion('happy', Number.NaN);
    expect(advance(director).mouthOpen).toBe(0);
    expect(director.getSnapshot().emotionIntensity).toBe(0);
  });

  it('keeps finite bounded output over a 30-minute simulated session', () => {
    const director = new EmbodimentDirector({ seed: 937 });
    const frames = 30 * 60 * 60;
    let blinks = 0;
    let wasClosed = false;
    let lastBlink = 0;
    const blinkIntervals = new Set<number>();
    for (let i = 0; i < frames; i++) {
      if (i % 600 === 0) {
        director.setConversationState(conversationStates[(i / 600) % conversationStates.length] ?? 'idle');
        director.setEmotion(emotions[(i / 600) % emotions.length] ?? 'neutral', 0.7);
        director.setSpeechEnergy(0.7);
      }
      if (i % 1200 === 0) director.triggerGesture('shrug');
      const frame = director.tick(1000 / 60);
      for (const [key, value] of Object.entries(frame)) {
        if (typeof value === 'number' && (!Number.isFinite(value) || (key !== 'timeMs' && Math.abs(value) > 1.2))) throw new Error(`Invalid ${key} at frame ${i}: ${value}`);
      }
      const closed = frame.blink > 0.85;
      if (closed && !wasClosed) { blinks++; blinkIntervals.add(Math.round((i - lastBlink) / 6)); lastBlink = i; }
      wasClosed = closed;
    }
    expect(director.getSnapshot().timeMs).toBeCloseTo(1_800_000, 4);
    expect(blinks).toBeGreaterThan(200);
    expect(blinks).toBeLessThan(1000);
    expect(blinkIntervals.size).toBeGreaterThan(30);
  });
});
