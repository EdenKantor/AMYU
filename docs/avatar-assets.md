# Avatar assets and replacement

Current milestone: **Avatar Correction / Replacement — not accepted**. The user rejected the generated developer character's visible conversation states and mouth quality. Preserve the architecture; onboarding is paused until the user approves the replacement avatar visually.

The temporary prototype mascot is not the AMYU production identity.

The first integration candidate is the actual downloaded [Expressive Floating Character Rig (Old Work Share)](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) by **kouidero**. The binary is `assets/character/third-party/expressive-floating.riv`, downloaded **2026-10-03**, 66,484 bytes, unmodified. The marketplace's CC BY link resolves to [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); attribution is preserved beside the binary and in [third-party provenance](third-party-assets.md).

This is a third-party development/prototype asset. AMYU does not claim ownership of its artwork. The earlier generated `amyu-developer.riv` remains for architecture/contract tests only and must no longer be the primary visual demo. Do not generate another placeholder or redesign that developer rig in this corrective milestone.

## Current and candidate assets

| Asset | Role | Current inclusion | Verification |
| --- | --- | --- | --- |
| [Expressive Floating Character Rig](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) — kouidero | Candidate A — first visual integration test | Actual binary downloaded and inspected | Two boolean inputs and 18 timelines; human visual acceptance pending |
| [AI Orb Mascot](https://rive.app/community/files/28088-53050-ai-orb-mascot/) — aln.omrv | Candidate B — evaluated second | Actual file downloaded to ignored scratch only; not imported | No state-machine inputs; ViewModel booleans/triggers and seven timelines; no mouth/talking clip or energy control found |
| [Interactive Character Rig — Bones, Joysticks and Data Binding](https://rive.app/marketplace/28370-53642-interactive-character-rig-bones-joysticks-and-data-binding/) — aln.omrv | Candidate C — technical reference/fallback | Not downloaded or imported | Page describes no state-machine inputs; uses ViewModel trigger and head/pupil joysticks |
| Original AMYU developer rig | Architecture and contract tests only | Retained | Earlier runtime tests remain useful; user rejected product quality |
| [Character Head](https://rive.app/marketplace/26483-49646-character-head/) — samaravee | Cursor-attention reference | Not downloaded or imported | Page describes cursor tracking and click smile |
| [Rive AI avatar viseme kit](https://github.com/uianimation/rive-ai-avatar-viseme-kit) | Code architecture reference for future mouth timing | Read-only source inspected outside the deliverable repository; nothing copied or installed | Commit and MIT license recorded in [third-party assets](third-party-assets.md) |

Candidate A and evaluated Candidate B have CC BY 4.0 links verified through their official source pages on 2026-10-03. Other marketplace pages display CC BY; their artifact terms/version must be recorded when downloaded. Marketplace prose does not prove binary input names or visual support.

## Actual Candidate A inspection

Rive 2.44.0 inspection found artboard `Artboard`, state machine `State Machine 1`, boolean inputs `isTalking` and `isListening`, 18 timelines and no ViewModels. Numeric and trigger inputs are not exposed. `Thinking`, `Talking`, mouth and blink timeline names establish available animation material, not human proof that the behaviors look convincing. No exposed gaze X/Y, head-follow or continuous mouth parameter was discovered. Overall visual support stays unknown until review. See the [capability report](expressive-floating-capabilities.md) and [inspection JSON](expressive-floating-inspection.json).

The adapter maps semantic intent to those inspected controls/timelines while keeping `AvatarController`, `EmbodimentDirector`, local life and the renderer boundary. Built-in Talking playback is an acceptable V0 path; numeric energy telemetry alone is not proof of visible speech.

## Prototype adapter workflow

Inspect an actual local `.riv` through the lab before claiming any capability. Record its artboards, state machines, numeric/boolean/trigger input names and types, and data-binding properties. A rig without named state-machine inputs needs a data-binding adapter rather than invented numeric input aliases. Unknown support is explicit; unsupported mouth, blink or gaze must remain visible in the capability panel.

Do not silently substitute the generated rig when a third-party import fails. Diagnostics must preserve the readable mismatch. If Candidate A's appearance is unsuitable, test B and then C. If the needed binary cannot be downloaded, report the exact source/button and placement path so the user can provide it.

## Human visual gate

Provide screenshots of the real downloaded avatar and a repeatable browser demo. `PLAY SPEAKING DEMO` runs a changing local synthetic speech-energy envelope for exactly 8 seconds. `STATE DEMO` runs for exactly 15 seconds: idle 2s, listening 3s, thinking 3s, speaking with dynamic talking movement 5s, then idle 2s. These are silent visual simulations with no audio playback or AI. See the [correction report](avatar-correction-report.md) for current observations and the review set.

Candidate A is selected for human review after actual Candidate B evaluation: B has no exposed mouth/talking timeline or energy control and was not integrated. A's native Listening animation affects only five mouth paths and gives no head/eye/body cue, confirmed without the open-eye overlay. AMYU composes a held `Waving` frame at 30% progress / 80% mix to raise a hand near the head/shoulder, alongside the native mouth cue. Root observed it visibly different from idle; human readability and approval remain pending. This composition is not a native attentive feature.

The user must judge whether it looks alive; whether listening, thinking and speaking are readable without labels; whether mouth movement is acceptable; whether supported gaze feels natural; and whether the asset looks good enough to continue. A “no” for listening, thinking, speaking or mouth keeps this milestone incomplete. Agent visual review and automated tests do not replace the user's approval.

Browser Avatar Lab is sufficient for this corrective selection. Native 4551 remains documented and is not addressed here. Onboarding does not begin until the user explicitly approves the avatar visually.

## Future production swap acceptance

1. Deliver the original production Rive file, provenance and rights record, artboard/state-machine identifiers, control manifest and adapter.
2. Validate the production `AMYU_Main` contract and every required name/type/range before marking it ready.
3. Inspect capability reporting: verified features are supported; omitted features are unsupported or unknown, never silently successful.
4. Test all semantic states, emotions at multiple intensities, gestures, sleep/wake, gaze extremes/dead zone, faster eyes than head, neutral return and attention breaks.
5. Confirm outgoing energy continuously drives mouth opening, without animation delaying audio. Visemes are optional and require their own reviewed driver/rig support.
6. Run lint, typecheck, pure logic/adapter tests and both frontend builds; compile and launch Windows/WebView2 on an authorized build machine.
7. Complete the human one-minute life check and 30-minute visual soak. Record asset version and results in manual acceptance.

An artwork swap changes the adapter and asset metadata; it must not require changes to provider, conversation, personality, memory, permissions or core semantic types.
