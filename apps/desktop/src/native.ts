import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

/** Metadata only. Pet window controls do not grant arbitrary execution. */
export const nativeDiagnosticsSchema = z.object({
  product: z.literal('AMYU'),
  milestone: z.literal('pet-shell'),
  platform: z.enum(['windows', 'macos', 'linux']),
  executableCapabilitiesEnabled: z.literal(false),
}).strict();

export type NativeDiagnostics = z.infer<typeof nativeDiagnosticsSchema>;

export async function readNativeDiagnostics(): Promise<NativeDiagnostics> {
  const response: unknown = await invoke('native_diagnostics');
  return nativeDiagnosticsSchema.parse(response);
}
