/** Repository boundary only. No memory storage or automatic learning is implemented. */
export type MemoryType =
  | 'working'
  | 'profile'
  | 'preference'
  | 'episodic'
  | 'relationship'
  | 'project'
  | 'procedural';

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  content: string;
  confidence: number;
  importance: number;
  sensitivity: 'normal' | 'personal' | 'sensitive';
  source: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface MemoryQuery {
  type?: MemoryType;
  text?: string;
  limit: number;
}

export interface MemoryRepository {
  remember(record: MemoryRecord): Promise<void>;
  recall(query: MemoryQuery): Promise<MemoryRecord[]>;
  inspect(id: string): Promise<MemoryRecord | null>;
  correct(id: string, content: string): Promise<void>;
  update(record: MemoryRecord): Promise<void>;
  forget(id: string): Promise<void>;
}
