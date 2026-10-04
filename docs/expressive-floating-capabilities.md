# Expressive Floating Character Rig — actual inspection

Date: **2026-10-03**. File: `assets/character/third-party/expressive-floating.riv`, 66,484 bytes; SHA-256 `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`. Inspection used the actual file with Rive 2.44.0. [Source/attribution](third-party-assets.md) and [inspection JSON](expressive-floating-inspection.json) are preserved.

## Discovered structure

| Item | Actual result |
| --- | --- |
| Artboards | `Artboard` |
| State machines | `State Machine 1` |
| Boolean inputs | `isTalking`, `isListening` |
| Numeric inputs | None exposed |
| Trigger inputs | None exposed |
| ViewModels/properties | None reported |
| Full state/layer enumeration | UNKNOWN — runtime API does not enumerate the complete graph |
| Binding-target graph | UNKNOWN — runtime API does not enumerate all bindings |

The 18 discovered timeline names are `idle`, `Empty`, `Listening`, `Talking`, `Waving`, `Thinking`, `DrawOrderLH`, `Mouth-talk`, `Mouth-smile`, `Mouth-normal`, `EYE-right-close`, `EYE-right-open`, `EYES-open`, `EYES-close`, `EYE-left-open`, `EYE-left-close`, `Blink-left`, and `Blink-bottom-left`.

## Feature evidence before visual acceptance

| Feature | File evidence | Visual support/acceptance |
| --- | --- | --- |
| Idle/floating | `idle` timeline; creator describes floating motion | Pending actual playback review |
| Listening | `isListening` boolean and `Listening` timeline; actual clip changes only five mouth paths | Native cue has no head/eye/body change. AMYU adds a held Waving frame (30% progress / 80% mix), raising a hand near head/shoulder; root observed distinction from idle, human approval pending |
| Thinking | `Thinking` timeline; no dedicated state-machine input | Root agent observed authored hand-to-chin pose; transitions verified; human visual approval pending |
| Speaking/talking | `isTalking` boolean, `Talking` and `Mouth-talk` timelines | Root observed dynamic speaking in the 8s demo; authored body loop and energy-weighted mouth work-range playback, not a numeric mouth input; human approval pending |
| Blink | Eye/blink timelines; creator describes natural blink | Pending actual playback review |
| Continuous mouth amplitude | No numeric mouth control exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Gaze X/Y | No gaze input or ViewModel property exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Head follow | No head input or ViewModel property exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Happy/smile | `Mouth-smile` timeline; no emotion input | Pending review; no full emotion blend declared |
| Concerned/surprised | No dedicated inspected input/timeline with these names | UNKNOWN; no invented emotion mapping |
| Wave | `Waving` timeline; no gesture trigger | Pending visual/adapter review |
| Other six semantic gestures | No corresponding inspected trigger inputs | Unsupported by current adapter; no full gesture support declared |
| Data Binding | No ViewModels reported | No exposed ViewModel-driven control; binding graph UNKNOWN |

The implemented `expressiveFloatingRig` uses the two inspected booleans and named animation mappings for idle/Talking body playback, `Thinking`, `Waving`, `Mouth-normal`, `Mouth-smile`, `Mouth-talk`, `EYES-open` and `EYES-close`. `Mouth-talk` loops its existing 30–60% open work range at speed 0.3, with energy-weighted mix and a resting baseline at zero. The adapter's actual-vector draw-command tests verify resting mouth at zero and changed authored motion at energy 0.3, 0.7 and 1. Authored idle and Thinking/Talking/Waving start-pose restoration address earlier latched body properties. These are playback/composition, not a discovered numeric mouth parameter or human proof of acceptable visual quality. Blink and wave are supported after actual browser verification; the autonomous blink and authored wave return were observed; gaze, head follow, continuous mouth, full emotion blend, visemes and six other gestures are unsupported by the current adapter.

Exact composition, selection for review and screenshot status are recorded in the [correction report](avatar-correction-report.md). The held `Waving` frame is an AMYU-composed listening cue, separate from the native mouth-only Listening clip. Actual Candidate B evaluation found no mouth/talking animation or energy control, so it was not integrated. Candidate A is selected for human review; acceptance remains pending.

Visible quality remains a human gate. Numeric telemetry, existing architectural tests and timeline names cannot establish acceptable listening/thinking/speaking or mouth motion.
