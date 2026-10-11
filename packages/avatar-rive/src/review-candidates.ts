import expressiveFloatingUrl from '../../../assets/character/third-party/expressive-floating.riv?url';
import { expressiveFloatingRig } from './expressive-floating';
import interactiveCharacterUrl from '../../../assets/character/third-party/interactive-character.riv?url';
import { interactiveCharacterRig } from './interactive-character';
import friendlyFloatingBotUrl from '../../../assets/character/third-party/friendly-floating-bot.riv?url';
import { friendlyFloatingBotRig } from './friendly-floating-bot';
import type { RiveRigAdapter } from './rig';

/** Local development comparison only; selecting a candidate does not approve it. */
export interface RiveReviewCandidate {
  id: string;
  label: string;
  assetUrl: string;
  adapter: RiveRigAdapter;
  note: string;
}

export const reviewCandidates: readonly RiveReviewCandidate[] = [
  {
    id: 'candidate-d', label: 'Robot review · Friendly Floating Bot',
    assetUrl: friendlyFloatingBotUrl, adapter: friendlyFloatingBotRig,
    note: 'Active robot review. Six states composed from original authored timelines; visual approval remains open.',
  },
  {
    id: 'candidate-a', label: 'Reference A · Expressive Floating',
    assetUrl: expressiveFloatingUrl, adapter: expressiveFloatingRig,
    note: 'Focused browser review rejected its practical ceiling; retained for comparison.',
  },
  {
    id: 'candidate-c', label: 'Rejected C · Interactive Character Rig',
    assetUrl: interactiveCharacterUrl, adapter: interactiveCharacterRig,
    note: 'Original carrot character evaluated and rejected by the user. Retained only as review history.',
  },
];
