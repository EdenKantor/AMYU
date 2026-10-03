import { describe, expect, it } from 'vitest';
import { createAvatarCapabilities } from '@amyu/avatar-contract';
import { avatarCapabilitiesSchema, CompanionEventBus, companionEventSchema, parseCompanionEvent, toolRequestSchema, toolResultSchema } from '../src/index';

describe('event trust boundary', () => {
  it('accepts semantic affect and Hebrew without renderer names', () => {
    expect(parseCompanionEvent({ type: 'embodiment.affect', timestamp: 4, emotion: 'curious', intensity: 0.5 }).type).toBe('embodiment.affect');
    expect(parseCompanionEvent({ type: 'transcript.user', timestamp: 7, text: 'מה עושים היום?', language: 'he' }).type).toBe('transcript.user');
  });

  it('validates weighted gaze, awake and explicit unknown capabilities', () => {
    expect(parseCompanionEvent({ type: 'embodiment.gaze', timestamp: 1, target: { x: 0.5, y: 0 }, weight: 0.3 }).type).toBe('embodiment.gaze');
    expect(parseCompanionEvent({ type: 'embodiment.awake', timestamp: 2, awake: false }).type).toBe('embodiment.awake');
    expect(avatarCapabilitiesSchema.safeParse(createAvatarCapabilities()).success).toBe(true);
    expect(avatarCapabilitiesSchema.safeParse({ ...createAvatarCapabilities(), gaze: true }).success).toBe(false);
    expect(avatarCapabilitiesSchema.safeParse({}).success).toBe(false);
    expect(companionEventSchema.safeParse({ type: 'embodiment.gesture', timestamp: 1, gesture: 'wake_up' }).success).toBe(false);
  });

  it('validates future tool requests and normalized results without executing them', () => {
    const request = { callId: 'call-1', tool: 'calendar.list', capabilityId: 'calendar', args: { day: '2026-10-03' }, intent: 'Read today', consequence: 'read', timestamp: 1 };
    expect(toolRequestSchema.safeParse(request).success).toBe(true);
    expect(toolRequestSchema.safeParse({ ...request, args: () => {} }).success).toBe(false);
    expect(toolRequestSchema.safeParse({ ...request, consequence: 'arbitrary' }).success).toBe(false);
    expect(toolResultSchema.safeParse({ callId: 'call-1', timestamp: 2, status: 'denied', reason: 'No permission' }).success).toBe(true);
    expect(toolResultSchema.safeParse({ callId: 'call-1', timestamp: 2, status: 'completed', result: [1, 2] }).success).toBe(true);
    expect(toolResultSchema.safeParse({ callId: 'call-1', timestamp: 2, status: 'completed', result: Number.NaN }).success).toBe(false);
  });

  it.each([
    { type: 'embodiment.affect', timestamp: 1, emotion: 'happy', intensity: 1.5 },
    { type: 'embodiment.affect', timestamp: 1, emotion: 'RiveSmile', intensity: 0.5 },
    { type: 'embodiment.gaze', timestamp: 1, target: { x: Number.NaN, y: 0 } },
    { type: 'embodiment.gesture', timestamp: 1, gesture: 'nod', secret: 'unexpected' },
    { type: 'user.speech.started', timestamp: -1 },
    { type: 'assistant.language.changed', timestamp: 1, language: 'fr' },
    { type: 'user.speech.started' },
  ])('rejects invalid or unexpected boundary data %j', (input) => {
    expect(companionEventSchema.safeParse(input).success).toBe(false);
  });
});

describe('typed event bus', () => {
  it('supports type-specific and wildcard subscribers with cleanup', () => {
    const bus = new CompanionEventBus();
    const log: string[] = [];
    const unsubscribe = bus.on('embodiment.gesture', (event) => log.push(event.gesture));
    bus.on('*', (event) => log.push(event.type));
    bus.emit({ type: 'embodiment.gesture', gesture: 'wave', timestamp: 0 });
    unsubscribe();
    bus.emit({ type: 'embodiment.gesture', gesture: 'nod', timestamp: 1 });
    expect(log).toEqual(['wave', 'embodiment.gesture', 'embodiment.gesture']);
    bus.clear();
    bus.emit({ type: 'user.speech.started', timestamp: 2 });
    expect(log).toHaveLength(3);
  });

  it('snapshots subscribers when subscription changes during an event', () => {
    const bus = new CompanionEventBus();
    const log: string[] = [];
    let removeSecond = () => {};
    bus.on('user.speech.started', () => { log.push('first'); removeSecond(); });
    removeSecond = bus.on('user.speech.started', () => log.push('second'));
    bus.emit({ type: 'user.speech.started', timestamp: 0 });
    bus.emit({ type: 'user.speech.started', timestamp: 1 });
    expect(log).toEqual(['first', 'second', 'first']);
  });

  it('delivers to other subscribers before reporting a listener failure', () => {
    const failures: unknown[] = [];
    const bus = new CompanionEventBus({ onError: (error) => failures.push(error) });
    let delivered = false;
    bus.on('*', () => { throw new Error('observer failed'); });
    bus.on('*', () => { delivered = true; });
    bus.emit({ type: 'user.speech.started', timestamp: 0 });
    expect(delivered).toBe(true);
    expect(failures).toHaveLength(1);
    expect(() => bus.emitUnknown({ type: 'embodiment.speech_energy', timestamp: 0, value: 2 })).toThrow();
  });
});
