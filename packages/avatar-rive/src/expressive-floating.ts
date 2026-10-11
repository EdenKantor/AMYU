import { clamp, createAvatarCapabilities, type AvatarFrame } from '@amyu/avatar-contract';
import type { RiveAnimationValues, RiveRigAdapter } from './rig';

/** Adaptation of the unmodified, attributed Expressive Floating Character file. */
export function mapExpressiveFloatingAnimations(frame: AvatarFrame): RiveAnimationValues {
  const speech = frame.state === 'speaking' && frame.awake ? clamp(frame.speechEnergy) : 0;
  const wave = frame.gesture?.name === 'wave' ? frame.gesture : null;
  const listening = clamp(frame.stateWeights.listening);
  const speaking = clamp(frame.stateWeights.speaking);
  const time = Math.max(0, frame.timeMs) / 1000;
  return {
    idle: { mix: 1, progress: (Math.max(0, frame.timeMs) % 5000) / 5000 },
    Thinking: { mix: clamp(frame.stateWeights.thinking), progress: 0.95 + Math.sin(time * 0.9) * 0.04 },
    // Listening composes the author's calm body-lift pose with the small native
    // listening contour. It is not a native attentive pose or gaze control.
    Talking: {
      mix: clamp(speaking * (0.12 + speech * 0.38) + listening * 0.42),
      ...(listening > speaking ? { progress: 0.22 } : {}),
      speed: 0.65 + speech * 0.2,
    },
    Waving: { mix: wave ? Math.sin(clamp(wave.progress) * Math.PI) * clamp(wave.intensity) : 0, progress: wave?.progress ?? 0 },
    // The normal authored mouth is a deterministic baseline, including speech=0.
    'Mouth-normal': { mix: 1, progress: 1 },
    Listening: { mix: listening, progress: 0 },
    'Mouth-smile': { mix: clamp(frame.smile) * (1 - speech), progress: 1 },
    'Mouth-talk': { mix: speech, speed: 0.7 + speech * 0.65 },
    // Timeline phase controls bilateral lids directly. In the actual artwork,
    // 0 is closed and ~0.6 is softer than the wide endpoint; no gaze is implied.
    'EYES-open': { mix: 1, progress: clamp(frame.eyeOpenness) * 0.72 },
  };
}

export const expressiveFloatingRig: RiveRigAdapter = {
  stateMachinePlayback: 'authored-only',
  previewBaseline: [
    { name: 'Thinking', progress: 0 }, { name: 'Talking', progress: 0 },
    { name: 'Waving', progress: 0 }, { name: 'idle', progress: 0 },
    { name: 'Mouth-normal', progress: 1 }, { name: 'EYES-open', progress: 1 },
  ],
  reviewSupport: {
    states: {
      idle: { status: 'partial', note: 'Authored float and neutral pose exist; current visual quality is not approved.' },
      listening: { status: 'unsupported', note: 'Focused authored Talking/mouth/eye composition still resembled idle in browser review; insufficient attentive posture.' },
      thinking: { status: 'partial', note: 'Authored hand-to-chin material; transitions and eye treatment require review.' },
      speaking: { status: 'partial', note: 'Full authored mouth cycle and restrained body motion render, but browser review still judged speech too tiny/subtle for the target.' },
      acting: { status: 'unsupported', note: 'No authored purposeful acting state.' },
      sleeping: { status: 'partial', note: 'Actual closed eyes; no dedicated sleeping body pose.' },
    },
    emotions: {
      neutral: { status: 'supported', note: 'Normal authored mouth and neutral body baseline.' },
      happy: { status: 'partial', note: 'Actual authored smile; no complete independent happy face rig.' },
      excited: { status: 'unsupported', note: 'No distinct authored excited expression.' },
      curious: { status: 'unsupported', note: 'No independent curiosity face or pupil controls.' },
      concerned: { status: 'unsupported', note: 'No authored concern/frown/brow channels.' },
      surprised: { status: 'unsupported', note: 'Speech aperture is not a distinct surprise expression.' },
      empathetic: { status: 'unsupported', note: 'A reused smile does not establish a distinct empathetic expression.' },
      amused: { status: 'unsupported', note: 'A reused smile does not establish a distinct amused expression.' },
      focused: { status: 'unsupported', note: 'No independent focus expression has been visually validated.' },
      confused: { status: 'unsupported', note: 'No authored confused expression.' },
    },
  },
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
    { name: 'Talking', control: 'restrained authored speech body / composed listening posture', mode: 'loop', resetAtRest: 0, keepPhaseWhenInactive: true },
    { name: 'Waving', control: 'authored wave gesture', mode: 'gesture', resetAtRest: 0 },
    { name: 'Mouth-normal', control: 'authored resting mouth', mode: 'pose' },
    { name: 'Listening', control: 'limited authored listening mouth contour', mode: 'pose' },
    { name: 'Mouth-smile', control: 'limited authored smile', mode: 'pose' },
    // Authored start pose resets ink fill; Mouth-normal restores resting shape.
    { name: 'Mouth-talk', control: 'full authored mouth cycle / speech energy and cadence', mode: 'loop', keepPhaseWhenInactive: true, resetAtRest: 0 },
    { name: 'EYES-open', control: 'soft bilateral eye phase / blink / sleep', mode: 'pose' },
  ],
  capabilities: createAvatarCapabilities({
    gaze: 'unsupported', headControl: 'unsupported', continuousMouth: 'unsupported',
    emotionBlend: 'unsupported', visemes: 'unsupported', blink: 'supported',
    gestures: { wave: 'supported', nod: 'unsupported', shake_head: 'unsupported', head_tilt: 'unsupported', bounce: 'unsupported', celebrate: 'unsupported', shrug: 'unsupported' },
  }),
  animationCapabilityRequirements: { blink: ['EYES-open'], 'gesture:wave': ['Waving'] },
  mapFrame(frame) {
    return { isTalking: frame.state === 'speaking' && frame.awake && frame.speechEnergy > 0.01, isListening: frame.state === 'listening' && frame.awake };
  },
  mapAnimations: mapExpressiveFloatingAnimations,
};
