# Candidate A state design — historical deep refinement

This preserves the detailed A mapping and its measured visual ceiling. Use [the current state design](avatar-state-design.md) for the Friendly Floating Bot prototype. References to the current/primary asset below belong to this earlier Candidate A record.

Updated: **2026-10-05**. Current primary asset: Expressive Floating Character Rig by kouidero. **The user rejected the current eyes, listening, speaking and mouth quality. The avatar is not approved.** This specification separates the desired product behavior from the current adapter and the actual browser findings.

Root reviewed all 18 authored timelines individually and one focused mapping pass in the actual browser. **Can Candidate A reach the requested quality? NO.** Listening remains almost idle-like, speech/mouth stay small and subtle, and facial expressiveness and attention/gaze remain poor or unavailable. A beauty refinement has stopped. The completed browser checks and actual Candidate C comparison are recorded in [the product review](avatar-deep-review.md). Agent observations do not establish human approval.

## Evidence and constraints

The actual 66,484-byte binary has SHA-256 `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`. The actual WASM/drawing-command audit was generated **2026-10-04T17:51:42.220Z** in `work/expressive-floating-animation-audit.json`. It samples fresh artboards with a standardized authored baseline, rather than the production renderer. See the [complete animation audit](avatar-animation-audit.md), [structural inspection](expressive-floating-capabilities.md) and [deep review record](avatar-deep-review.md).

| Authored material | Measured timing/effect | Consequence for design |
| --- | --- | --- |
| `idle` | 20s total; work range 3–8s, effective 5s | Actual 3m25s observation found repetitive float despite varied blinking |
| `Listening` | 1s total; work range 0–0.25s; five changed mouth draw commands | Native listening is a mouth contour, not an attentive head/body/eye pose |
| `Thinking` | 4s total; work range 0–1s; five distinct signatures across seven samples | Gentle authored progress 0.91–0.99; browser shows a recognizable hand-to-chin pose and clean sampled transitions |
| `Talking` | 7s work range; three distinct signatures across seven sampled positions | Authored body material exists; sampled variation does not prove convincing speech |
| `Waving` | 5s total; work range 1–4s, effective 3s | Authored wave exists; holding a frame is composition and is not automatically listening |
| `Mouth-talk` | 2.267s total; work range 0.5–1s; six distinct signatures across seven samples | Solo browser phases 0/0.25/0.5/0.75/1 show line → slit → triangle → slit → line; current adapter uses the full work range |
| `Mouth-smile` / `Mouth-normal` | Each 1s; each has one distinct signature across seven sampled positions | Useful poses, not ten native emotion channels |
| Eye open/close clips | 0.5s; close clips have authored speed −1 | Current mapping uses EYES-open authored phase, not a full-open endpoint plus close overlay |
| `Blink-left` / `Blink-bottom-left` | Effective 0.5s each; affect eight/four left-eye drawing commands | Root rejected unilateral wink/lower-lid occlusion as the natural bilateral-blink route |
| `DrawOrderLH` | Effective 0.333s | Hand/body compositions must be reviewed for occlusion and draw-order conflicts |
| `Empty` | 3s; no changed drawing commands | Do not treat it as a visible reaction |

Draw-command indices are **not Rive object IDs**. Exact keyed source object/property names remain unknown through this runtime. Finite blended geometry does not establish attractive pixels, natural timing or recognizable meaning.

Stopping a clip at mix zero retained pose in the standalone audit. Idle alone did not restore the whole standardized baseline. Applying the complete baseline restored most sampled signatures, but `Mouth-talk` still did not exactly match it. The focused mapping seeds the authored Mouth-talk start pose before normal-mouth geometry, creating a consistent existing authored paint baseline. Sampled transitions and the final pose after the complete 113s stress run returned the hands, eyes and mouth to neutral without a visible latch. This does not edit the artwork; a dropped mix alone is not a guaranteed reset.

The current asset exposes only `isTalking` and `isListening` booleans, no numeric/trigger inputs and no ViewModels. The first focused adapter uses generic `stateMachinePlayback: 'authored-only'`: the real boolean controls remain inspected and mapped diagnostically, but `applied:false` because native SM playback is bypassed. This avoids the actual native Mouth-layer iteration warnings recorded in the audit, while preserving authored timeline execution. Gaze, head control, continuous mouth amplitude, full emotion blending, visemes and six gestures remain unsupported by the current adapter. Semantic head/body/eye-scale/squint/frown values do not become visible merely because they exist in `AvatarFrame`.

## State specifications

Each table records the target and current mapping. A working mapping does not imply the target is met.

### Idle — calm, alive, subtle

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Soft relaxed resting shape, varied natural blinks; avoid staring | Semantic idle openness 0.84 plus local variation/blink, mapped to EYES-open phase ×0.72 (rest about 0.6048); softer lids still surround fixed, staring pupils |
| Mouth | Clear quiet rest; optional modest smile from supported affect | `Mouth-normal` endpoint plus limited smile; no continuous mouth parameter |
| Head | Subtle authored movement, never constant robotic scanning | Semantic head/gaze values are unmapped |
| Body | Calm breathing/float without an obvious short repeated pattern | Fixed phase through the five-second idle work range |
| Hands | Neutral placement, no residual thinking or wave pose | Requires restoring authored start poses, not merely stopping overlays |
| Movement energy | Low and varied; decorative movement respects reduced motion | Semantic animation energy is not directly mapped to this asset |
| Attention | Available and relaxed; no pointer-follow claim | Gaze unsupported; authored eye behavior only |
| Allowed idle behavior | Local life controls blink timing; supported authored variation remains subtle | Many local-life body/posture fields are not consumed |
| Transition in | Restore resting mouth, hands and eyes without a visible snap | Full affected-property reset must be checked after every active state |
| Transition out | Smooth entry into the next state; no retained baseline fighting overlays | Review application order and overlapping authored channels |

Browser finding: **PARTIAL**. Observed uninterrupted idle for **3m25s**, with the lab clock moving from 4:37 to 8:02 after the stress run. The character stays alive through float and variable blinking, but the five-second body loop is conspicuous and its gaze remains fixed. This is a rendered observation, separate from the thirty-minute deterministic simulation test.

### Listening — attentive, clearly different from idle

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Slightly more attentive than idle, still soft and alive | Semantic openness 0.93 maps to authored phase about 0.6696, with local variation/blink; no pupil tracking |
| Mouth | Quiet receptive expression, no talking | Actual Listening mouth contour at progress 0 is composed directly; native SM boolean is diagnostic only |
| Head | A small authored orientation/lean only if the audit supports it | No exposed head control; no invented tilt mapping |
| Body | Calmer movement with readable attention, not a frozen mannequin | AMYU now holds authored Talking at 22% progress with 0.42 gain; the original idle baseline continues |
| Hands | Rest naturally or use an attentive pose that does not look like waving/thinking | Rejected held Waving pose removed; hand/body attitude comes from the authored Talking still pose |
| Movement energy | Lower randomness than idle; retain gentle life | Current idle baseline continues; semantic calming is largely unmapped |
| Attention | Communicate “I am paying attention to you” through available authored material | Stable pupil/cursor tracking is unsupported |
| Allowed idle behavior | Natural blink and restrained breathing; avoid distracting gestures | Do not confuse a hand gesture with attention |
| Transition in | Difference visible promptly without a label; no abrupt arm jump | Review native mouth and every proposed body/eye composition separately |
| Transition out | Cleanly release attention pose into thinking/speaking/idle | Check hands, mouth, eye shape and draw order |

Browser finding: **FAIL**. The Talking .22/.42 composition and mouth curl remain nearly indistinguishable from idle. The stress sequence executed **ten idle ↔ listening repetitions**. Direct rendered comparison did not support reliable recognition without a label. The rejected held-wave pose was removed; no further A beauty refinement follows the ceiling decision.

### Thinking — inward attention, thoughtful pose

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Concentrated, softer/narrower where authored material permits | Semantic openness 0.74 maps to phase about 0.5328; no pupil redirect or independent squint control |
| Mouth | Quiet normal/thoughtful mouth, no speech motion | Normal/smile overlays may compete with authored body pose |
| Head | Natural concentration rather than a forced repeated tilt | Head values unmapped; use only verified authored execution |
| Body | Slower movement than listening, with subtle safe variation | Thinking progress = 0.95 + 0.04×sin(time×0.9), mixed by semantic thinking weight; approximately seven-second subtle phase variation |
| Hands | Authored hand-to-chin placement must look natural and not collide | Browser review shows the authored hand at the chin; sampled entry, speech transition and idle return are clean |
| Movement energy | Low, inward, subtly varied rather than identical frozen repetitions | Small deterministic authored phase variation is implemented; beauty and blend safety require combined review |
| Attention | Less direct engagement; no fabricated gaze shift | Actual pupil control unsupported |
| Allowed idle behavior | Blink and restrained float; no conflicting hand reaction | Baseline and overlay conflicts require rendered review |
| Transition in | Smoothly reach concentration without harsh freezing | Inspect authored one-second work range and blend separately |
| Transition out | Release hand/body into idle or speaking with no latch | Test thinking → speaking and repeated thinking → idle |

Browser finding: **PASS for recognizable thought and sampled transitions**. The hand-to-chin pose is clear and the narrow deterministic variation avoids a completely frozen hold. Thinking → speaking and thinking → idle release the hand. The eyes remain limited by fixed pupils, and this agent finding is not user approval of the character.

### Speaking — mouth and body communicate speech

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Expressive natural openness that does not remain wide/frozen | Semantic openness 0.87 maps to phase about 0.6264, with local variation/blink; fixed pupils still limit expression |
| Mouth | Multiple visibly changing shapes; quiet rest at zero and during pauses | Full authored work range 0.5–1s now loops with mix = speech energy and speed = 0.7 + 0.65×energy; phase persists through zero-energy pauses |
| Head | Restrained authored emphasis linked to phrases, not constant bounce | No numeric head control; body clip must supply any visible emphasis |
| Body | Authored speech motion with weak/strong phrases and rests | Talking gain = speaking weight×(0.12 + 0.38×energy), speed = 0.65 + 0.2×energy; a restrained body baseline remains through short pauses |
| Hands | Compatible natural placement; no repeated wave masquerading as speech | Authored channels can overlap thinking/wave/reset material |
| Movement energy | Syllable bursts, micro pauses and phrase pauses; bounded emphasis | New 12s synthetic syllables group into phrases with weak/strong bursts and rests; no audio/provider |
| Attention | Engaged communication with life in the face/body | Gaze unsupported; do not promise pointer-follow |
| Allowed idle behavior | Blinks and restrained float continue without fighting speech | Actual speaking demo retains lids, float and restrained authored body motion |
| Transition in | Enter from idle/listening/thinking without a phase snap | Do not restart mouth phase whenever energy changes |
| Transition out | Immediately stop speech intent; settle normal mouth/body/eyes | Mouth/body clocks retain phase while inactive; authored start-pose/normal geometry restoration visibly returns to rest after the demo and sampled stress edges |

Implemented Speaking Demo: **12 seconds**, within the requested 10–15s range, with sentence-like synthetic cadence and no audio/provider. It was run to completion. Solo review showed the whole authored closed/slit/triangle/slit/closed mouth cycle; combined samples show real variation and body motion. Browser finding: **PARTIAL** for both speaking and mouth, because these cues remain tiny/subtle on stage and do not meet the requested readable speech quality. Native boolean playback was audited independently and is bypassed, not presented as a stable active driver.

### Acting — purposeful active energy

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Alert purposeful expression, distinct from listening/speaking | Semantic acting openness 0.91 maps to phase about 0.6552, but does not establish a distinct purposeful state |
| Mouth | Quiet purposeful rest unless speech is separately requested | No native acting mouth/expression |
| Head | A defensible authored action cue if available | Semantic head activity is unmapped |
| Body | Clear bounded purposeful motion, not a constant bounce | No acting-specific authored mapping currently exists |
| Hands | A meaningful available action without fabricating unsupported gestures | Only Wave currently maps; waving is not automatically “acting” |
| Movement energy | Moderately active, controlled and distinguishable | Director acting energy/body fields are not visibly executed |
| Attention | Task-oriented through supported authored behavior | No gaze/target control |
| Allowed idle behavior | Retain life, reduce distractions during the action | Avoid simply relabeling idle as acting |
| Transition in | Readable activity through audited authored material | If no defensible composition exists, declare the visual state unsupported |
| Transition out | Restore all action channels cleanly | Test interruption from every semantic state |

Current distinct acting representation: **UNSUPPORTED**. Future composition is contingent on audit and rendered evidence; no mapping is invented here.

### Sleeping — clearly asleep and calm

| Field | Product target | Current mapping / review constraint |
| --- | --- | --- |
| Eyes | Fully closed, natural shape rather than a deformation | Semantic sleeping openness now converges to 0, mapped to the actually closed EYES-open start pose |
| Mouth | Normal quiet rest, zero speech | Awake guard suppresses mouth motion; authored Mouth-talk start paint and normal geometry establish rest |
| Head | Calm authored resting attitude where possible | Semantic sleep head/lean is unmapped |
| Body | Quiet life and substantially calmer motion | Fixed idle clip still advances; semantic sleep motion reduction is not applied to it |
| Hands | Neutral, no held wave/thinking pose | Existing state weights blend down; keyed-property restoration still matters |
| Movement energy | Very low; no active gestures or speech bursts | Reduced director energy alone does not slow artwork playback |
| Attention | Clearly disengaged, no hover/gaze performance | Gaze unsupported; click wakes through semantic state |
| Allowed idle behavior | Gentle breathing only; avoid awake blink/reaction appearance | Baseline conflicts need focused review |
| Transition in | Smooth relaxation and closure; immediate speech stop | Timeline speech mix stops and eye openness blends to zero; native flags remain diagnostic, broader sleep posture absent |
| Transition out | Eyes reopen naturally and body reaches neutral before renewed activity | Wake remains a phase of awake/state behavior, not a new semantic state |

Browser finding: **Sleeping PARTIAL; wake PASS**. The authored lids close fully and speech stops, clearly distinguishing the sleeping face. The body still follows its idle float rather than a dedicated calm sleeping pose. The full sequence and direct controls showed eyes reopening and a clean neutral return. Click-to-wake is recorded separately with the interaction review.

## All ten emotions — current representation

`SUPPORTED` here means an actual baseline representation exists; `PARTIAL` means a limited authored component is mapped, not a complete recognizable emotion; `UNSUPPORTED` means the current adapter lacks a defensible distinct representation. None of these labels is human visual acceptance. Reclassify only after focused rendering, never from semantic numbers alone.

| Emotion | Current classification | Actual mapped material | Target / gap to review |
| --- | --- | --- | --- |
| neutral | SUPPORTED (baseline execution) | Normal mouth and authored idle/open-eye baseline | Neutral must look relaxed; current eye quality was rejected |
| happy | PARTIAL | `Mouth-smile` weighted by semantic smile | Recognizable restrained happiness; no full face control |
| excited | UNSUPPORTED | No distinct authored excited expression | A stronger reused smile must not be advertised as excitement |
| curious | UNSUPPORTED | Distinguishing head tilt has no asset mapping | Do not repurpose thinking or wave and label it curiosity without evidence |
| concerned | UNSUPPORTED | Frown and eye-scale values are unmapped | No verified concerned face |
| surprised | UNSUPPORTED | Eye-scale and semantic mouth opening are unmapped | No verified surprised expression |
| empathetic | UNSUPPORTED | No distinct authored empathetic expression | A gentle reused smile is not proof of empathy |
| amused | UNSUPPORTED | No distinct authored amused expression; squint is unmapped | A reused smile does not establish amusement |
| focused | UNSUPPORTED | Semantic squint is unmapped | No verified focused face |
| confused | UNSUPPORTED | Semantic tilt/frown values are unmapped | No verified confused face |

All ten were sampled in the actual browser at normal intensity. Neutral is a real baseline; happy produces a small smile. Some other semantic affects reuse that smile, but none provides a defensible distinct expression. Do not advertise ten visually distinct emotions or promote a shared smile to eight additional supported emotions.

## All seven gestures — current support and review

| Gesture | Current artwork support | Evidence / limitation |
| --- | --- | --- |
| wave | SUPPORTED; browser PASS | Genuine authored arm wave from idle, listening, thinking and speaking; interruption and final neutral return reviewed |
| nod | UNSUPPORTED | No current authored mapping |
| shake_head | UNSUPPORTED | No current authored mapping |
| head_tilt | UNSUPPORTED | No current authored mapping |
| bounce | UNSUPPORTED | No current authored mapping |
| celebrate | UNSUPPORTED | No current authored mapping |
| shrug | UNSUPPORTED | No current authored mapping |

The **20.4s Gesture Demo completed** with Wave from idle, listening, thinking and speaking. Rendered samples showed the arm rise, replace the thinking hand pose, and return to neutral. Its completion/interruption sequence and the stress test's ten wave → idle repetitions ran. The other six remain explicitly unsupported controls.

The lab requests only verified supported click gestures; A uses Wave. Repeated clicks coalesce rather than queue unsupported bounce/head-tilt/shake-head reactions. Sleeping click wakes through semantic state. The actual interaction findings are recorded in the product review. Hover may add a small mapped smile, while semantic head/body anticipation is unmapped.

## Review sequences and exit criteria

The **38s Full State Demo completed**: idle 4s, listening 5s, thinking 5s, speaking with dynamic cadence 10s, acting 4s, sleeping 5s, wake 2s, idle 3s. Wake uses awake/state semantics. The **20s Eye/Blink Demo**, **113s Transition Stress Test** and **20.4s Gesture Demo** also completed. These are repeatable development-only visual tests; unsupported gestures are not fabricated.

The stress sequence ran idle → listening → thinking → speaking → listening → speaking → thinking → idle → sleeping → idle; then ten idle/listening pairs, rapid listening/thinking/speaking every 500ms, and **ten repetitions each** of speaking → idle, thinking → idle and wave → idle. All nine initial transitions were sampled visually and captured; the complete run and final neutral return were checked. The middle repetition phases were executed, not continuously watched frame by frame. No visible latch was found in the sampled transitions or final pose.

All six rendered states, the available gesture, ten emotion classifications, several-minute idle behavior and eye/blink behavior were reviewed. More than two critical areas remain poor, so **A cannot reach the requested quality** and its beauty refinement has stopped. Actual C inspection is recorded in [C capabilities](interactive-character-capabilities.md); the rendered comparison and final recommendation belong in [the product review](avatar-deep-review.md). Passing checks does not satisfy the visual gate. Human approval remains required before onboarding.
