import { describe, expect, it } from 'vitest';
import { LabSession } from './session';

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
  it('runs a credential-free six-state scenario and returns to idle', () => {
    const session = new LabSession(); session.toggleTour();
    for (let frame = 0; frame < 1000; frame++) session.tick(20);
    expect(session.touring).toBe(false);
    expect(session.state).toBe('idle');
    expect(session.events.some(event => event.type === 'scenario.completed')).toBe(true);
    expect(session.events.filter(event => event.type === 'conversation.state').map(event => event.detail)).toContain('speaking');
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
});
