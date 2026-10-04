# Third-party asset provenance

Review/download date: **2026-10-03**. Candidate A is now an actual researched third-party Rive binary. The original generated developer rig remains an architecture/testing asset and must not remain the primary visual demo.

The temporary prototype mascot is not the AMYU production identity.

## Downloaded Candidate A

| Field | Record |
| --- | --- |
| Asset | Expressive Floating Character Rig (Old Work Share) |
| Creator | kouidero |
| Source | [Rive Marketplace page](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) |
| Download | [Original runtime `.riv`](https://public.rive.app/community/runtime-files/25311-47232-expressive-floating-character-rig-old-work-share.riv) |
| Local file | `assets/character/third-party/expressive-floating.riv` |
| License | [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) |
| Verification | Marketplace CC BY link resolved to the CC BY 4.0 deed on 2026-10-03 |
| Date downloaded | 2026-10-03 |
| Size | 66,484 bytes |
| SHA-256 | `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62` |
| Modifications | No artwork/file-byte modifications; stored under a descriptive local filename |
| Use in AMYU | Development/prototype avatar candidate for conversation-state and visible speech evaluation |

Retain creator credit, source/license links and the modification record with redistributed copies. Credit must not imply creator endorsement. Full terms are available in the [CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode). The following notice is included beside the binary:

**Expressive Floating Character Rig (Old Work Share) by kouidero, from Rive Marketplace. Licensed under CC BY 4.0. Artwork unmodified; integrated as an AMYU development/prototype avatar.**

See [the attribution/license notice](../assets/character/third-party/LICENSE.md), [asset README](../assets/character/third-party/README.md) and [actual capability report](expressive-floating-capabilities.md). AMYU does not claim ownership of the third-party artwork.

## Evaluated Candidate B — scratch only

**AI Orb Mascot** by **aln.omrv** was evaluated second using its actual file, downloaded on **2026-10-03** from [the official runtime URL](https://public.rive.app/community/runtime-files/28088-53050-ai-orb-mascot.riv). The [official source page](https://rive.app/community/files/28088-53050-ai-orb-mascot/) links to [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), verified in the source UI on the same date.

Local path: ignored `work/ai-orb-mascot.riv`. Size: **15,008 bytes**. SHA-256: `eccafb28f0f7f1f5a1d332e5336f71ed4d8069df55049e64cf675247e7fadc5b`. No artwork/file modifications. The binary is scratch evaluation material; it was not integrated or bundled. Preserve the same creator/source/license/modification attribution if redistributed later.

Actual discovery found `Artboard` / `State Machine 1`, zero state-machine inputs, and `ViewModel1` / `Instance` with `wrong`, `correct`, `jump` triggers plus `loadingBoolean`, `typingBoolean` booleans. Seven authored animations: `Lading` (actual spelling), `Idle`, `Typing`, `Correct`, `Wrong`, `Jump`, `Reveal`. No mouth/speaking/talking clip or numeric energy control was exposed, so it does not meet this milestone's explicit mouth requirement. Candidate A is selected for human review. See the [actual Candidate B inspection JSON](ai-orb-mascot-inspection.json).

## Community references

| Reference | Creator shown by source | License evidence | Usage |
| --- | --- | --- | --- |
| [AI Orb Mascot](https://rive.app/community/files/28088-53050-ai-orb-mascot/) | aln.omrv | CC BY 4.0 link verified in official source UI 2026-10-03 | Candidate B actually evaluated in scratch, not integrated; record above |
| [Interactive Character Rig — Bones, Joysticks and Data Binding](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) | aln.omrv | Page displays CC BY; verified 2026-10-03 | Rigging/data-binding reference only |
| [Expressive Floating Character Rig](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) | kouidero | CC BY 4.0 link verified 2026-10-03 | Candidate A; downloaded and inspected as recorded above |
| [Character Head](https://rive.app/marketplace/26483-49646-character-head/) | samaravee | Page displays CC BY; verified 2026-10-03 | Pointer-reaction reference only |

Record actual file terms, license version, attribution and modifications before integrating another candidate. Marketplace text is not runtime introspection. Do not advertise gaze or mouth parameters that the inspected file does not expose.

## Viseme architecture source review

Source: [uianimation/rive-ai-avatar-viseme-kit](https://github.com/uianimation/rive-ai-avatar-viseme-kit), pinned review commit [`517f10497f97785b0f42bdd2eb33f0acd51f04d7`](https://github.com/uianimation/rive-ai-avatar-viseme-kit/tree/517f10497f97785b0f42bdd2eb33f0acd51f04d7).

The source was downloaded for read-only inspection on 2026-10-03 into workspace `work/reference-viseme`, outside the deliverable repository. Its [LICENSE at the reviewed commit](https://github.com/uianimation/rive-ai-avatar-viseme-kit/blob/517f10497f97785b0f42bdd2eb33f0acd51f04d7/LICENSE) is MIT, copyright 2026 Praneeth Kawya Thathsara. No code or binary asset was copied into AMYU and no package from this source was installed.

Useful patterns are an explicit input-name mapping and audio-clock-following scheduling (`currentTime()`), with stop returning to silence/idle. Missing inputs in the reference are skipped silently; AMYU instead requires diagnostics and explicit capability support. This is an architecture reference, not an adoption of all visemes, browser speech, provider examples or the reference's artwork. AMYU's current amplitude driver remains provider independent; future audio-adaptive visemes stay behind the lip-sync interface.

## Original developer artwork

Generated in-repository on 2026-10-03 by `scripts/build-character.mjs`. Artboard/state machine: `AMYU Developer`; format Rive 7.0. No third-party art, fonts, images or audio. It remains an architecture/testing asset; do not iterate on it or substitute it for the researched avatar in this corrective milestone. User redistribution licensing of original material remains separate from Candidate A's CC BY 4.0 license.
