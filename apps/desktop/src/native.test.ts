import { describe, expect, it } from 'vitest';
import { nativeDiagnosticsSchema } from './native';

describe('native diagnostics trust boundary', () => {
  it('accepts the restricted camelCase Rust metadata contract', () => {
    expect(nativeDiagnosticsSchema.parse({
      product: 'AMYU',
      milestone: 'avatar-lab',
      platform: 'windows',
      executableCapabilitiesEnabled: false,
    })).toEqual({
      product: 'AMYU',
      milestone: 'avatar-lab',
      platform: 'windows',
      executableCapabilitiesEnabled: false,
    });
  });

  it('rejects unexpected capabilities and unknown payload fields', () => {
    const metadata = {
      product: 'AMYU',
      milestone: 'avatar-lab',
      platform: 'windows',
      executableCapabilitiesEnabled: false,
    };
    expect(nativeDiagnosticsSchema.safeParse({ ...metadata, executableCapabilitiesEnabled: true }).success).toBe(false);
    expect(nativeDiagnosticsSchema.safeParse({ ...metadata, secret: 'unexpected' }).success).toBe(false);
    expect(nativeDiagnosticsSchema.safeParse({ ...metadata, platform: 'unknown' }).success).toBe(false);
  });
});
