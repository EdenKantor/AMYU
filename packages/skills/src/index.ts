/** Manifest contract only. No registry, downloaded code or skill execution yet. */
export type SkillPermissionMode = 'allow' | 'confirm' | 'deny';

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  tools: readonly string[];
  capabilities: readonly string[];
  /** A future policy adapter normalizes manifest 'confirm' to engine 'ask'. */
  permissions: Readonly<Record<string, SkillPermissionMode>>;
  memory: {
    read: readonly string[];
    write: readonly string[];
  };
  embodiment: {
    energy: number;
    style: string;
  };
}

export interface SkillRegistry {
  list(): Promise<ReadonlyArray<SkillManifest>>;
  load(name: string, version: string): Promise<{ manifest: SkillManifest; playbook: string }>;
}
