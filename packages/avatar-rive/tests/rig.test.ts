import { describe, expect, it } from 'vitest';
import { conversationStates, emotions, type AvatarFrame } from '@amyu/avatar-contract';
import { developerInputs, developerRig, diagnoseMappings, mapDeveloperFrame, verifiedCapabilities } from '../src/rig';
import { createProductionRig, productionInputs } from '../src/production';
import manifest from '../../../assets/character/rig-manifest.json';

function frame(overrides: Partial<AvatarFrame> = {}): AvatarFrame {
  return {
    timeMs: 1000, state: 'idle', emotion: 'neutral', emotionIntensity: 0,
    presence: 'present', awake: true,
    stateWeights: Object.fromEntries(conversationStates.map((value) => [value, value === 'idle' ? 1 : 0])) as AvatarFrame['stateWeights'],
    emotionWeights: Object.fromEntries(emotions.map((value) => [value, value === 'neutral' ? 1 : 0])) as AvatarFrame['emotionWeights'],
    gaze: { x: 0, y: 0 }, headRotationX: 0, headRotationY: 0, headTilt: 0,
    bodyLeanX: 0, bodyLeanY: 0, breathing: 0.5, blink: 0,
    eyeOpenness: 1, eyeScale: 1, eyeSquint: 0,
    mouthOpen: 0, speechEnergy: 0, mouthWidth: 0.45, smile: 0, frown: 0,
    bounce: 0, anticipation: 0, squash: 0, animationEnergy: 0.12,
    gesture: null, ...overrides,
  };
}

describe('development Rive rig adapter', () => {
  it('agrees with the generated artboard input contract', () => {
    expect(developerInputs.map(({ name, min, max }) => ({ name, min, max })).sort((a, b) => a.name.localeCompare(b.name)))
      .toEqual(manifest.inputs.map(({ name, min, max }) => ({ name, min, max })).sort((a, b) => a.name.localeCompare(b.name)));
    expect(Object.keys(mapDeveloperFrame(frame())).sort()).toEqual(developerInputs.map(({ name }) => name).sort());
  });

  it('drives gaze axes and closes eyes on a complete blink', () => {
    const mapped = mapDeveloperFrame(frame({ gaze: { x: 0.73, y: -0.4 }, blink: 1, eyeOpenness: 0 }));
    expect(mapped.gazeX).toBeCloseTo(0.73);
    expect(mapped.gazeY).toBeCloseTo(-0.4);
    expect(mapped.eyeOpen).toBe(0);
  });

  it('makes speech energy visibly open the mouth while preserving width', () => {
    const quiet = mapDeveloperFrame(frame());
    const speaking = mapDeveloperFrame(frame({ state: 'speaking', mouthOpen: 0.72 }));
    expect(quiet.mouthOpen).toBe(0);
    expect(speaking.mouthOpen).toBe(0.72);
    expect(speaking.mouthWidth).toBe(quiet.mouthWidth);
  });

  it('maps continuous expressions without inspecting the semantic emotion name', () => {
    const calm = mapDeveloperFrame(frame({ emotion: 'happy', smile: 0.25 }));
    const happy = mapDeveloperFrame(frame({ emotion: 'happy', smile: 0.85 }));
    const renamed = mapDeveloperFrame(frame({ emotion: 'neutral', smile: 0.85 }));
    expect(happy.smile).toBeGreaterThan(calm.smile);
    expect(happy.smile).toBe(renamed.smile);
  });

  it('animates arm gestures with a smooth return to rest', () => {
    const neutral = mapDeveloperFrame(frame());
    const raised = mapDeveloperFrame(frame({ gesture: { name: 'celebrate', progress: 0.5, intensity: 1 } }));
    const done = mapDeveloperFrame(frame({ gesture: { name: 'celebrate', progress: 1, intensity: 1 } }));
    expect(raised.armLift).toBe(1);
    expect(raised.leftArm).toBeGreaterThan(neutral.leftArm);
    expect(raised.rightArm).toBeLessThan(neutral.rightArm);
    expect(done.armLift).toBeCloseTo(neutral.armLift);
    expect(done.leftArm).toBeCloseTo(neutral.leftArm);
  });

  it('breathes through the Rive body scale controls', () => {
    const inhale = mapDeveloperFrame(frame({ breathing: 1 }));
    const exhale = mapDeveloperFrame(frame({ breathing: 0 }));
    expect(inhale.bodyScaleY).toBeGreaterThan(exhale.bodyScaleY);
    expect(inhale.bodyScaleX).toBeLessThan(exhale.bodyScaleX);
  });

  it('keeps every input finite and within its authored range', () => {
    const mapped = mapDeveloperFrame(frame({ gaze: { x: Infinity, y: -99 }, mouthOpen: NaN, eyeScale: 99, squash: 99 }));
    for (const { name, min, max } of developerInputs) {
      expect(Number.isFinite(mapped[name])).toBe(true);
      expect(mapped[name]).toBeGreaterThanOrEqual(min);
      expect(mapped[name]).toBeLessThanOrEqual(max);
    }
  });

  it('reports absent optional controls as UNMAPPED and downgrades capabilities', () => {
    const actual = developerInputs.filter(({ name }) => name !== 'mouthOpen').map(({ name, type }) => ({ name, type, typeId: 56 }));
    const diagnostics = diagnoseMappings(developerRig, actual, frame({ mouthOpen: 0.7 }));
    expect(diagnostics.find(({ input }) => input === 'mouthOpen')?.status).toBe('UNMAPPED');
    expect(diagnostics.find(({ input }) => input === 'gazeX')?.status).toBe('MAPPED');
    expect(verifiedCapabilities(developerRig, actual).continuousMouth).toBe('unsupported');
    expect(verifiedCapabilities(developerRig, actual).gaze).toBe('supported');
  });

  it('rejects a wrong input type without throwing or claiming support', () => {
    const diagnostics = diagnoseMappings(developerRig, [{ name: 'mouthOpen', type: 'boolean', typeId: 59 }], frame());
    const mouth = diagnostics.find(({ input }) => input === 'mouthOpen');
    expect(mouth?.status).toBe('UNMAPPED');
    expect(mouth?.reason).toContain('Expected number, discovered boolean');
  });

  it('keeps unverified production visuals unknown even when target inputs exist', () => {
    const adapter = createProductionRig();
    const actual = productionInputs.map(({ name, type }) => ({ name, type, typeId: type === 'number' ? 56 : type === 'boolean' ? 59 : 58 }));
    expect(verifiedCapabilities(adapter, actual).gaze).toBe('unknown');
    expect(verifiedCapabilities(adapter, actual).gestures.wave).toBe('unknown');
    expect(verifiedCapabilities(adapter, actual).visemes).toBe('unsupported');
  });

  it('produces typed production state flags and gesture/lifecycle pulses', () => {
    const adapter = createProductionRig();
    const idle = frame();
    const speaking = frame({ state: 'speaking', speechEnergy: 0.65, mouthOpen: 0.5, emotion: 'surprised', mouthWidth: 0.7 });
    const values = adapter.mapFrame(speaking, idle);
    expect(values.isSpeaking).toBe(true);
    expect(values.isListening).toBe(false);
    expect(values.speechEnergy).toBe(0.65);
    expect(values.mouthWidth).toBeCloseTo(0.4);
    expect(values.emotion).toBe(5);
    const wave = frame({ gesture: { name: 'wave', progress: 0.2, intensity: 1 } });
    expect(adapter.mapFrame(wave, idle).gestureWave).toBe(true);
    expect(adapter.mapFrame(frame({ gesture: { name: 'wave', progress: 0.3, intensity: 1 } }), wave).gestureWave).toBe(false);
    expect(adapter.mapFrame(frame({ awake: false }), idle).goToSleep).toBe(true);
    expect(adapter.mapFrame(idle, frame({ awake: false })).wakeUp).toBe(true);
  });

  it('swaps to a second mapping configuration without changing a core frame', () => {
    const snapshot = frame({ gaze: { x: 0.4, y: -0.3 }, mouthOpen: 0.63 });
    const before = structuredClone(snapshot);
    const alternate = createProductionRig({
      id: 'alternate-artwork', artboard: 'Other Mascot', stateMachine: 'Main',
      mapping: { gazeX: 'lookX', gazeY: 'lookY', mouthOpen: 'jawOpen' },
    });
    const actual = [{ name: 'lookX', type: 'number' as const, typeId: 56 }, { name: 'lookY', type: 'number' as const, typeId: 56 }, { name: 'jawOpen', type: 'number' as const, typeId: 56 }];
    const diagnostics = diagnoseMappings(alternate, actual, snapshot);
    expect(diagnostics.find(({ control }) => control === 'gazeX')).toMatchObject({ input: 'lookX', status: 'MAPPED', value: 0.4 });
    expect(diagnostics.find(({ control }) => control === 'mouthOpen')).toMatchObject({ input: 'jawOpen', status: 'MAPPED', value: 0.63 });
    expect(diagnostics.find(({ control }) => control === 'gestureWave')?.status).toBe('UNMAPPED');
    expect(snapshot).toEqual(before);
  });
});
