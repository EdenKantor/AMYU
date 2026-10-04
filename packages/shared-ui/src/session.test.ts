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
  it('runs the credential-free 15-second state demo and returns to idle', () => {
    const session = new LabSession(); session.toggleTour();
    advance(session, 15_000);
    expect(session.touring).toBe(false);
    expect(session.state).toBe('idle');
    expect(session.events.some(event => event.type === 'demo.completed')).toBe(true);
    expect(session.events.filter(event => event.type === 'conversation.state').map(event => event.detail).reverse()).toEqual(['idle', 'listening', 'thinking', 'speaking', 'idle']);
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
  it('restarts speaking consistently, clears held overrides and reflects changing energy', () => {
    const session = new LabSession();
    session.setPoseOverride('mouthOpen', 0.8);
    session.playSpeakingDemo();
    expect(session.poseOverrides).toEqual({});
    expect(session.demo).toMatchObject({ kind: 'speaking', phase: 'speaking', durationMs: 8000 });
    advance(session, 800);
    const energy = session.speechEnergy;
    expect(energy).toBeCloseTo(0.9);
    expect(session.frame.mouthOpen).toBeGreaterThan(0.5);
    session.playSpeakingDemo();
    expect(session.speechEnergy).toBe(0);
    advance(session, 800);
    expect(session.speechEnergy).toBe(energy);
    advance(session, 7200);
    expect(session.demo).toBeNull();
    expect(session.state).toBe('idle');
    expect(session.speechEnergy).toBe(0);
    expect(session.frame.mouthOpen).toBe(0);
  });
  it('freezes demo time while paused and stops speech immediately without resuming motion', () => {
    const session = new LabSession(); session.playSpeakingDemo(); advance(session, 800);
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
    const session = new LabSession(); session.playStateDemo(); advance(session, 8200);
    session.setState('listening');
    expect(session.demo).toBeNull();
    expect(session.state).toBe('listening');
    advance(session, 10_000);
    expect(session.state).toBe('listening');
    session.playSpeakingDemo(); advance(session, 800);
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
    const session = new LabSession(); session.playStateDemo(); advance(session, 15_000);
    expect(session.events.length).toBeLessThan(15);
    expect(session.demo).toBeNull();
    expect(session.speechEnergy).toBe(0);
  });
});
