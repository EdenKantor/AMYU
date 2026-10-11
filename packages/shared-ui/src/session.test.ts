import { describe, expect, it } from 'vitest';
import { LabSession } from './session';

function advance(session: LabSession, durationMs: number) {
  for (let elapsed = 0; elapsed < durationMs; elapsed += 20) session.tick(Math.min(20, durationMs - elapsed));
}

describe('Avatar Lab session', () => {
  it('freezes local time and pose while paused, then resumes', () => {
    const session = new LabSession();
    session.tick(20); session.setPaused(true);
    const frame = session.frame;
    expect(session.tick(100)).toEqual(frame);
    expect(session.elapsedMs).toBe(20);
    session.setPaused(false); session.tick(20);
    expect(session.elapsedMs).toBe(40);
  });
  it('runs the credential-free 38-second full state demo and returns to idle', () => {
    const session = new LabSession(); session.toggleTour();
    advance(session, 38_000);
    expect(session.touring).toBe(false);
    expect(session.state).toBe('idle');
    expect(session.events.some(event => event.type === 'demo.completed')).toBe(true);
    expect(session.events.filter(event => event.type === 'conversation.state').map(event => event.detail).reverse()).toEqual(['idle', 'listening', 'thinking', 'speaking', 'acting', 'sleeping', 'idle']);
  });
  it('bounds diagnostics history in long sessions', () => {
    const session = new LabSession();
    for (let i = 0; i < 1000; i++) session.click();
    expect(session.events).toHaveLength(120);
  });
  it('manual gaze disables pointer ownership until explicitly enabled', () => {
    const session = new LabSession(); session.gaze(0.7, -0.5);
    session.pointer(-1, 1, 1, true);
    expect(session.pointerTracking).toBe(false);
    session.reset();
    expect(session.pointerTracking).toBe(true);
    expect(session.speechEnergy).toBe(0);
  });
  it('keeps developer pose overrides outside the semantic engine and resets them', () => {
    const session = new LabSession();
    session.setPoseOverride('mouthOpen', 0.8);
    expect(session.tick(20).mouthOpen).toBe(0.8);
    expect(session.director.getSnapshot().mouthOpen).toBe(0);
    session.reset(); session.tick(20);
    expect(session.frame.mouthOpen).toBe(0);
  });
  it('updates semantic UI state when the sleeping character wakes on click', () => {
    const session = new LabSession(); session.setState('sleeping'); session.tick(20);
    session.click(); session.tick(20);
    expect(session.state).toBe('idle');
    expect(session.frame.state).toBe('idle');
  });
  it('restores the same awake state in the UI and director', () => {
    const session = new LabSession(); session.setState('listening'); session.tick(20);
    session.setAwake(false); session.tick(20);
    session.setAwake(true); session.tick(20);
    expect(session.state).toBe('listening');
    expect(session.frame.state).toBe('listening');
  });
  it.each([false, true])('wakes from full-state demo sleep into the previous awake state with paused=%s', paused => {
    const session = new LabSession(); session.playStateDemo(); advance(session, 29_000);
    expect(session.demo).toMatchObject({ kind: 'states', phase: 'sleeping' });
    expect(session.state).toBe('sleeping');
    expect(session.frame.awake).toBe(false);
    session.setPaused(paused);
    session.setAwake(true);
    expect(session.demo).toBeNull();
    expect(session.paused).toBe(paused);
    expect(session.state).toBe('acting');
    expect(session.frame.state).toBe('acting');
    expect(session.frame.awake).toBe(true);
    expect(session.frame.gesture).toBeNull();
    expect(session.speechEnergy).toBe(0);
    expect(session.frame.speechEnergy).toBe(0);
    advance(session, 10_000);
    expect(session.demo).toBeNull();
    expect(session.state).toBe('acting');
    expect(session.frame.state).toBe('acting');
    expect(session.events.some(event => event.type === 'demo.completed')).toBe(false);
  });
  it('restarts speaking consistently, clears held overrides and reflects changing energy', () => {
    const session = new LabSession();
    session.setPoseOverride('mouthOpen', 0.8);
    session.playSpeakingDemo();
    expect(session.poseOverrides).toEqual({});
    expect(session.demo).toMatchObject({ kind: 'speaking', phase: 'speaking', durationMs: 12_000 });
    advance(session, 600);
    const energy = session.speechEnergy;
    expect(energy).toBeGreaterThan(0.7);
    expect(session.frame.mouthOpen).toBeGreaterThan(0.5);
    session.playSpeakingDemo();
    expect(session.speechEnergy).toBe(0);
    advance(session, 600);
    expect(session.speechEnergy).toBe(energy);
    advance(session, 11_400);
    expect(session.demo).toBeNull();
    expect(session.state).toBe('idle');
    expect(session.speechEnergy).toBe(0);
    expect(session.frame.mouthOpen).toBe(0);
  });
  it('freezes demo time while paused and stops speech immediately without resuming motion', () => {
    const session = new LabSession(); session.playSpeakingDemo(); advance(session, 600);
    const elapsed = session.demo?.elapsedMs;
    session.setPaused(true); session.tick(500);
    expect(session.demo?.elapsedMs).toBe(elapsed);
    const weights = session.frame.stateWeights;
    session.stopDemo();
    expect(session.demo).toBeNull();
    expect(session.paused).toBe(true);
    expect(session.frame.state).toBe('idle');
    expect(session.frame.speechEnergy).toBe(0);
    expect(session.frame.mouthOpen).toBe(0);
    expect(session.frame.stateWeights).toEqual(weights);
  });
  it('cancels on manual state or energy, preserves requested input and cannot resume a stale demo', () => {
    const session = new LabSession(); session.playStateDemo(); advance(session, 14_200);
    session.setState('listening');
    expect(session.demo).toBeNull();
    expect(session.state).toBe('listening');
    advance(session, 10_000);
    expect(session.state).toBe('listening');
    session.playSpeakingDemo(); advance(session, 600);
    session.setSpeechEnergy(0.4);
    expect(session.demo).toBeNull();
    expect(session.state).toBe('speaking');
    expect(session.speechEnergy).toBe(0.4);
    session.reset();
    expect(session.demo).toBeNull();
    expect(session.frame.speechEnergy).toBe(0);
    expect(session.state).toBe('idle');
  });
  it('runs finite demo phases without logging every sample', () => {
    const session = new LabSession(); session.playStateDemo(); advance(session, 38_000);
    expect(session.events.length).toBeLessThan(30);
    expect(session.demo).toBeNull();
    expect(session.speechEnergy).toBe(0);
  });
  it('coalesces repeated clicks into the verified wave without invisible queued gestures', () => {
    const session = new LabSession();
    for (let i = 0; i < 20; i++) session.click(['wave']);
    expect(session.tick(20).gesture?.name).toBe('wave');
    advance(session, 500);
    const progress = session.frame.gesture!.progress;
    for (let i = 0; i < 100; i++) session.click(['wave']);
    expect(session.tick(20).gesture!.progress).toBeGreaterThan(progress);
    advance(session, 2000);
    expect(session.frame.gesture).toBeNull();
    session.click([]); expect(session.tick(20).gesture).toBeNull();
  });
  it('clears controlled QA blink and active gesture immediately on paused stop', () => {
    const session = new LabSession(); session.playEyeDemo(); advance(session, 11_580);
    expect(session.frame.blink).toBe(1);
    expect(session.frame.eyeOpenness).toBe(0);
    session.setPaused(true); session.stopDemo();
    expect(session.frame.eyeOpenness).toBe(session.director.getSnapshot().eyeOpenness);
    expect(session.paused).toBe(true);
    session.playGestureDemo(['wave']); advance(session, 500);
    expect(session.frame.gesture?.name).toBe('wave');
    session.setPaused(true); session.setState('thinking');
    expect(session.demo).toBeNull(); expect(session.frame.gesture).toBeNull();
    expect(session.frame.state).toBe('thinking');
  });
  it('runs supported gesture QA through each source state and finishes with no stale pose', () => {
    const session = new LabSession(); session.playGestureDemo(['wave']);
    const sourceStates = new Set<string>();
    for (let elapsed = 0; elapsed < 20_400; elapsed += 20) {
      const frame = session.tick(20);
      if (frame.gesture) { expect(frame.gesture.name).toBe('wave'); sourceStates.add(frame.state); }
    }
    expect([...sourceStates].sort()).toEqual(['idle', 'listening', 'speaking', 'thinking']);
    expect(session.demo).toBeNull(); expect(session.frame.gesture).toBeNull();
    expect(session.frame.state).toBe('idle'); expect(session.frame.speechEnergy).toBe(0);
  });
  it('runs the complete transition stress sequence with bounded logs and a clean final frame', () => {
    const session = new LabSession(); session.playTransitionStressDemo(['wave']);
    let waves = 0; let lastPhase = -1;
    for (let elapsed = 0; elapsed < 113_000; elapsed += 20) {
      const demo = session.demo;
      if (demo && demo.phaseIndex !== lastPhase) {
        lastPhase = demo.phaseIndex;
        if (demo.gesture === 'wave') waves++;
      }
      const frame = session.tick(20);
      expect(Number.isFinite(frame.eyeOpenness)).toBe(true);
      if (frame.state !== 'speaking') expect(frame.speechEnergy).toBe(0);
    }
    expect(waves).toBe(10); expect(session.events.length).toBeLessThanOrEqual(120);
    expect(session.demo).toBeNull(); expect(session.frame.gesture).toBeNull();
    expect(session.frame.state).toBe('idle'); expect(session.frame.stateWeights.idle).toBeGreaterThan(0.999);
  });
});
