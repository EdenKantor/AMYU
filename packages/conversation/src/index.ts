/** Reserved provider contract. No live session or mock provider is implemented. */
export interface LiveSessionConfig {
  preferredLanguage: 'he' | 'en';
  companionName: string;
  userDisplayName: string;
  voiceId?: string;
}

export interface LiveAudioChunk {
  format: 'pcm_s16le';
  sampleRate: number;
  channels: 1;
  bytes: Uint8Array;
}

export type LiveVoiceEvent =
  | { type: 'user.speech.started'; timestamp: number }
  | { type: 'user.speech.ended'; timestamp: number }
  | { type: 'assistant.thinking.started'; timestamp: number }
  | { type: 'assistant.speech.started'; timestamp: number }
  | { type: 'assistant.speech.audio'; timestamp: number; chunk: LiveAudioChunk }
  | { type: 'assistant.speech.ended'; timestamp: number }
  | { type: 'assistant.language.changed'; timestamp: number; language: 'he' | 'en' }
  | { type: 'transcript.user'; timestamp: number; text: string; isFinal: boolean }
  | { type: 'transcript.assistant'; timestamp: number; text: string; isFinal: boolean }
  | { type: 'tool.requested'; timestamp: number; callId: string; tool: string; args: unknown }
  | { type: 'provider.error'; timestamp: number; code: string; message: string; recoverable: boolean };

export interface LiveVoiceProvider {
  connect(config: LiveSessionConfig): Promise<void>;
  disconnect(): Promise<void>;
  sendAudio(chunk: LiveAudioChunk): void;
  interrupt(): void;
  on<T extends LiveVoiceEvent['type']>(
    type: T,
    handler: (event: Extract<LiveVoiceEvent, { type: T }>) => void,
  ): () => void;
}
