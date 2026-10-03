/** Scoped cloud-account access contract only. No account connection or SDK is active. */
export interface ConnectorIdentity {
  id: string;
  accountId: string;
  service: string;
  scopes: readonly string[];
}

export interface Connector {
  readonly identity: ConnectorIdentity;
  isAvailable(): Promise<boolean>;
  disconnect(): Promise<void>;
}
