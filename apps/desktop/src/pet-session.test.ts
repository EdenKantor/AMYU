import { describe, expect, it } from 'vitest';
import { PetSession } from './pet-session';

function advance(session: PetSession, duration: number) {
  for (let elapsed = 0; elapsed < duration; elapsed += 20) session.tick(Math.min(20, duration - elapsed));
}

describe('Pet Shell local interaction', () => {
  it('opens and hides a compact composer without losing the draft', () => {
    const session = new PetSession();
    session.focusComposer();
    session.setDraft('Hello');
    expect(session.snapshot.state).toBe('listening');
    session.setComposer(false);
    expect(session.snapshot).toMatchObject({ state: 'idle', composerOpen: false, draft: 'Hello' });
    session.setComposer(true);
    session.focusComposer();
    session.blurComposer();
    expect(session.snapshot.state).toBe('idle');
  });
  it('ignores blank sends and runs listening → thinking → speaking → idle with a disclosed reply', () => {
    const session = new PetSession();
    session.setDraft('  ');
    expect(session.submit()).toBe(false);
    session.setDraft('Hello AMYU');
    expect(session.submit()).toBe(true);
    expect(session.snapshot).toMatchObject({ state: 'listening', draft: '', reply: '', busy: true });
    session.blurComposer();
    advance(session, 600);
    expect(session.snapshot.state).toBe('thinking');
    advance(session, 1300);
    expect(session.snapshot.state).toBe('speaking');
    expect(session.snapshot.reply).toContain('local demo');
    expect(session.frame.speechEnergy).toBeGreaterThan(0);
    advance(session, 3500);
    expect(session.snapshot).toMatchObject({ state: 'idle', busy: false });
    expect(session.frame.speechEnergy).toBe(0);
  });
  it('interrupts a conversation when typing a replacement, without stale replies', () => {
    const session = new PetSession();
    session.setDraft('First'); session.submit(); advance(session, 1000);
    session.setDraft('Second');
    expect(session.snapshot).toMatchObject({ state: 'listening', busy: false });
    advance(session, 6000);
    expect(session.snapshot.reply).toBe('');
    session.submit(); advance(session, 1900);
    expect(session.snapshot.state).toBe('speaking');
  });
  it('sleep cancels pending work and wake returns to idle with no speech replay', () => {
    const session = new PetSession();
    session.setDraft('Hello'); session.submit(); advance(session, 1900);
    session.sleep(); advance(session, 8000);
    expect(session.snapshot).toMatchObject({ state: 'sleeping', busy: false, reply: '' });
    expect(session.frame.speechEnergy).toBe(0);
    session.wake(); advance(session, 100);
    expect(session.snapshot.state).toBe('idle');
    expect(session.frame.awake).toBe(true);
  });
  it('keeps a speaking reply dismissed and lets the microphone notice remain visible', () => {
    const session = new PetSession();
    session.setDraft('Hello'); session.submit(); advance(session, 1900);
    session.clearReply(); advance(session, 500);
    expect(session.snapshot).toMatchObject({ state: 'speaking', reply: '' });
    session.microphonePlaceholder(); advance(session, 1000);
    expect(session.snapshot.reply).toContain('No microphone');
    session.setDraft('Another thought');
    expect(session.snapshot).toMatchObject({ state: 'listening', reply: '', busy: false });
    expect(session.frame.speechEnergy).toBe(0);
  });
  it('handles invalid clock input and keeps reduced motion in the avatar frame', () => {
    const session = new PetSession();
    session.setReducedMotion(true);
    session.setDraft('Hello'); session.submit();
    session.tick(Number.NaN); session.tick(Number.POSITIVE_INFINITY); session.tick(-1000);
    expect(session.snapshot.state).toBe('listening');
    advance(session, 600);
    expect(session.frame.reducedMotion).toBe(true);
    expect(session.snapshot.state).toBe('thinking');
  });
  it('acting is bounded and click reactions cannot build a gesture backlog', () => {
    const session = new PetSession();
    session.act(); expect(session.snapshot.state).toBe('acting');
    advance(session, 2700); expect(session.snapshot.state).toBe('idle');
    session.sleep(); session.click(['wave']);
    expect(session.snapshot.state).toBe('idle');
    for (let click = 0; click < 20; click++) session.click(['wave']);
    advance(session, 4000);
    expect(session.frame.gesture).toBeNull();
  });
  it('does not request audio and stops changing after disposal', () => {
    const session = new PetSession();
    session.microphonePlaceholder();
    expect(session.snapshot.reply).toContain('No microphone');
    session.setDraft('Hello'); session.submit(); session.dispose();
    const frame = session.frame;
    session.setDraft('Ignored'); session.act(); session.sleep(); advance(session, 8000);
    expect(session.snapshot).toMatchObject({ state: 'idle', draft: '', busy: false });
    expect(session.frame).toEqual(frame);
  });
});
