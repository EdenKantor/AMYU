import { clamp, createAvatarCapabilities, type AvatarCapabilities, type AvatarFrame, type Gesture } from '@amyu/avatar-contract';
import type { DiscoveredRiveInput, MappingDiagnostic, RiveInputType } from './inspection';

export interface NumericRiveInputSpec {
  name: string;
  type: 'number';
  control?: string;
  min: number;
  max: number;
}
export type RiveInputSpec = NumericRiveInputSpec | {
  name: string;
  type: 'boolean' | 'trigger';
  control?: string;
};
export type CapabilityName = Exclude<keyof AvatarCapabilities, 'gestures'> | `gesture:${Gesture}`;
export type RiveInputValues = Record<string, number | boolean>;

/** Only this adapter knows names inside the replaceable character artwork. */
export interface RiveRigAdapter {
  id: string;
  artboard: string;
  stateMachine: string;
  inputs: readonly RiveInputSpec[];
  capabilities: AvatarCapabilities;
  capabilityRequirements?: Partial<Record<CapabilityName, readonly string[]>>;
  mapFrame(frame: AvatarFrame, previous?: AvatarFrame): RiveInputValues;
  mapInteraction?(interaction: 'click'): readonly string[];
}

const bipolar = ['bodyX', 'bodyY', 'bodyRotate', 'headX', 'headY', 'headTilt', 'gazeX', 'gazeY', 'browTilt', 'smile', 'leftArm', 'rightArm', 'feet', 'antenna'];
const unipolar = ['browRaise', 'mouthOpen', 'armLift'];
const scale = ['bodyScaleX', 'bodyScaleY', 'eyeScale', 'mouthWidth', 'shadow'];

export const developerInputs: readonly NumericRiveInputSpec[] = [
  ...bipolar.map((name) => ({ name, type: 'number' as const, min: -1, max: 1 })),
  ...unipolar.map((name) => ({ name, type: 'number' as const, min: 0, max: 1 })),
  ...scale.map((name) => ({ name, type: 'number' as const, min: 0, max: 2 })),
  { name: 'eyeOpen', type: 'number', min: 0, max: 1.5 },
];

/** All body/face values already interpolate in the director. No semantic snapping here. */
export function mapDeveloperFrame(frame: AvatarFrame): Record<string, number> {
  const e = frame.emotionWeights;
  const s = frame.stateWeights;
  const breath = clamp(frame.breathing) - 0.5;
  const time = frame.timeMs / 1000;
  let leftArm = 0.1 + frame.bodyLeanX * 0.2;
  let rightArm = -0.1 + frame.bodyLeanX * 0.2;
  let armLift = s.listening * 0.08 + s.acting * 0.12;
  const gesture = frame.gesture;
  if (gesture) {
    // Every one-shot starts/ends at zero. Gesture intensity also honors reduced motion.
    const envelope = Math.sin(clamp(gesture.progress) * Math.PI) * clamp(gesture.intensity);
    const wave = Math.sin(gesture.progress * Math.PI * 6);
    if (gesture.name === 'wave') {
      rightArm -= envelope * (0.75 + wave * 0.18);
      armLift += envelope * 0.9;
    } else if (gesture.name === 'celebrate') {
      leftArm += envelope * 0.9;
      rightArm -= envelope * 0.9;
      armLift += envelope;
    } else if (gesture.name === 'shrug') {
      leftArm += envelope * 0.24;
      rightArm -= envelope * 0.24;
      armLift += envelope * 0.8;
    }
  }
  const values: Record<string, number> = {
    bodyX: frame.bodyLeanX,
    bodyY: frame.bounce * 0.8 - frame.bodyLeanY * 0.5 - s.sleeping * 0.2 + breath * 0.035,
    bodyRotate: frame.bodyLeanX * 0.85,
    bodyScaleX: 1 + frame.squash * 0.12 - breath * 0.01,
    bodyScaleY: 1 - frame.squash * 0.12 + breath * 0.016 - s.sleeping * 0.045,
    headX: frame.headRotationX,
    headY: frame.headRotationY + s.listening * -0.18 + s.sleeping * 0.15,
    headTilt: frame.headTilt,
    gazeX: frame.gaze.x,
    gazeY: frame.gaze.y,
    eyeOpen: frame.eyeOpenness * (1 - frame.eyeSquint * 0.7) * frame.eyeScale,
    eyeScale: frame.eyeScale,
    browRaise: e.concerned * 0.8 + e.curious * 0.45 + e.surprised * 0.7 + e.confused * 0.65 + e.focused * 0.5,
    browTilt: -e.concerned * 0.6 - e.empathetic * 0.22 + e.focused * 0.6 - e.confused * 0.45,
    mouthOpen: frame.mouthOpen,
    mouthWidth: 0.6 + frame.mouthWidth,
    smile: 0.18 + frame.smile * 0.82 - frame.frown * 1.1,
    leftArm,
    rightArm,
    armLift,
    feet: frame.bounce * 0.5,
    antenna: frame.headTilt * 0.2 + Math.sin(time * 2) * s.thinking * 0.25 + Math.sin(time * 3) * s.acting * 0.2,
    shadow: 1 - Math.max(0, frame.bounce) * 0.3 + s.sleeping * 0.15,
  };
  return Object.fromEntries(developerInputs.map(({ name, min, max }) => [name, clamp(values[name], min, max)]));
}

export const developerRig: RiveRigAdapter = {
  id: 'amyu-developer-v1',
  artboard: 'AMYU Developer',
  stateMachine: 'AMYU Developer',
  inputs: developerInputs,
  capabilities: createAvatarCapabilities({
    gaze: 'supported', blink: 'supported', continuousMouth: 'supported',
    emotionBlend: 'supported', headControl: 'supported', visemes: 'unsupported',
    gestures: { wave: 'supported', nod: 'supported', shake_head: 'supported', head_tilt: 'supported', bounce: 'supported', celebrate: 'supported', shrug: 'supported' },
  }),
  capabilityRequirements: {
    gaze: ['gazeX', 'gazeY'], blink: ['eyeOpen'], continuousMouth: ['mouthOpen'],
    emotionBlend: ['smile', 'browRaise', 'browTilt', 'eyeScale'], headControl: ['headX', 'headY', 'headTilt'],
    'gesture:wave': ['rightArm', 'armLift'], 'gesture:nod': ['headY'],
    'gesture:shake_head': ['headX'], 'gesture:head_tilt': ['headTilt'],
    'gesture:bounce': ['bodyY'], 'gesture:celebrate': ['leftArm', 'rightArm', 'armLift'],
    'gesture:shrug': ['leftArm', 'rightArm', 'armLift'],
  },
  mapFrame: mapDeveloperFrame,
};

/** Declared visual support is downgraded when actual controls are absent/wrong-type. */
export function verifiedCapabilities(adapter: RiveRigAdapter, discovered: readonly DiscoveredRiveInput[]): AvatarCapabilities {
  const result = createAvatarCapabilities(adapter.capabilities);
  const actual = new Map(discovered.map(({ name, type }) => [name, type]));
  const expected = new Map(adapter.inputs.map(({ name, type }) => [name, type as RiveInputType]));
  for (const [capability, required] of Object.entries(adapter.capabilityRequirements ?? {})) {
    const available = required.every((name) => actual.has(name) && actual.get(name) === expected.get(name));
    if (!available) {
      if (capability.startsWith('gesture:')) result.gestures[capability.slice(8) as Gesture] = 'unsupported';
      else result[capability as Exclude<keyof AvatarCapabilities, 'gestures'>] = 'unsupported';
    }
  }
  return result;
}

/** Pure inspector: usable after a canvas is unmounted, without loading WASM. */
export function diagnoseMappings(
  adapter: RiveRigAdapter,
  discovered: readonly DiscoveredRiveInput[],
  frame?: AvatarFrame,
  previous?: AvatarFrame,
): MappingDiagnostic[] {
  const actual = new Map(discovered.map((input) => [input.name, input]));
  const values = frame ? adapter.mapFrame(frame, previous) : undefined;
  return adapter.inputs.map((spec) => {
    const input = actual.get(spec.name);
    const diagnostic: MappingDiagnostic = {
      control: spec.control ?? spec.name, input: spec.name,
      expectedType: spec.type, actualType: input?.type ?? null,
      status: 'MAPPED',
    };
    if (!input) {
      diagnostic.status = 'UNMAPPED'; diagnostic.reason = 'Requested input is absent from the inspected state machine.';
    } else if (input.type !== spec.type) {
      diagnostic.status = 'UNMAPPED'; diagnostic.reason = `Expected ${spec.type}, discovered ${input.type}.`;
    } else if (values) {
      const value = values[spec.name];
      const valid = spec.type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === 'boolean';
      if (!valid) {
        diagnostic.status = 'UNMAPPED'; diagnostic.reason = 'Adapter did not produce a valid value for this control.';
      } else diagnostic.value = spec.type === 'number' ? clamp(value as number, spec.min, spec.max) : value;
    }
    return diagnostic;
  });
}
