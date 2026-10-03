import type { SceneObservation } from '@amyu/protocol';

export type { SceneObservation } from '@amyu/protocol';

/** Explicit capture contract only. Native capture and inspection are not implemented. */
export type CaptureSource = 'screen' | 'window' | 'camera';
export type CapturePermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface CaptureRequest {
  source: CaptureSource;
  intent: string;
  sourceId?: string;
}

export interface VisualFrame {
  id: string;
  source: CaptureSource;
  capturedAt: number;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  /** Ephemeral bytes; adapters must not persist frames by default. */
  bytes: Uint8Array;
}

export interface VisualContextProvider {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  requestPermission(): Promise<CapturePermissionState>;
  capture(request: CaptureRequest): Promise<VisualFrame>;
}

export interface VisionIntent {
  question: string;
  language: 'he' | 'en';
}

export interface VisionProvider {
  inspect(frame: VisualFrame, intent?: VisionIntent): Promise<SceneObservation>;
}
