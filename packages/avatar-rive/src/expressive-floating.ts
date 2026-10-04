import { clamp, createAvatarCapabilities, type AvatarFrame } from '@amyu/avatar-contract';
import type { RiveAnimationValues, RiveRigAdapter } from './rig';

/** Adaptation of the unmodified, attributed Expressive Floating Character file. */
export function mapExpressiveFloatingAnimations(frame: AvatarFrame): RiveAnimationValues {
  const speech = frame.state === 'speaking' && frame.awake ? clamp(frame.speechEnergy) : 0;
  const wave = frame.gesture?.name === 'wave' ? frame.gesture : null;
  return {
    idle: { mix: 1, progress: (Math.max(0, frame.timeMs) % 5000) / 5000 },
    Thinking: { mix: clamp(frame.stateWeights.thinking), progress: 1 },
    Talking: { mix: clamp(frame.stateWeights.speaking) * speech },
    // AMYU-composed attentiveness: hold an existing authored arm-raise frame.
    // This is adapted playback, not a native Listening head/body animation.
    Waving: { mix: wave ? Math.sin(clamp(wave.progress) * Math.PI) * clamp(wave.intensity) : clamp(frame.stateWeights.listening) * 0.8, progress: wave?.progress ?? 0.3 },
    // The normal authored mouth is a deterministic baseline, including speech=0.
    'Mouth-normal': { mix: 1, progress: 1 },
    Listening: { mix: clamp(frame.stateWeights.listening), progress: 0 },
    'Mouth-smile': { mix: clamp(frame.smile) * (1 - speech), progress: 1 },
    'Mouth-talk': { mix: speech },
    // Authored close clips run backwards. Their timeline start is the closed pose.
    'EYES-open': { mix: 1, progress: 1 },
    'EYES-close': { mix: clamp(1 - frame.eyeOpenness), progress: 0 },
  };
}

export const expressiveFloatingRig: RiveRigAdapter = {
  attribution: {
    title: 'Expressive Floating Character Rig (Old Work Share)', creator: 'kouidero',
    sourceUrl: 'https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/',
    license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  framing: {
    bounds: { minX: 60, minY: 0, maxX: 880, maxY: 1000 },
    source: 'Presentation crop only. Actual 1062×1382 artboard; 101 samples each of idle/Listening/Talking/Thinking/Waving yielded non-background Canvas2D curve-control bounds x124.91..761.10, y113.84..817.16, including shadow. Uniform Fit.contain preserves padded motion bounds; original binary unchanged.',
  },
  id: 'expressive-floating-character', artboard: 'Artboard', stateMachine: 'State Machine 1',
  inputs: [
    { name: 'isTalking', type: 'boolean', control: 'native speaking state' },
    { name: 'isListening', type: 'boolean', control: 'native listening state' },
  ],
  animations: [
    { name: 'idle', control: 'authored idle reset / breathing baseline', mode: 'loop', stage: 'baseline' },
    { name: 'Thinking', control: 'authored thinking pose', mode: 'pose', resetAtRest: 0 },
    { name: 'Talking', control: 'authored speaking body motion', mode: 'loop', resetAtRest: 0 },
    { name: 'Waving', control: 'authored wave / AMYU-composed attentive hand pose', mode: 'gesture', resetAtRest: 0 },
    { name: 'Mouth-normal', control: 'authored resting mouth', mode: 'pose' },
    { name: 'Listening', control: 'limited authored listening mouth contour', mode: 'pose' },
    { name: 'Mouth-smile', control: 'limited authored smile', mode: 'pose' },
    { name: 'Mouth-talk', control: 'speech-energy mix of authored open-talk segment', mode: 'loop', playbackRange: [0.3, 0.6], speed: 0.3 },
    { name: 'EYES-open', control: 'authored open-eye baseline', mode: 'pose' },
    { name: 'EYES-close', control: 'local blink / sleeping eyes', mode: 'pose' },
  ],
  capabilities: createAvatarCapabilities({
    gaze: 'unsupported', headControl: 'unsupported', continuousMouth: 'unsupported',
    emotionBlend: 'unsupported', visemes: 'unsupported', blink: 'supported',
    gestures: { wave: 'supported', nod: 'unsupported', shake_head: 'unsupported', head_tilt: 'unsupported', bounce: 'unsupported', celebrate: 'unsupported', shrug: 'unsupported' },
  }),
  animationCapabilityRequirements: { blink: ['EYES-open', 'EYES-close'], 'gesture:wave': ['Waving'] },
  mapFrame(frame) {
    return { isTalking: frame.state === 'speaking' && frame.awake && frame.speechEnergy > 0.01, isListening: frame.state === 'listening' && frame.awake };
  },
  mapAnimations: mapExpressiveFloatingAnimations,
};
