import type { PermissionRequest } from '@amyu/permissions';

/** Reserved gateway. No OS operation, shell or default-allow executor exists. */
export interface DeviceCapability {
  id: string;
  deviceId: string;
  description: string;
  available: boolean;
  permissionId: string;
}

export interface CapabilityInvocation {
  callId: string;
  capabilityId: string;
  arguments: unknown;
  permission: PermissionRequest;
}

export type CapabilityResult =
  | { callId: string; status: 'completed'; result: unknown }
  | { callId: string; status: 'denied' | 'cancelled'; reason: string }
  | { callId: string; status: 'failed'; code: string; message: string };

export interface CapabilityGateway {
  list(): Promise<ReadonlyArray<DeviceCapability>>;
  invoke(request: CapabilityInvocation): Promise<CapabilityResult>;
}
