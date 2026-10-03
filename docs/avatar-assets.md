# Avatar assets and replacement

The temporary prototype mascot is not the AMYU production identity.

The current bundled character is `assets/character/amyu-developer.riv`, an original temporary vector rig generated in this repository on **2026-10-03** by `scripts/build-character.mjs`. It has no imported community artwork, external fonts or images. Its reproducible manifest lives beside the binary. The user has not selected a general repository redistribution license; do not invent one for either the code or artwork.

## Current and candidate assets

| Asset | Role | Current inclusion | Verification |
| --- | --- | --- | --- |
| Original AMYU developer rig | Local functional fallback and contract testing | Bundled | Rive runtime decode/control tests; browser visual review |
| [AI Orb Mascot](https://rive.app/community/files/28088-53050-ai-orb-mascot/) — aln.omrv | Preferred community prototype reference/candidate | Not downloaded or imported | Marketplace page reviewed 2026-10-03; actual binary inputs unknown |
| [Interactive Character Rig — Bones, Joysticks and Data Binding](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) — aln.omrv | Rigging/data-binding reference | Not downloaded or imported | Page describes no state-machine inputs; uses ViewModel trigger and head/pupil joysticks |
| [Expressive Floating Character Rig](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) — kouidero | Floating/expressive-motion reference | Not downloaded or imported | Page describes talking, listening and floating blink |
| [Character Head](https://rive.app/marketplace/26483-49646-character-head/) — samaravee | Cursor-attention reference | Not downloaded or imported | Page describes cursor tracking and click smile |
| [Rive AI avatar viseme kit](https://github.com/uianimation/rive-ai-avatar-viseme-kit) | Code architecture reference for future mouth timing | Read-only source inspected outside the deliverable repository; nothing copied or installed | Commit and MIT license recorded in [third-party assets](third-party-assets.md) |

The marketplace pages display CC BY, verified on 2026-10-03. That page evidence does not establish an uninspected binary's input names, actual gaze/mouth support or a completed attribution/license workflow. Review the downloadable artifact and applicable license version before bundling any candidate.

## Prototype adapter workflow

Inspect an actual local `.riv` through the lab before claiming any capability. Record its artboards, state machines, numeric/boolean/trigger input names and types, and data-binding properties. A rig without named state-machine inputs needs a data-binding adapter rather than invented numeric input aliases. Unknown support is explicit; unsupported mouth, blink or gaze must remain visible in the capability panel.

The current original rig can keep the lab functional while a candidate is unavailable. Do not replace a failed import with artwork that conceals the failure. Diagnostics must preserve a readable mismatch and provide a recoverable path back to the reviewed developer rig.

## Production swap acceptance

1. Deliver the original production Rive file, provenance and rights record, artboard/state-machine identifiers, control manifest and adapter.
2. Validate the production `AMYU_Main` contract and every required name/type/range before marking it ready.
3. Inspect capability reporting: verified features are supported; omitted features are unsupported or unknown, never silently successful.
4. Test all semantic states, emotions at multiple intensities, gestures, sleep/wake, gaze extremes/dead zone, faster eyes than head, neutral return and attention breaks.
5. Confirm outgoing energy continuously drives mouth opening, without animation delaying audio. Visemes are optional and require their own reviewed driver/rig support.
6. Run lint, typecheck, pure logic/adapter tests and both frontend builds; compile and launch Windows/WebView2 on an authorized build machine.
7. Complete the human one-minute life check and 30-minute visual soak. Record asset version and results in manual acceptance.

An artwork swap changes the adapter and asset metadata; it must not require changes to provider, conversation, personality, memory, permissions or core semantic types.
