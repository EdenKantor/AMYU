export const conversationStates = [
  'idle', 'listening', 'thinking', 'speaking', 'acting', 'sleeping',
] as const;

export const emotions = [
  'neutral', 'happy', 'excited', 'curious', 'concerned', 'surprised',
  'empathetic', 'amused', 'focused', 'confused',
] as const;

export const gestures = [
  'wave', 'nod', 'shake_head', 'head_tilt', 'bounce', 'celebrate', 'shrug',
] as const;

export const presenceStates = ['present', 'away', 'hidden'] as const;

export type ConversationState = typeof conversationStates[number];
export type Emotion = typeof emotions[number];
export type Gesture = typeof gestures[number];
export type PresenceState = typeof presenceStates[number];

/** Normalized gaze: x grows rightward and y downward; both are in [-1, 1]. */
export interface GazeTarget { x: number; y: number }

/** Provider and conversation code send semantic intents through this boundary. */
export interface AvatarController {
  setConversationState(state: ConversationState): void;
  setEmotion(emotion: Emotion, intensity: number): void;
  setGaze(x: number, y: number, weight?: number): void;
  setSpeechEnergy(value: number): void;
  triggerGesture(gesture: Gesture): void;
  setAwake(awake: boolean): void;
}

export const supportStatuses = ['supported', 'unsupported', 'unknown'] as const;
export type SupportStatus = typeof supportStatuses[number];

/** Only inspected, declared controls are supported. Missing information stays unknown. */
export interface AvatarCapabilities {
  gaze: SupportStatus;
  blink: SupportStatus;
  continuousMouth: SupportStatus;
  emotionBlend: SupportStatus;
  headControl: SupportStatus;
  gestures: Record<Gesture, SupportStatus>;
  visemes: SupportStatus;
}

export type AvatarCapabilityOverrides = Partial<Omit<AvatarCapabilities, 'gestures'>> & {
  gestures?: Partial<Record<Gesture, SupportStatus>>;
};

export function createAvatarCapabilities(overrides: AvatarCapabilityOverrides = {}): AvatarCapabilities {
  const status = (value: unknown): SupportStatus => supportStatuses.find((entry) => entry === value) ?? 'unknown';
  return {
    gaze: status(overrides.gaze), blink: status(overrides.blink),
    continuousMouth: status(overrides.continuousMouth), emotionBlend: status(overrides.emotionBlend),
    headControl: status(overrides.headControl), visemes: status(overrides.visemes),
    gestures: Object.fromEntries(gestures.map((gesture) => [gesture, status(overrides.gestures?.[gesture])])) as Record<Gesture, SupportStatus>,
  };
}

export interface AffectCue {
  emotion: Emotion;
  intensity: number;
  confidence: number;
  source: 'conversation' | 'assistant' | 'local' | 'task';
}

export interface PersonalityProfile {
  /** Calmer personas produce smaller idle body and head movement. */
  calmness: number;
  /** Scales the physical expression of semantic affect. */
  expressiveness: number;
  /** Scales local click and hover reactions. */
  playfulness: number;
}

export interface GestureFrame {
  name: Gesture;
  progress: number;
  intensity: number;
}

/** Physical pose, still independent from Rive input names or artwork. */
export interface AvatarFrame {
  timeMs: number;
  state: ConversationState;
  emotion: Emotion;
  emotionIntensity: number;
  presence: PresenceState;
  awake: boolean;
  stateWeights: Record<ConversationState, number>;
  emotionWeights: Record<Emotion, number>;
  gaze: GazeTarget;
  headRotationX: number;
  headRotationY: number;
  headTilt: number;
  bodyLeanX: number;
  bodyLeanY: number;
  breathing: number;
  blink: number;
  eyeOpenness: number;
  eyeScale: number;
  eyeSquint: number;
  mouthOpen: number;
  speechEnergy: number;
  mouthWidth: number;
  smile: number;
  frown: number;
  bounce: number;
  anticipation: number;
  squash: number;
  animationEnergy: number;
  gesture: GestureFrame | null;
}

/** Defensive normalization for continuous values arriving at the semantic boundary. */
export function clamp(value: number, min = 0, max = 1): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

export function normalizeGaze(target: GazeTarget): GazeTarget {
  return {
    x: Number.isFinite(target.x) ? clamp(target.x, -1, 1) : 0,
    y: Number.isFinite(target.y) ? clamp(target.y, -1, 1) : 0,
  };
}

export function isConversationState(value: unknown): value is ConversationState {
  return typeof value === 'string' && conversationStates.some((state) => state === value);
}

export function isEmotion(value: unknown): value is Emotion {
  return typeof value === 'string' && emotions.some((emotion) => emotion === value);
}

export function isGesture(value: unknown): value is Gesture {
  return typeof value === 'string' && gestures.some((gesture) => gesture === value);
}
