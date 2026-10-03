import { clamp, createAvatarCapabilities, emotions, type AvatarCapabilityOverrides, type AvatarFrame, type Gesture } from '@amyu/avatar-contract';
import type { RiveInputSpec, RiveInputValues, RiveRigAdapter } from './rig';

const signed = ['gazeX', 'gazeY', 'headYaw', 'headPitch', 'headTilt', 'mouthWidth', 'bodyLean'] as const;
const unit = ['eyeOpen', 'blinkOverride', 'mouthOpen', 'smile', 'frown', 'browUp', 'browDown', 'bodyBounce', 'speechEnergy', 'emotionIntensity'] as const;
const boolean = ['isListening', 'isThinking', 'isSpeaking', 'isActing', 'isSleeping'] as const;
const triggers = ['gestureWave', 'gestureNod', 'gestureShakeHead', 'gestureHeadTilt', 'gestureBounce', 'gestureCelebrate', 'gestureShrug', 'clickReact', 'wakeUp', 'goToSleep'] as const;
export type ProductionControl = typeof signed[number] | typeof unit[number] | typeof boolean[number] | typeof triggers[number] | 'emotion';

export const productionInputs: readonly RiveInputSpec[] = [
  ...signed.map((name) => ({ name, control: name, type: 'number' as const, min: -1, max: 1 })),
  ...unit.map((name) => ({ name, control: name, type: 'number' as const, min: 0, max: 1 })),
  { name: 'emotion', control: 'emotion', type: 'number', min: 0, max: 9 },
  ...boolean.map((name) => ({ name, control: name, type: 'boolean' as const })),
  ...triggers.map((name) => ({ name, control: name, type: 'trigger' as const })),
];

const gestureControls: Record<Gesture, ProductionControl> = {
  wave: 'gestureWave', nod: 'gestureNod', shake_head: 'gestureShakeHead',
  head_tilt: 'gestureHeadTilt', bounce: 'gestureBounce', celebrate: 'gestureCelebrate', shrug: 'gestureShrug',
};

export interface ProductionRigConfig {
  id?: string;
  artboard?: string;
  stateMachine?: string;
  /** Only the adapter changes when actual artwork uses different input names. */
  mapping?: Partial<Record<ProductionControl, string>>;
  /** Set supported only after inspecting controls AND verifying their visual behavior. */
  capabilities?: AvatarCapabilityOverrides;
}

function productionFrame(frame: AvatarFrame, previous?: AvatarFrame): RiveInputValues {
  const e = frame.emotionWeights;
  const values: RiveInputValues = {
    gazeX: frame.gaze.x, gazeY: frame.gaze.y,
    headYaw: frame.headRotationX, headPitch: frame.headRotationY, headTilt: frame.headTilt,
    eyeOpen: frame.eyeOpenness, blinkOverride: frame.blink,
    mouthOpen: frame.mouthOpen, mouthWidth: clamp(frame.mouthWidth) * 2 - 1,
    smile: frame.smile, frown: frame.frown,
    browUp: clamp(e.concerned * 0.8 + e.curious * 0.45 + e.surprised * 0.7 + e.empathetic * 0.22),
    browDown: clamp(e.focused * 0.6 + e.confused * 0.45),
    bodyBounce: clamp(frame.bounce), bodyLean: frame.bodyLeanX,
    speechEnergy: frame.speechEnergy, emotionIntensity: frame.emotionIntensity,
    emotion: Math.max(0, emotions.indexOf(frame.emotion)),
    isListening: frame.state === 'listening', isThinking: frame.state === 'thinking',
    isSpeaking: frame.state === 'speaking', isActing: frame.state === 'acting',
    isSleeping: frame.state === 'sleeping' || !frame.awake,
  };
  for (const name of triggers) values[name] = false;
  const gesture = frame.gesture;
  if (gesture && (previous?.gesture?.name !== gesture.name || gesture.progress < previous.gesture.progress)) {
    values[gestureControls[gesture.name]] = true;
  }
  if (previous) {
    const wasSleeping = !previous.awake || previous.state === 'sleeping';
    const sleeping = !frame.awake || frame.state === 'sleeping';
    values.wakeUp = wasSleeping && !sleeping;
    values.goToSleep = !wasSleeping && sleeping;
  }
  return values;
}

/** Target specification; no production artwork is bundled and support starts unknown. */
export function createProductionRig(config: ProductionRigConfig = {}): RiveRigAdapter {
  const name = (control: ProductionControl) => config.mapping?.[control] ?? control;
  return {
    id: config.id ?? 'amyu-production-target-v1',
    artboard: config.artboard ?? 'AMYU',
    stateMachine: config.stateMachine ?? 'AMYU_Main',
    inputs: productionInputs.map((input) => ({ ...input, name: name(input.name as ProductionControl) })),
    capabilities: createAvatarCapabilities({ visemes: 'unsupported', ...config.capabilities }),
    capabilityRequirements: {
      gaze: [name('gazeX'), name('gazeY')], blink: [name('eyeOpen'), name('blinkOverride')],
      continuousMouth: [name('mouthOpen')], emotionBlend: [name('emotion'), name('emotionIntensity')],
      headControl: [name('headYaw'), name('headPitch'), name('headTilt')],
      ...Object.fromEntries(Object.entries(gestureControls).map(([gesture, control]) => [`gesture:${gesture}`, [name(control)]])),
    },
    mapFrame(frame, previous) {
      const values = productionFrame(frame, previous);
      return Object.fromEntries(Object.entries(values).map(([control, value]) => [name(control as ProductionControl), value]));
    },
    mapInteraction: () => [name('clickReact')],
  };
}
