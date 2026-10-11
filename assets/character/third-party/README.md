# Third-party prototype Rive assets

`expressive-floating.riv` is the actual downloaded **Expressive Floating Character Rig (Old Work Share)** by **kouidero**.

- [Marketplace source](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/)
- [Exact downloaded runtime file](https://public.rive.app/community/runtime-files/25311-47232-expressive-floating-character-rig-old-work-share.riv)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)
- Downloaded 2026-10-03; 66,484 bytes.
- SHA-256: `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`.
- No artwork/file-byte modifications. The descriptive local filename differs from the source URL filename.

The temporary prototype mascot is not the AMYU production identity.

The binary is Candidate A for visual conversation-state and speaking evaluation. Its focused product review reached a practical ceiling: listening/speech remain weak and facial expression/attention are limited. Preserve [the attribution/license notice](LICENSE.md) with it. AMYU does not claim ownership of kouidero's artwork.

Actual Rive 2.44.0 inspection found artboard `Artboard`, state machine `State Machine 1`, booleans `isTalking` and `isListening`, 18 timelines and no ViewModels. No numeric/trigger controls were exposed. See [the capability report](../../../docs/expressive-floating-capabilities.md) and [inspection JSON](../../../docs/expressive-floating-inspection.json). Timeline names alone do not prove acceptable visual behavior.

## Candidate C — Interactive Character Rig

`interactive-character.riv` is the actual **Interactive Character Rig — Bones, Joysticks and Data Binding** by **aln.omrv**.

- [Official Marketplace source](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/)
- [Exact downloaded runtime file](https://public.rive.app/community/runtime-files/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding.riv)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/), verified through the official page 2026-10-04.
- Downloaded 2026-10-04T18:14:18.4643141Z; 12,722 bytes.
- SHA-256: `82b2160f32b7226f60db9d812cc8d33162382cd80c80ac3088b530acf3d58335`.
- No artwork/file-byte modifications; descriptive local filename only.

Actual Rive 2.44.0 inspection found `Carrot main`, `State Machine 1`, zero state-machine inputs, twelve timelines and one ViewModel trigger, `ViewModel1.Instance.triggerProperty`. No numeric/boolean/nested ViewModel control is exported. The trigger's native `idle → active → idle` effect is measured. Joystick-named timelines alone do not establish controllable head, pupil, mouth or eyelid behavior. See [actual C capabilities](../../../docs/interactive-character-capabilities.md) and [inspection JSON](../../../docs/interactive-character-inspection.json).

C was evaluated following A's ceiling decision, then explicitly rejected by the user for its appearance. It is retained as comparison evidence, not an approved replacement. AMYU does not claim ownership of aln.omrv's artwork.

## Candidate D — Friendly Floating Bot

`friendly-floating-bot.riv` is the original **Friendly Floating Bot** by **sukeycool**, selected for the next review following the user's preference for a soft robot.

- [Official Marketplace source](https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/)
- [Exact downloaded runtime file](https://public.rive.app/community/runtime-files/28071-53022-friendly-floating-bot.riv)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)
- Downloaded 2026-10-05; 139,255 bytes.
- SHA-256: `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`.
- No artwork/file-byte modifications; descriptive local filename only.
- AMYU frames the original artboard within x=50–320, y=145–386 to show the robot, shadow and sampled active props while excluding the author's demo-button row. This is a uniform presentation crop, not an artwork edit.

Actual inspection finds the main artboard `tyepx ai bot`, state machine `Theme_SM`, four native controls and the theme ViewModel `ThemeVM.Instance.isDark`. The five changing body timelines are `Idle`, ` Receive`, `Receive loop`, `talking loop` and `welcome loop`. There is no exported numeric mouth, eyelid, head or gaze input. Conversation states are application compositions of verified authored material; their labels are not native capabilities. See [the actual capability audit](../../../docs/friendly-floating-bot-capabilities.md), [inspection JSON](../../../docs/friendly-floating-bot-inspection.json) and [measured animation audit](../../../docs/friendly-floating-bot-animation-audit.json).

AMYU does not claim ownership of sukeycool's artwork or imply creator endorsement. Preserve [the attribution/license notice](LICENSE.md) with all distributed binaries. Candidate D has not received human visual approval.

Onboarding is paused until the user approves the avatar visually. Keep the binaries unchanged during adapter work; any later artwork modification must update the modification record and attribution.
