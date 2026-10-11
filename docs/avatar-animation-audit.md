# Expressive Floating animation audit

The initial audit is complete for the actual downloaded binary. **Individual
browser appearance review is pending.** Finite vector commands, changing hashes,
and valid timelines do not establish visual quality or recognizable behavior.
The previous raised-wave Listening composition is rejected by the user.

Asset: `assets/character/third-party/expressive-floating.riv`, 66,484 bytes,
SHA-256 `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`.
[Expressive Floating Character Rig (Old Work Share)](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/)
by kouidero, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The binary is unchanged. Audit runtime: `@rive-app/canvas-advanced` 2.44.0.

Reproduce with `node work/capture-expressive-audit-warnings.mjs` (which invokes
`work/audit-expressive-floating.mjs` and captures compiled runtime diagnostics).
The detailed record is
`work/expressive-floating-animation-audit.json`. The script loads the actual
WASM, samples all 18 authored timelines independently at seven positions,
records transformed Canvas2D paths, paints and clip masks, tests mixes of
0.25/0.5/0.75, tests stopping/resetting, and runs each native boolean combination
for ten simulated seconds. No current production adapter mapping is used.

## Verified structure and inspection limits

There is one artboard, `Artboard`, with bounds `(0,0)..(1062,1382)`, one state
machine, `State Machine 1`, and exactly two inputs: boolean `isTalking` and
boolean `isListening`. There are **no number inputs, no trigger inputs, and no
ViewModels**. Complete data-binding targets and the full native state/layer graph
cannot be enumerated by this runtime and remain **unknown**.

The runtime exposes animation timing, transforms by a known source name, and
rendering operations. It does not enumerate keyed source objects/property IDs
or source node names. Draw IDs below are emitted rendering-command positions,
**not Rive object IDs**. They can shift when draw order changes. A transform of a
parent changes many emitted child paths without proving that every child was
individually keyed.

The standardized baseline applies authored Thinking/Talking/Waving start poses,
idle start, normal mouth, and fully open eyes. This makes comparisons repeatable;
it is not a recommendation that fully open eyes look good. Renderer path areas
and clipping cannot establish natural blinks without a browser pixel review.

## All authored timelines

All use 60 fps. Full duration is separate from the enabled work area. The raw
disabled work-area sentinel is `4294967295`. Close variants have authored speed
−1: their forward timeline still goes from closed at time 0 to open at time 0.5.

| Timeline | Full duration / frames | Effective work range | Loop / speed | Measured change and body parts | Useful behavior; blend/combination limits |
|---|---|---|---|---|---|
| idle | 20s / 1200 | 3–8s, frames180–480 | loop / 1 | Float, body/arm/head movement and shadow; draw IDs1–84 change across samples | Primary idle life and neutral pose baseline. Does not reset every other timeline target. Reduce motion strength for focused states; pixel quality pending. |
| Empty | 3s / 180 | 0–3s; work area disabled | one-shot / 1 | No changed drawing operations in any sampled position | Empty timeline; cannot supply a pose or neutral reset. |
| Listening | 1s / 60 | 0–0.25s, frames0–15 | one-shot / 1 | Only five mouth paths39–43 change. No authored head, hand, body or eye change. End is the normal-mouth contour | Subtle mouth cue only. Does not provide obvious attentive posture. Safe finite blends; overlaps all other mouth clips. |
| Talking | 7s / 420 | 0–7s, frames0–420 | loop / 1 | Body/head/arm transforms and arm-path deformation; draw IDs1–83 change | Real speech body motion; combine with an independently driven Mouth-talk clip. Idle alone misses some translated/deformed targets; restore Talking's authored start pose. |
| Waving | 5s / 300 | 1–4s, frames60–240 | one-shot / 1 | Raised/moving arm, accompanying head/body motion and ordering; many children change | Genuine Wave. The prior held wave for Listening was rejected; do not retain it by default. Start-pose restoration needed. |
| Thinking | 4s / 240 | 0–1s, frames0–60 | one-shot / 1 | Hand-to-chin pose with body/head changes; draw IDs1–83 change | Useful Thinking material. Hold/interpolate existing poses; avoid replaying its one-second entrance as a repeated loop. Restore its start pose. |
| DrawOrderLH | 1s / 60 | 0–0.3333s, frames0–20 | one-shot / 1 | Reorders existing left-hand/body operations; multiset of drawing geometry and paint unchanged | Ordering utility, not a new gesture. Draw IDs3–33 shift at early samples; mixing draw order is discrete, not a smooth geometric interpolation. |
| Mouth-talk | 2.2667s / 136 | 0.5–1s, frames30–60 | loop / 1 | Five mouth paths39–43, including dark-fill paint | Actual talking shape cycle. Full work area varies dark-opening hull from about6 to23.18 artboard units. Current restricted open segment suppresses much of that variation. Normal mouth resets geometry but does not reset the talk fill color. |
| Mouth-smile | 1s / 60 | 0–1s; work area disabled | one-shot / 1 | Five mouth paths39–43; no new eye/body pose | Genuine smile material, useful for partial positive affect. Cannot represent ten distinct emotions. Apply after normal baseline and before talking. |
| Mouth-normal | 1s / 60 | 0–1s; work area disabled | one-shot / 1 | Constant normal-mouth geometry; no difference from the standardized normal baseline | Geometry reset for other mouth poses. Does not key all Mouth-talk paint properties. |
| EYE-right-close | 0.5s / 30 | 0–0.5s; work area disabled | one-shot / −1 | Right lid/clip operations55–64; two clip-mask operations vary | Unilateral closure. Forward scrubbing equals right-open's reverse-played authored data; do not layer both controls simultaneously. |
| EYE-right-open | 0.5s / 30 | 0–0.5s; work area disabled | one-shot / 1 | Same right-lid/clip target group55–64 | Candidate for authored phase-controlled right eye. Sample0 is closed; sample1 matches fully open baseline. |
| EYES-open | 0.5s / 30 | 0–0.5s; work area disabled | one-shot / 1 | Both lid groups55–64 and76–83, including left-side paint/opacity and clip masks | Candidate for bilateral phase-controlled softness. Compare progress0.75/0.85/0.95 in browser with endpoint-mix closure; do not assume they look equivalent. |
| EYES-close | 0.5s / 30 | 0–0.5s; work area disabled | one-shot / −1 | Same bilateral target set; six clip operations vary | Bilateral closure/sleep. Current endpoint blending bypasses authored intermediate timing and opacity changes; browser comparison required. |
| EYE-left-open | 0.5s / 30 | 0–0.5s, frames0–30 | one-shot / 1 | Left lid/clip/paint operations76–83; four paint and four clip changes at early positions | Candidate for authored phase-controlled left eye. Left and right control groups are not geometrically identical. |
| EYE-left-close | 0.5s / 30 | 0–0.5s, frames0–30 | one-shot / −1 | Same left target set as left-open | Left closure; reverse playback of its opening curve. Cannot establish natural asymmetry solely from numeric availability. |
| Blink-left | 1s / 60 | 0–0.5s, frames0–30 | one-shot / 1 | Left group76–83; sampled changed groups resemble EYE-left-open | Its name does not prove a complete close–open cycle. Effective work range ends open. Evaluate raw authored playback before using as a local blink. |
| Blink-bottom-left | 0.5s / 30 | 0–0.5s; work area disabled | one-shot / 1 | Only left-lower-lid/clip operations76–79 | Possible subtle lower-lid expression. It is unilateral and does not close both eyes; not a bilateral blink replacement. |

Every sampled numeric geometry blend remained finite. This only demonstrates
runtime execution, not beauty or freedom from clipped/self-intersecting shapes.
The author used different left/right opacity and clipping behavior; this is why
individual eye review is required rather than assuming every open/close variant
is interchangeable.

## Latching, resets and combinations

Applying mix zero leaves the last keyed values in place for every non-empty
changed clip. Stopping a clip does not automatically restore the original pose.
The idle timeline alone fails a complete standardized-baseline reset for tested
overlays. The complete authored start-pose + idle + normal-mouth + open-eye reset
restores all tested overlays except Mouth-talk's dark-fill paint. Its rest
geometry returns, but the ink color remains from the talk timeline. Exact source
property names are unavailable, so this is reported as an emitted paint change.

The real mouth's idle dark fill is `rgba(116,116,116,1)`; talk changes it to
`rgba(63,99,100,1)`. A fresh artboard restores the serialized paint. An alternative
is a documented canonical baseline that always seeds the authored talk paint
before restoring normal geometry; that would keep the existing authored color
consistent, without editing artwork. Neither has been adopted during this audit.

Normal + Mouth-talk, Smile + Mouth-talk, Thinking + soft eyes, Listening + soft
eyes, bilateral partial closure, individual partial closure, Blink-left and
Blink-bottom-left were executed together. The changed masks/paths are recorded
in JSON. Mouth clips share targets and apply order matters. Eye controls must
not fight one another or the native state's authored eye animation. Draw-order
changes need explicit restoration as well as neutral body transforms.

## Native boolean-only playback

No AMYU overlays were used in these ten-second runs.

| Flags | Actual observed state-change names | Interpretation |
|---|---|---|
| both false | idle, Mouth-smile | Native idle does not itself provide AMYU semantic gaze or speech energy. |
| listening true | Listening, EYE-left-open, EYE-right-open, Mouth-smile, Mouth-normal | Native listening can affect eye opening through separate SM states, although the Listening timeline itself only affects the mouth. |
| talking true | Talking, EYE-left-open, EYE-right-open, Mouth-talk | Authored body/eye/mouth playback exists, but accepts a boolean rather than continuous energy. |
| both true | Listening, EYE-left-open, EYE-right-open, Mouth-talk, Mouth-normal | Conflicting native mouth behavior; avoid activating both flags together. |

The four ten-second native runs emitted **3,498** compiled runtime diagnostics:
**“StateMachine exceeded max iterations in layer Mouth”**. Separate stdout and
stderr capture prevents honest assignment of those warnings to individual
boolean combinations, so per-case counts remain unknown. These
warnings are actual runtime output, not a guessed graph failure. The full graph
and exact offending transition cannot be inspected. The authored-timeline
adapter should expose an optional authored-only playback mode and retain native
input discovery as metadata, rather than silently presenting the bool-only SM
as stable continuous facial control.

## Candidates for the focused visual pass

1. **Eyes:** browser solo review found phase0.5 softer and phase0.75 almost fully
   wide. The focused pass maps semantic openness0.84 to authored phase0.6048,
   preserving zero as complete closure. The lower-left-lid utility is rejected.
   Relaxed idle, slightly more open listening, narrowed thinking, expressive
   speech and fully closed sleeping are plausible controls, not yet visual passes.
   Core openness0.84/0.93/0.74/0.87 is within tested finite ranges; exact artwork
   interpretation belongs to the Rive adapter. No pupil tracking is available.
2. **Listening:** the native mouth cue is insufficient. Do not reintroduce the
   rejected held wave. Inspect gentle authored Talking body phases, calmer idle
   motion, and attentive eye phases before choosing any composition. If those
   do not read as Listening, this remains a hard asset limit.
3. **Speaking:** retain authored Talking body motion, use the entire Mouth-talk
   work range with a persistent phase, mix syllable energy toward normal during
   pauses, and avoid the current narrow always-open segment. Mouth aperture is
   modest even at full authored strength, so the browser review determines its
   practical ceiling. Shape hashes are not proof that it looks like speech.

Native independent gaze, numeric head follow, numeric jaw opening, visemes,
six additional gestures and ten distinct emotion rigs are absent. Candidate A
has appealing original design and useful Wave/Thinking material, but uncertain
Listening and facial range. Its practical-ceiling decision must follow one
focused visual pass. If two required features remain poor, stop refining A and
evaluate the actual Candidate C file as the user instructed.

## Browser review record

Root reviewed all18 authored timelines individually through the real WASM
renderer and solo-preview UI on2026-10-04. The resting body is a rounded mint
figure. Empty has no visible effect; DrawOrderLH is a utility. Listening leaves
the body unchanged and adds only a tiny curled mouth. Thinking produces a
recognizable hand-to-chin pose. Waving genuinely raises the arm. Talking gives
a slight float/lift with canted arms: weak, but usable for restrained composition.

Mouth-talk at phases0/0.25/0.5/0.75/1 shows a line, small open slit, triangle
opening, small slit and line. Its full work range reads more clearly than the
previous narrow segment. EYES-open and EYES-close have the same forward shape
sequence: phase0 closes both eyes and phase1 opens them. Phase0.5 is softer,
with slight pupil occlusion; phase0.75 is nearly wide open. Unilateral close
clips produce winks, not gaze. Blink-bottom-left half-occludes one pupil and
looks odd; it is rejected for normal blinking. Both Blink-left and the other
eye variants were reviewed as authored material, without claiming new gaze.

The user rejected the prior overall result. This solo review proves available
material, not quality approval. The focused pass now uses softer bilateral eye
phases, the full mouth cycle with persistent phase through silence, energy mix
and speed, restrained Talking motion, an authored Talking still pose for
composed listening (no held wave), and slight Thinking pose variation. An
authored Mouth-talk start-pose reset makes resting ink deterministic before
Mouth-normal restores shape; the binary remains unchanged. Refined appearance,
state transitions, combinations and the final Candidate A ceiling remain
pending root's actual browser review.

## Focused-pass ceiling decision

Root reviewed the refined Candidate A in the actual browser renderer on
2026-10-04 and judged the result insufficient. Listening still appeared nearly
identical to idle. Mouth/speech remained tiny and subtle. The file also lacks
the independent facial and directed-attention controls required for the target.
The user's rule to stop when two required areas remain poor is triggered.
**Stop Candidate A visual refinement and evaluate the actual Candidate C file.**
Technical regression tests passed, including persistent mouth phase through
silence and deterministic return to rest; they do not reverse this visual
judgment. Candidate A remains the current development primary until a better
candidate is actually reviewed and approved. The original file hash is unchanged.
