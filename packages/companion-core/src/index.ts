import type { CompanionEvent } from '@amyu/protocol';
import type { CompanionProfile, UserProfile } from '@amyu/user-profile';

/** Reserved orchestration boundary. There is no active Companion Core yet. */
export interface CompanionCoreSnapshot {
  user: UserProfile;
  companion: CompanionProfile;
  currentLanguage: 'he' | 'en';
}

export interface CompanionCore {
  snapshot(): CompanionCoreSnapshot;
  accept(event: CompanionEvent): void;
  configure(profiles: { user: UserProfile; companion: CompanionProfile }): void;
}
