/** Policy boundary only. An absent engine grants no executable operation. */
export type PermissionMode = 'allow' | 'ask' | 'deny';

export interface PermissionRequest {
  capabilityId: string;
  intent: string;
  consequence: 'read' | 'write' | 'destructive';
  connectorId?: string;
}

export interface PermissionDecision {
  mode: PermissionMode;
  reason: string;
  permissionId: string;
}

export interface PermissionEngine {
  evaluate(request: PermissionRequest): Promise<PermissionDecision>;
}
