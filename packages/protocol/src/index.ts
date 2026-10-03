import { z } from 'zod';
import { conversationStates, emotions, gestures, presenceStates, supportStatuses, type Gesture } from '@amyu/avatar-contract';

const unit = z.number().finite().min(0).max(1);
const timestamp = z.number().finite().nonnegative();
const identifier = z.string().min(1).max(256);
const boundedText = z.string().max(16_384);

export const gazeTargetSchema = z.strictObject({
  x: z.number().finite().min(-1).max(1),
  y: z.number().finite().min(-1).max(1),
});

export const affectCueSchema = z.strictObject({
  emotion: z.enum(emotions), intensity: unit, confidence: unit,
  source: z.enum(['conversation', 'assistant', 'local', 'task']),
});

const supportStatusSchema = z.enum(supportStatuses);
const gestureCapabilityShape: Record<Gesture, typeof supportStatusSchema> = {
  wave: supportStatusSchema, nod: supportStatusSchema, shake_head: supportStatusSchema,
  head_tilt: supportStatusSchema, bounce: supportStatusSchema, celebrate: supportStatusSchema, shrug: supportStatusSchema,
};
export const avatarCapabilitiesSchema = z.strictObject({
  gaze: supportStatusSchema, blink: supportStatusSchema, continuousMouth: supportStatusSchema,
  emotionBlend: supportStatusSchema, headControl: supportStatusSchema, visemes: supportStatusSchema,
  gestures: z.strictObject(gestureCapabilityShape),
});

/** Future, explicitly requested visual observation; never raw screenshot content. */
export const sceneObservationSchema = z.strictObject({
  id: identifier,
  source: z.enum(['screen', 'window', 'camera']),
  summary: boundedText,
  capturedAt: timestamp,
});

/** A proposal to remember something; storage and approval belong to future packages. */
export const memoryCandidateSchema = z.strictObject({
  kind: z.enum(['fact', 'preference', 'project', 'relationship']),
  value: boundedText,
  confidence: unit,
  source: z.enum(['explicit', 'conversation']),
});

/** Validated request only. Permission resolution and execution are separate boundaries. */
export const toolRequestSchema = z.strictObject({
  callId: identifier,
  tool: identifier,
  capabilityId: identifier,
  args: z.json(),
  intent: z.string().min(1).max(16_384),
  consequence: z.enum(['read', 'write', 'destructive']),
  connectorId: identifier.optional(),
  timestamp,
});

export const toolResultSchema = z.discriminatedUnion('status', [
  z.strictObject({ callId: identifier, timestamp, status: z.literal('completed'), result: z.json() }),
  z.strictObject({ callId: identifier, timestamp, status: z.literal('denied'), reason: boundedText }),
  z.strictObject({ callId: identifier, timestamp, status: z.literal('cancelled'), reason: boundedText }),
  z.strictObject({ callId: identifier, timestamp, status: z.literal('failed'), code: identifier, message: boundedText }),
]);

function event<T extends string, S extends z.ZodRawShape>(type: T, fields: S) {
  return z.strictObject({ type: z.literal(type), timestamp, ...fields });
}

export const companionEventSchema = z.discriminatedUnion('type', [
  event('user.speech.started', {}),
  event('user.speech.ended', {}),
  event('assistant.thinking.started', {}),
  event('assistant.speech.started', {}),
  event('assistant.speech.ended', {}),
  event('assistant.language.changed', { language: z.enum(['he', 'en']) }),
  event('transcript.user', { text: boundedText, language: z.enum(['he', 'en']) }),
  event('transcript.assistant', { text: boundedText, language: z.enum(['he', 'en']) }),
  event('conversation.state.changed', { state: z.enum(conversationStates) }),
  event('embodiment.affect', {
    emotion: z.enum(emotions), intensity: unit, confidence: unit.optional(),
    source: z.enum(['conversation', 'assistant', 'local', 'task']).optional(),
  }),
  event('embodiment.gesture', { gesture: z.enum(gestures), intensity: unit.optional() }),
  event('embodiment.gaze', { target: gazeTargetSchema, weight: unit.optional() }),
  event('embodiment.speech_energy', { value: unit }),
  event('embodiment.presence', { state: z.enum(presenceStates) }),
  event('embodiment.awake', { awake: z.boolean() }),
  event('vision.capture.requested', { source: z.enum(['screen', 'window', 'camera']) }),
  event('vision.observation.ready', { observation: sceneObservationSchema }),
  event('tool.requested', { callId: identifier, tool: identifier, args: z.json() }),
  event('tool.approval_required', { callId: identifier }),
  event('tool.completed', { callId: identifier, result: z.json() }),
  event('memory.candidate', { candidate: memoryCandidateSchema }),
  event('provider.error', { code: identifier, message: boundedText, recoverable: z.boolean() }),
]);

export type SceneObservation = z.infer<typeof sceneObservationSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type ToolRequest = z.infer<typeof toolRequestSchema>;
export type ToolResult = z.infer<typeof toolResultSchema>;
export type CompanionEvent = z.infer<typeof companionEventSchema>;
export type CompanionEventType = CompanionEvent['type'];
export type EventOf<T extends CompanionEventType> = Extract<CompanionEvent, { type: T }>;

export function parseCompanionEvent(input: unknown): CompanionEvent { return companionEventSchema.parse(input); }

type Listener = (event: CompanionEvent) => void;
export interface EventBusOptions {
  /** Called per failed listener, after other subscribers have received the event. */
  onError?: (error: unknown, event: CompanionEvent) => void;
}

/** Synchronous delivery preserves event order and avoids hidden timers or provider SDK types. */
export class CompanionEventBus {
  private readonly listeners = new Map<CompanionEventType | '*', Set<Listener>>();
  private readonly onError: EventBusOptions['onError'];

  constructor(options: EventBusOptions = {}) { this.onError = options.onError; }

  on<T extends CompanionEventType>(type: T, handler: (event: EventOf<T>) => void): () => void;
  on(type: '*', handler: Listener): () => void;
  on(type: CompanionEventType | '*', handler: Listener): () => void {
    let bucket = this.listeners.get(type);
    if (!bucket) { bucket = new Set(); this.listeners.set(type, bucket); }
    bucket.add(handler);
    return () => { bucket.delete(handler); if (bucket.size === 0) this.listeners.delete(type); };
  }

  emit(input: CompanionEvent): void { this.emitUnknown(input); }

  /** Use for IPC, provider adapters and other runtime trust boundaries. */
  emitUnknown(input: unknown): void {
    const event = parseCompanionEvent(input);
    const errors: unknown[] = [];
    const subscribers = [
      ...(this.listeners.get(event.type) ?? []),
      ...(this.listeners.get('*') ?? []),
    ];
    for (const handler of subscribers) {
      try { handler(event); } catch (error) { errors.push(error); }
    }
    if (this.onError) for (const error of errors) this.onError(error, event);
    else if (errors.length) throw new AggregateError(errors, `Listeners failed for ${event.type}`);
  }

  clear(): void { this.listeners.clear(); }
}

export { CompanionEventBus as EventBus };
