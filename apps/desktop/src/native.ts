import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

/** One metadata-only IPC contract. No executable desktop capability is exposed. */
export const nativeDiagnosticsSchema = z.object({
  product: z.literal('AMYU'),
  milestone: z.literal('avatar-lab'),
  platform: z.enum(['windows', 'macos', 'linux']),
  executableCapabilitiesEnabled: z.literal(false),
}).strict();

export type NativeDiagnostics = z.infer<typeof nativeDiagnosticsSchema>;

export async function readNativeDiagnostics(): Promise<NativeDiagnostics> {
  const response: unknown = await invoke('native_diagnostics');
  return nativeDiagnosticsSchema.parse(response);
}
