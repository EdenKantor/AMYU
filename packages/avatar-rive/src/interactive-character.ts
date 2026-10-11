import { createAvatarCapabilities } from '@amyu/avatar-contract';
import type { RiveRigAdapter } from './rig';

/** Unmodified Candidate C; a review adapter, not an approved replacement. */
export const interactiveCharacterRig: RiveRigAdapter = {
  id: 'interactive-character-review', artboard: 'Carrot main', stateMachine: 'State Machine 1',
  stateMachinePlayback: 'native', inputs: [],
  nativePointerEvents: true,
  viewModel: { name: 'ViewModel1', instance: 'Instance', clickTriggers: ['triggerProperty'] },
  attribution: {
    title: 'Interactive Character Rig — Bones, Joysticks & Data Binding', creator: 'aln.omrv',
    sourceUrl: 'https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/',
    license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  // The actual file has no SM inputs and one VM trigger. It does contain
  // authored head/pupil/lid timelines; their visual ranges require review.
  capabilities: createAvatarCapabilities({ continuousMouth: 'unsupported', visemes: 'unsupported' }),
  reviewSupport: {
    states: {
      idle: { status: 'partial', note: 'Actual native idle playback; appearance pending browser review.' },
      listening: { status: 'unsupported', note: 'No listening composition has been verified.' },
      thinking: { status: 'unsupported', note: 'No thinking composition has been verified.' },
      speaking: { status: 'unsupported', note: 'No speech mouth control has been verified.' },
      acting: { status: 'unsupported', note: 'No purposeful acting composition has been verified.' },
      sleeping: { status: 'unsupported', note: 'Eye timeline endpoints await review; no sleeping state claimed.' },
    },
    emotions: {},
  },
  previewBaseline: [],
  // Sole verified VM trigger plays the author's native active reaction. Named
  // head/pupil/lid clips are available for solo review, not semantic claims.
  animations: [],
  mapFrame: () => ({}),
};
