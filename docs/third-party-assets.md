# Third-party asset provenance

Review/download dates: **2026-10-03–08**. Candidates A, C and D are actual researched, unchanged third-party Rive binaries. A reached its practical ceiling after the focused product review. The user rejected C's appearance and requested a softer character, preferably a robot. Candidate D, Friendly Floating Bot, is the next prototype under review. None has human visual approval. The original generated developer rig remains an architecture/testing asset.

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

Actual discovery found `Artboard` / `State Machine 1`, zero state-machine inputs, and `ViewModel1` / `Instance` with `wrong`, `correct`, `jump` triggers plus `loadingBoolean`, `typingBoolean` booleans. Seven authored animations: `Lading` (actual spelling), `Idle`, `Typing`, `Correct`, `Wrong`, `Jump`, `Reveal`. No mouth/speaking/talking clip or numeric energy control was exposed, so it does not meet this milestone's explicit mouth requirement. A was then integrated; the user subsequently rejected its quality and its focused refinement reached a practical ceiling. See the [actual Candidate B inspection JSON](ai-orb-mascot-inspection.json).

## Downloaded Candidate C — actual fallback evaluation

| Field | Record |
| --- | --- |
| Asset | Interactive Character Rig — Bones, Joysticks and Data Binding |
| Creator | aln.omrv |
| Source | [Official Rive Marketplace page](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) |
| Download | [Original runtime `.riv`](https://public.rive.app/community/runtime-files/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding.riv) |
| Local file | `assets/character/third-party/interactive-character.riv` |
| License | [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) |
| Verification | Official page license link resolved to the CC BY 4.0 deed on 2026-10-04 |
| Downloaded | 2026-10-04T18:14:18.4643141Z |
| Size | 12,722 bytes |
| SHA-256 | `82b2160f32b7226f60db9d812cc8d33162382cd80c80ac3088b530acf3d58335` |
| Modifications | No artwork/file-byte modifications; descriptive local filename only |
| Use in AMYU | Actual fallback inspection and visual comparison after Candidate A ceiling NO; no human acceptance or primary switch implied |

**Interactive Character Rig — Bones, Joysticks and Data Binding by aln.omrv, from Rive Marketplace. Licensed under CC BY 4.0. Artwork unmodified; evaluated as an AMYU development/prototype avatar candidate.**

Actual Rive 2.44.0 discovery found `Carrot main` / `State Machine 1`, zero state-machine inputs, twelve timelines, and `ViewModel1` / `Instance` with one trigger property, `triggerProperty`. No numeric/boolean or nested ViewModel properties are exported. Binding the trigger produces the actual native `idle → active → idle` transition. Source joystick descriptions are not proof of externally writable numeric controls. The original carrot appearance and native activation were observed in the browser; the user then explicitly rejected the model. Further beauty and selection work on C stopped. See [actual inspection](interactive-character-inspection.json), [drawing-command audit](interactive-character-animation-audit.json) and [capability/initialization caveats](interactive-character-capabilities.md).

## Downloaded Candidate D — Friendly Floating Bot

| Field | Record |
| --- | --- |
| Asset | Friendly Floating Bot |
| Creator | sukeycool |
| Source | [Official Rive Marketplace page](https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/) |
| Download | [Original runtime `.riv`](https://public.rive.app/community/runtime-files/28071-53022-friendly-floating-bot.riv) |
| Local file | `assets/character/third-party/friendly-floating-bot.riv` |
| License | [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) |
| Date downloaded | 2026-10-05 |
| Size | 139,255 bytes |
| SHA-256 | `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54` |
| Modifications | No artwork/file-byte modifications; descriptive local filename only |
| Presentation | Uniform crop x=50–320, y=145–386; retains sampled robot, shadow and active props, excluding the source demo-button row |
| Use in AMYU | Soft robot prototype following the user's rejection of C; six-state composition and visual review, without human acceptance implied |

**Friendly Floating Bot by sukeycool, from Rive Marketplace. Licensed under CC BY 4.0. Artwork unmodified; integrated as an AMYU development/prototype avatar.**

Actual inspection found the main artboard `tyepx ai bot`, `Theme_SM`, trigger ` Receive down`, number `Number 1`, booleans `eceive` and `istracking`, and the sole ViewModel theme property `ThemeVM.Instance.isDark`. Ten main-artboard timelines include five changing body clips. There is no exported numeric mouth, independent eyelid, head or gaze input. The original artwork includes a small talking trace and closed-eye frames; application composition does not turn these into independent facial controls. See [the capability audit](friendly-floating-bot-capabilities.md), [inspection JSON](friendly-floating-bot-inspection.json), [measured animation audit](friendly-floating-bot-animation-audit.json) and [current product review](avatar-deep-review.md).

## Community references

| Reference | Creator shown by source | License evidence | Usage |
| --- | --- | --- | --- |
| [AI Orb Mascot](https://rive.app/community/files/28088-53050-ai-orb-mascot/) | aln.omrv | CC BY 4.0 link verified in official source UI 2026-10-03 | Candidate B actually evaluated in scratch, not integrated; record above |
| [Interactive Character Rig — Bones, Joysticks and Data Binding](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) | aln.omrv | CC BY 4.0 link verified 2026-10-04 | Candidate C actually downloaded unchanged; fallback evaluation recorded above |
| [Expressive Floating Character Rig](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) | kouidero | CC BY 4.0 link verified 2026-10-03 | Candidate A; downloaded and inspected as recorded above |
| [Friendly Floating Bot](https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/) | sukeycool | Source identifies CC BY 4.0 | Candidate D; original downloaded file and runtime audit recorded above |
| [Character Head](https://rive.app/marketplace/26483-49646-character-head/) | samaravee | Page displays CC BY; verified 2026-10-03 | Pointer-reaction reference only |

Record actual file terms, license version, attribution and modifications before integrating another candidate. Marketplace text is not runtime introspection. Do not advertise gaze or mouth parameters that the inspected file does not expose.

## Viseme architecture source review

Source: [uianimation/rive-ai-avatar-viseme-kit](https://github.com/uianimation/rive-ai-avatar-viseme-kit), pinned review commit [`517f10497f97785b0f42bdd2eb33f0acd51f04d7`](https://github.com/uianimation/rive-ai-avatar-viseme-kit/tree/517f10497f97785b0f42bdd2eb33f0acd51f04d7).

The source was downloaded for read-only inspection on 2026-10-03 into workspace `work/reference-viseme`, outside the deliverable repository. Its [LICENSE at the reviewed commit](https://github.com/uianimation/rive-ai-avatar-viseme-kit/blob/517f10497f97785b0f42bdd2eb33f0acd51f04d7/LICENSE) is MIT, copyright 2026 Praneeth Kawya Thathsara. No code or binary asset was copied into AMYU and no package from this source was installed.

Useful patterns are an explicit input-name mapping and audio-clock-following scheduling (`currentTime()`), with stop returning to silence/idle. Missing inputs in the reference are skipped silently; AMYU instead requires diagnostics and explicit capability support. This is an architecture reference, not an adoption of all visemes, browser speech, provider examples or the reference's artwork. AMYU's current amplitude driver remains provider independent; future audio-adaptive visemes stay behind the lip-sync interface.

## Original developer artwork

Generated in-repository on 2026-10-03 by `scripts/build-character.mjs`. Artboard/state machine: `AMYU Developer`; format Rive 7.0. No third-party art, fonts, images or audio. It remains an architecture/testing asset; do not iterate on it or substitute it for the researched avatar in this corrective milestone. User redistribution licensing of original material remains separate from Candidate A's CC BY 4.0 license.
