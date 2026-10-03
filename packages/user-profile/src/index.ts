/** Explicit profile types only. Persistence and onboarding are later milestones. */
export type PreferredLanguage = 'he' | 'en';

export interface UserProfile {
  id: string;
  displayName: string;
  preferredTitle?: string;
  preferredLanguage: PreferredLanguage;
  occupation?: string;
  interests?: string[];
  background?: string;
  communicationPreferences?: {
    verbosity?: 'short' | 'balanced' | 'detailed';
    humor?: 'low' | 'medium' | 'high';
    formality?: 'casual' | 'balanced' | 'formal';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompanionProfile {
  /** User-selected identity. Never assumed to equal the product name. */
  name: string;
  personalityProfile: string;
  voiceId?: string;
  characterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRepository {
  load(): Promise<{ user: UserProfile; companion: CompanionProfile } | null>;
  save(profiles: { user: UserProfile; companion: CompanionProfile }): Promise<void>;
  reset(): Promise<void>;
}
