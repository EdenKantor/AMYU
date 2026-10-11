# Candidate C — actual runtime evidence

Date: **2026-10-04**. Candidate C is an unchanged downloaded file under evaluation after Candidate A's practical-ceiling decision **NO**. This report records structural and drawing-command evidence. Browser appearance, on-artboard handle behavior and human approval remain separate.

The temporary prototype mascot is not the AMYU production identity.

## Actual discovery

| Item | Actual file result |
| --- | --- |
| File | `assets/character/third-party/interactive-character.riv` |
| Artboard | `Carrot main`, bounds 0,0–936,916 |
| State machine | `State Machine 1` |
| SM numeric / boolean / trigger inputs | 0 / 0 / 0 |
| ViewModel | `ViewModel1` |
| Named instance | `Instance` |
| Properties | Exactly one trigger: `triggerProperty` |
| Numeric / boolean / nested VM properties | None exported |
| Full native state graph / binding target graph | UNKNOWN: not fully enumerable through this runtime |
| Provenance | aln.omrv; official CC BY 4.0; 12,722 bytes; hash recorded in [provenance](third-party-assets.md#downloaded-candidate-c--actual-fallback-evaluation) |

The actual [inspection JSON](interactive-character-inspection.json) lists every timeline and property. No name is inferred from marketplace prose.

## All twelve authored timelines

All have 60fps and speed 1. Times below are seconds; work-area duration is the relevant playback interval.

| Timeline | Full duration | Work area | Loop | Phase sample result |
| --- | --- | --- | --- | --- |
| `active` | 10 | 1–4.6 | One-shot | Seven distinct signatures; 36 changed drawing commands |
| `idle` | 10 | 4–6 | Loop | Seven distinct signatures; 36 changed drawing commands |
| `blink` | 4 | Full duration | Loop | One signature, no standalone phase change |
| `Timeline 1` | 1 | Full duration | One-shot | Seven signatures; 33 changed drawing commands |
| `Source` | 1 | Full duration | One-shot | One static signature; 32 commands differ from fresh artboard |
| `Eyebrow X` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `Blink` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `Bottom eye` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `head X` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `head Y` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `pupil X` | 1 | Full duration | One-shot | One signature; no captured phase change |
| `pupil Y` | 1 | Full duration | One-shot | One signature; no captured phase change |

Each timeline was sampled at 0/0.1/0.25/0.5/0.75/0.9/1 on fresh artboards using actual `LinearAnimationInstance.time`, `advance(0)` and `apply(1)`. Follow-up repeats used fresh, `Source`, `Timeline 1` and `idle` baselines plus one second of nonzero artboard advancement. The named head/pupil/brow/eyelid clips remained phase-static in every tested setup. Lowercase `blink` uniformly restored nine commands from the `Timeline 1` baseline at every sampled phase, with no distinct phase signature.

These are measured limitations of these initialization/playback routes, not proof that an editor joystick or on-artboard drag cannot work. The headless probe emitted “No WebGL support. Image mesh will not be drawn.” Any image-mesh effects and visible pixels require browser review. Draw IDs are emitted Canvas2D command positions, not source object IDs.

## Actual binding and pointer effects

`StateMachineInstance.bindViewModelInstance(file.viewModelByName('ViewModel1').instanceByName('Instance'))` is verified. Calling `instance.trigger('triggerProperty').trigger()` after 1.5s produces observed native `idle → active → idle`: active is reported at frame 90, idle at frame 307 in a 60fps run. Geometry differs from the same-time no-trigger run. This proves a bound authored activation, not listening, thinking, speech or an arbitrary gesture.

Ordinary `pointerMove` to four artboard positions, with no pointer-down/drag, has no difference from the identically timed bound idle run. This is a limited negative result. It does **not** test dragging actual authored handles. A grounded browser picture/handle location is required before a focused pointer-down/move/up test. Do not label the source's five joystick claim as an exported numeric API.

## Capability status for evaluation

| Feature | Current evidence | Status |
| --- | --- | --- |
| Native activation trigger | Bound trigger changes real geometry and native state | Verified execution; semantics/appearance pending |
| Idle movement | Authored idle has real phase-dependent geometry | Verified authored material; life quality pending |
| External head / pupil axes | No SM/VM numeric controls; named phase routes unchanged | No verified usable route; drag/initialization caveat |
| Eyelid / brow control | No SM/VM numeric controls; named phase routes unchanged | No verified usable route; browser/mesh caveat |
| Mouth / speech energy | No exposed parameter or mouth/talking timeline found | No verified usable route; visual geometry audit pending |
| Listening / thinking | No named clip/typed property; active trigger is generic | Not established; do not relabel active as both |
| Blink | Authored names exist but phase changes not measured | UNKNOWN pending actual browser route |
| Semantic gestures | No matching native trigger or mapping established | UNKNOWN until actual animation appearance is reviewed |

No capability is promoted merely because a timeline name exists. No binary modification or invented mapping is part of this audit.

## Reproduction

Read-only probe scripts: `work/inspect-interactive-character.mjs` and `work/audit-interactive-character.mjs`. Durable results: [inspection](interactive-character-inspection.json) and [animation/binding audit](interactive-character-animation-audit.json). They load the real binary with the installed `@rive-app/canvas-advanced` **2.44.0** and its matching local WASM. Pixel appeal, distortion, animation readability and final A-vs-C recommendation belong in [the product review](avatar-deep-review.md).
