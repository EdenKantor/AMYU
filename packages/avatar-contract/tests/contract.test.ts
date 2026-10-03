import { describe, expect, it } from 'vitest';
import { clamp, conversationStates, createAvatarCapabilities, emotions, gestures, isConversationState, isEmotion, isGesture, normalizeGaze } from '../src/index';

describe('semantic contract', () => {
  it('contains every required input without duplicating semantic names', () => {
    expect(conversationStates).toHaveLength(6);
    expect(emotions).toHaveLength(10);
    expect(gestures).toHaveLength(7);
    for (const values of [conversationStates, emotions, gestures]) expect(new Set(values).size).toBe(values.length);
    expect(isConversationState('speaking')).toBe(true);
    expect(isEmotion('confused')).toBe(true);
    expect(isGesture('head_tilt')).toBe(true);
    expect(isGesture('Rive_wave_trigger')).toBe(false);
    expect(isConversationState('offline')).toBe(false);
    expect(isEmotion('sleepy')).toBe(false);
    expect(isGesture('small_shrug')).toBe(false);
  });

  it('preserves unknown and unsupported capabilities instead of faking support', () => {
    const capabilities = createAvatarCapabilities({ gaze: 'unsupported', blink: 'supported', gestures: { wave: 'supported' } });
    expect(capabilities.gaze).toBe('unsupported');
    expect(capabilities.blink).toBe('supported');
    expect(capabilities.continuousMouth).toBe('unknown');
    expect(capabilities.visemes).toBe('unknown');
    expect(capabilities.gestures.wave).toBe('supported');
    expect(capabilities.gestures.shrug).toBe('unknown');
    expect(Object.keys(capabilities.gestures)).toHaveLength(7);
    capabilities.gestures.wave = 'unsupported';
    expect(createAvatarCapabilities().gestures.wave).toBe('unknown');
  });

  it('bounds untrusted continuous values and removes non-finite values', () => {
    expect(clamp(2)).toBe(1);
    expect(clamp(Number.NaN)).toBe(0);
    expect(normalizeGaze({ x: -8, y: Number.POSITIVE_INFINITY })).toEqual({ x: -1, y: 0 });
  });
});
