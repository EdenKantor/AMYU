# Third-party asset provenance

Review date: **2026-10-03**. No community `.riv` asset is bundled, downloaded or imported into this repository. The sole bundled character is the original generated developer rig, with its generator and manifest preserved under `scripts` and `assets/character`.

The temporary prototype mascot is not the AMYU production identity.

## Community references

| Reference | Creator shown by source | License evidence | Usage |
| --- | --- | --- | --- |
| [AI Orb Mascot](https://rive.app/community/files/28088-53050-ai-orb-mascot/) | aln.omrv | Page displays CC BY; verified 2026-10-03 | Preferred prototype reference only; no asset downloaded |
| [Interactive Character Rig — Bones, Joysticks and Data Binding](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) | aln.omrv | Page displays CC BY; verified 2026-10-03 | Rigging/data-binding reference only |
| [Expressive Floating Character Rig](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) | kouidero | Page displays CC BY; verified 2026-10-03 | Motion reference only |
| [Character Head](https://rive.app/marketplace/26483-49646-character-head/) | samaravee | Page displays CC BY; verified 2026-10-03 | Pointer-reaction reference only |

The exact CC BY version/deed and attribution requirements must be recorded before future redistribution. Marketplace text is not runtime introspection. Do not advertise gaze or mouth parameters until the actual file is inspected. Do not treat “reported CC BY” as permission for a different file or derivative whose terms were not reviewed.

## Viseme architecture source review

Source: [uianimation/rive-ai-avatar-viseme-kit](https://github.com/uianimation/rive-ai-avatar-viseme-kit), pinned review commit [`517f10497f97785b0f42bdd2eb33f0acd51f04d7`](https://github.com/uianimation/rive-ai-avatar-viseme-kit/tree/517f10497f97785b0f42bdd2eb33f0acd51f04d7).

The source was downloaded for read-only inspection on 2026-10-03 into workspace `work/reference-viseme`, outside the deliverable repository. Its [LICENSE at the reviewed commit](https://github.com/uianimation/rive-ai-avatar-viseme-kit/blob/517f10497f97785b0f42bdd2eb33f0acd51f04d7/LICENSE) is MIT, copyright 2026 Praneeth Kawya Thathsara. No code or binary asset was copied into AMYU and no package from this source was installed.

Useful patterns are an explicit input-name mapping and audio-clock-following scheduling (`currentTime()`), with stop returning to silence/idle. Missing inputs in the reference are skipped silently; AMYU instead requires diagnostics and explicit capability support. This is an architecture reference, not an adoption of all visemes, browser speech, provider examples or the reference's artwork. AMYU's current amplitude driver remains provider independent; future audio-adaptive visemes stay behind the lip-sync interface.

## Original developer artwork

Generated in-repository on 2026-10-03 by `scripts/build-character.mjs`. Artboard/state machine: `AMYU Developer`; format Rive 7.0. No third-party art, fonts, images or audio. User redistribution licensing remains a separate decision. Preserve this provenance when replacing or distributing the file.
