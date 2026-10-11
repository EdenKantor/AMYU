import { clamp, createAvatarCapabilities, emotions, type AvatarFrame } from '@amyu/avatar-contract';
import type { RiveAnimationValues, RiveRigAdapter } from './rig';

/** Every pose below comes from the downloaded timelines; no new artwork. */
export function mapFriendlyFloatingBot(frame: AvatarFrame): RiveAnimationValues {
  const weights = frame.stateWeights;
  const sleeping = clamp(weights.sleeping);
  // Authored motion/eyelids share tracks. Keep those tracks in the same phase
  // when blending, and hold the measured closed-eye frame while sleeping.
  const timeMs = Number.isFinite(frame.timeMs) ? Math.max(0, frame.timeMs) : 0;
  const cycle = ((timeMs / 1000) * 0.2) % (29 / 24);
  const phase = frame.reducedMotion ? 0.5 : cycle / (29 / 24);
  const idlePhase = clamp((phase * 29 - 1) / 28);
  const wave = frame.gesture?.name === 'wave'
    ? Math.sin(clamp(frame.gesture.progress) * Math.PI) * clamp(frame.gesture.intensity) : 0;
  const speech = frame.state === 'speaking' && frame.awake
    ? clamp(frame.speechEnergy) * (frame.reducedMotion ? 0.3 : 1) : 0;
  return {
    'Theme Light': { mix: 1, progress: 1 },
    Idle: { mix: 1, progress: idlePhase * (1 - sleeping) + sleeping / 14 },
    // A one-hand greeting supplies the limited attentive pose. Gestures take
    // priority over other states so their keyed arms cannot overwrite a wave.
    'welcome loop': { mix: clamp(weights.listening * 0.9 * (1 - wave) + wave), progress: phase },
    // The original floating cube is an outward visualization of processing.
    'Receive loop': { mix: clamp(weights.thinking + weights.acting) * (1 - wave), progress: phase },
    // Speaking follows syllable gain and returns completely to rest in pauses.
    // Acting combines two lifted hands with the original cube/particles.
    'talking loop': {
      mix: clamp(weights.speaking * speech + weights.acting * 0.58) * (1 - wave),
      progress: phase,
    },
  };
}

/** Original downloaded robot, exposed for visual evaluation only. */
export const friendlyFloatingBotRig: RiveRigAdapter = {
  id: 'friendly-floating-bot-review', artboard: 'tyepx ai bot', stateMachine: 'Theme_SM',
  stateMachinePlayback: 'authored-only',
  inputs: [], mapFrame: () => ({}),
  animations: [
    { name: 'Theme Light', control: 'original light appearance', mode: 'pose', stage: 'baseline' },
    { name: 'Idle', control: 'authored float / blink / closed-eye rest', mode: 'pose', stage: 'baseline' },
    { name: 'Receive loop', control: 'authored hologram / thinking and acting composition', mode: 'pose', resetAtRest: 0 },
    { name: 'talking loop', control: 'authored speech face / arms / acting emphasis', mode: 'pose', resetAtRest: 0 },
    { name: 'welcome loop', control: 'composed listening / authored greeting', mode: 'pose', resetAtRest: 0 },
  ],
  previewBaseline: [{ name: 'Theme Light', progress: 1 }, { name: 'Idle', progress: 0.5 }],
  mapAnimations: mapFriendlyFloatingBot,
  capabilities: createAvatarCapabilities({
    gaze: 'unsupported', headControl: 'unsupported', continuousMouth: 'unsupported',
    emotionBlend: 'unsupported', visemes: 'unsupported', blink: 'unsupported',
    gestures: { wave: 'supported', nod: 'unsupported', shake_head: 'unsupported', head_tilt: 'unsupported', bounce: 'unsupported', celebrate: 'unsupported', shrug: 'unsupported' },
  }),
  animationCapabilityRequirements: { 'gesture:wave': ['welcome loop'] },
  framing: {
    bounds: { minX: 50, minY: 145, maxX: 320, maxY: 386 },
    source: 'Uniform presentation crop only. Original robot, shadow and active props sampled every authored frame fit x62.56..307.14/y155.42..384.14. Excludes original demo buttons starting at y389.48; binary unchanged.',
  },
  attribution: {
    title: 'Friendly Floating Bot', creator: 'sukeycool',
    sourceUrl: 'https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/',
    license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  reviewSupport: {
    states: {
      idle: { status: 'partial', note: 'Original relaxed float and authored blinks; repeating motion, no independent pupil control.' },
      listening: { status: 'partial', note: 'Composed raised-hand greeting; it can read as welcoming rather than listening.' },
      thinking: { status: 'partial', note: 'Original one-hand hologram pose represents processing; no inward head or gaze control.' },
      speaking: { status: 'partial', note: 'Original mouth and both arms follow the speech envelope; face and body are coupled.' },
      acting: { status: 'partial', note: 'Composed hologram with two-hand emphasis; original timelines, no separate task-action clip.' },
      sleeping: { status: 'partial', note: 'Measured authored closed-eye pose held still; no separate sleeping animation.' },
    },
    emotions: Object.fromEntries(emotions.map(emotion => [emotion, {
      status: emotion === 'neutral' ? 'supported' as const : 'unsupported' as const,
      note: emotion === 'neutral' ? 'Original neutral robot face.' : 'No independently verified expression for this emotion.',
    }])),
  },
};
