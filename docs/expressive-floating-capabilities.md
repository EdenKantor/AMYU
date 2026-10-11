# Expressive Floating Character Rig — actual inspection

Date: **2026-10-03**. File: `assets/character/third-party/expressive-floating.riv`, 66,484 bytes; SHA-256 `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`. Inspection used the actual file with Rive 2.44.0. [Source/attribution](third-party-assets.md) and [inspection JSON](expressive-floating-inspection.json) are preserved.

**Deep-refinement update — 2026-10-04:** the user rejected the current eyes, listening, speaking and mouth quality. The focused rendered pass reached **Candidate A practical ceiling NO**: listening remains nearly idle-like, full speech/mouth variation stays tiny/subtle, facial expressiveness and attention/gaze are poor or unavailable. Stop A beauty refinement. Playback support does not establish product acceptance; sustained context checks are recorded separately in [state design](avatar-state-design.md) and [product review](avatar-deep-review.md).

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
| Listening | Actual Listening timeline changes only five mouth paths; isListening is discovered but not actively applied | First focused composition uses Talking at 22% progress / 0.42 gain, Listening contour and softer attentive eye phase; rejected held Waving removed; combined product review pending |
| Thinking | Thinking timeline, no dedicated state-machine input | Actual solo hand-to-chin pose reviewed; first focused mapping varies progress 0.91–0.99; combined transitions/appearance pending |
| Speaking/talking | Actual Talking body and full Mouth-talk work range; isTalking discovered but not actively applied | Solo mouth cycle line→slit→triangle→slit→line reviewed; persistent full-cycle phase plus energy mix/speed and restrained body now implemented; 12s combined demo quality pending |
| Blink | Actual eye closure/reopening and autonomous blink observed in the earlier browser review | SUPPORTED playback; renewed naturalness/eye-shape/blend review pending, not a visual-quality PASS |
| Continuous mouth amplitude | No numeric mouth control exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Gaze X/Y | No gaze input or ViewModel property exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Head follow | No head input or ViewModel property exposed | Unsupported by current adapter; unexposed internal control behavior remains UNKNOWN |
| Happy/smile | `Mouth-smile` timeline; no emotion input | Pending review; no full emotion blend declared |
| Concerned/surprised | No dedicated inspected input/timeline with these names | UNKNOWN; no invented emotion mapping |
| Wave | Actual `Waving` playback and neutral return observed in the earlier browser review; no native gesture trigger | SUPPORTED playback; renewed review from idle/listening/thinking/speaking and interruption pending, not a full product PASS |
| Other six semantic gestures | No corresponding inspected trigger inputs | Unsupported by current adapter; no full gesture support declared |
| Data Binding | No ViewModels reported | No exposed ViewModel-driven control; binding graph UNKNOWN |

The first focused `expressiveFloatingRig` runs in generic authored-only mode. The real booleans remain visible in inspection/mapping diagnostics with `applied:false`; native state-machine advancement is bypassed after actual Mouth-layer iteration warnings. All visible state behavior is authored timeline playback/composition, not active native flags.

Mouth-talk now loops the entire 0.5–1s work area with persistent phase, energy-weighted mix and speed 0.7 + 0.65×energy. Talking provides restrained body motion; listening holds a selected Talking body frame and the actual mouth contour. Bilateral EYES-open phase = semantic openness×0.72 replaces the previous full-open/close-endpoint overlay; zero is closed. Root reviewed all 18 timelines solo, including all eight eye variants and the complete mouth shape cycle. Unilateral wink/lower-left occlusion was rejected as the natural bilateral-blink route. Authored start-pose seeding and normal geometry establish a consistent rest baseline; full stress/pixel review remains necessary.

These mappings are not a numeric mouth parameter or human approval. Blink and Wave remain supported playback; gaze, head follow, continuous mouth, full emotion blend, visemes and six other gestures remain unsupported. Per-emotion review support now declares neutral baseline supported, happy partial and the other eight unsupported; reused smile strength does not establish separate emotions.

Historical composition and screenshots are recorded in the [correction report](avatar-correction-report.md). The user subsequently rejected the result. The held Waving listening frame was removed in the focused pass, but the alternative remained weak. Actual Candidate B evaluation found no mouth/talking animation or energy control, so it was not integrated. A stays the current prototype while actual Candidate C is compared; its practical ceiling is now **NO** and human acceptance is absent. See the [complete timeline audit](avatar-animation-audit.md) and [actual C evidence](interactive-character-capabilities.md).

Visible quality remains a human gate. Numeric telemetry, existing architectural tests and timeline names cannot establish acceptable listening/thinking/speaking or mouth motion.
