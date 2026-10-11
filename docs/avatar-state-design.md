# Avatar state design — Friendly Floating Bot review

Updated **2026-10-09**. Candidate D is the active/default **Friendly Floating Bot** by **sukeycool**, used unchanged under **CC BY 4.0**. The user prefers a soft robot and explicitly rejected Candidate C. Candidate A cannot meet the quality brief; its completed specification is preserved in [Candidate A state design](avatar-state-design-candidate-a.md). No candidate has human visual approval.

This specification records the D composition. All six mappings are **PARTIAL** after actual individual-state rendering review: each has a visible behavior, but substantial artistic or semantic limitations remain. An authored prop or arm pose does not prove that a person recognizes its conversational meaning. Final observations belong in [the product review](avatar-deep-review.md).

## Verified material and composition

The original file is 139,255 bytes, SHA-256 `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`. See [provenance](third-party-assets.md), [capabilities](friendly-floating-bot-capabilities.md), [inspection](friendly-floating-bot-inspection.json) and [drawing audit](friendly-floating-bot-animation-audit.json).

Main artboard: `tyepx ai bot`. Native state machine: `Theme_SM`. Its four native controls are inspected, but this adapter uses **authored-only playback**. `Theme Light` establishes the original light appearance. The changing body clips are `Idle`, ` Receive`, `Receive loop`, `talking loop` and `welcome loop`. AMYU composes original loop material without creating artwork or editing the binary.

The state clips share a phase derived from elapsed semantic time at authored speed **0.2**, over the **29/24-second work range**. Idle uses its frame-one start offset. Sleep blends toward the measured closed-eye Idle progress **1/14**. Time continues through speech pauses, so energy changes do not restart the animation. Each frame restores the three overlay clips at their authored starting properties, reapplies the Idle baseline and then current overlays. Actual WASM history tests found latches without this reset; the reset clears retained hands, mouth, props and draw-order effects.

Reduced motion holds the main clip phase at **0.5** and multiplies speech gain by **0.3**; sleeping still converges to its closed pose. This does not freeze nested cube/particle animations, whose authored clocks advance independently. Welcome is applied last during Wave, and Receive/Talking gains are attenuated by one minus the Wave envelope so those poses do not mask the greeting.

No exported independent eyelid, mouth aperture, head or gaze control exists. Authored clips blink, but LocalLifeEngine cannot independently schedule this robot's lids. Therefore the controllable `blink` capability remains **UNSUPPORTED**. Body, face and eyelids share authored tracks. Pupil tracking, phonemes and ten independent expressions are not claimed.

## Six conversation states

### Idle — calm, alive, subtle

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Relaxed, soft, naturally blinking | Original visor eyes and embedded blinks; no independent lid shaping |
| Mouth | Quiet rest | Original neutral face; no numeric mouth channel |
| Head | Subtle living motion | Original head/body float only |
| Body | Calm float with restrained variation | Idle at speed 0.2; repetition remains a risk |
| Hands | Relaxed, neutral | Idle restores original arm placement |
| Movement energy | Low | Original movement; semantic breathing/posture fields are unmapped |
| Attention | Available without staring | No verified directed pupil control |
| Allowed idle behavior | Blinks and gentle float | Authored timing; independent local blink variation unavailable |
| Transition in | Release props and arms cleanly | Idle baseline before fading overlays |
| Transition out | Smoothly enter the selected behavior | State weights blend clips in a shared phase |

### Listening — focused on the user

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Attentive, not excessively wide | Original visor; no dedicated attention expression |
| Mouth | Quiet, receptive | No Talking overlay |
| Head | Calm attention toward the user | No independent lean, turn or gaze |
| Body | Stable and different from idle | `welcome loop` × listening weight ×0.9 |
| Hands | Natural attentive pose | Authored raised greeting hand cycles between outward palm and hand by face; may read as greeting rather than listening |
| Movement energy | Restrained, still alive | Shared float/phase, no separate listening tempo |
| Attention | Clearly communicate “I am listening” | Judge without the state label |
| Allowed idle behavior | Quiet blink and float | Embedded movement continues |
| Transition in | Settle into attention | Listening weight introduces greeting material |
| Transition out | Release the arm without latch | Listening fades while rest/next state restores channels |

### Thinking — inward processing

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Concentration or inward attention | No narrowed lids or redirected pupils |
| Mouth | Quiet rest | No speech overlay |
| Head | Thoughtful attitude | No independent thinking head pose |
| Body | Considered activity | `Receive loop` × thinking weight |
| Hands | Readable processing pose | One raised hand with the original cube/hologram |
| Movement energy | Controlled, below acting | Original authored motion |
| Attention | Processing rather than addressing user | Hologram represents computation; no inward gaze claim |
| Allowed idle behavior | Calm float and blink | Embedded authored timing |
| Transition in | Introduce processing smoothly | Receive mix rises in shared phase |
| Transition out | Clear prop/arm for neutral or speech | Receive fades; baseline and next state restore channels |

### Speaking — face and body communicate speech

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Natural expression while talking | Original eyes/blinks coupled to body timeline |
| Mouth | Changing robot speech mark with quiet pauses | Authored Talking trace; no aperture or visemes |
| Head | Restrained phrase emphasis | Coupled authored movement only |
| Body | Support speech without constant bounce | Talking mix = speaking weight × bounded speech energy while awake/speaking |
| Hands | Natural communication | Both Talking arms use the same gain as the face |
| Movement energy | Irregular syllables and pauses | 12s cadence with 28 varied pulses; coupling can exaggerate arm modulation |
| Attention | Engaged communication | No directed gaze |
| Allowed idle behavior | Retain float/blink | Shared phase continues during pauses |
| Transition in | No restart at each energy change | Phase follows elapsed time, independent of mix |
| Transition out | Quiet speech, return arms and face | Energy zero removes Talking and reveals Idle |

The original talking trace measures about 3.39–11.26 artboard units wide and 0.11–1.33 high across integer frames. This is a stylized visor speech mark. Small mouth size and coupled arms require honest visual assessment.

### Acting — purposeful active energy

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Alert task activity | Original visor, no separate purposeful expression |
| Mouth | Quiet purposeful face | Coupled Talking material includes the trace; can blur acting/speaking |
| Head | Directed work attitude | No independent head/target control |
| Body | Bounded purposeful activity | Receive × acting weight, plus Talking × acting weight ×0.58 |
| Hands | More active than thinking | Original hologram with two-hand emphasis |
| Movement energy | Moderate, controlled | Shared loop speed; no separate native task-action clip |
| Attention | Task-oriented | Props/hands supply the cue, not gaze |
| Allowed idle behavior | Subtle life | Embedded float/blink |
| Transition in | Distinguish from thought | Additional Talking material raises both hands |
| Transition out | Clear prop, trace and raised arms | Both overlays fade to Idle |

### Sleeping — clearly asleep and calm

| Field | Product target | D composition / limitation |
| --- | --- | --- |
| Eyes | Fully closed, natural robot shape | Hold measured closed-eye Idle progress 1/14 |
| Mouth | Quiet rest | Speaking guard removes Talking |
| Head | Calm rest | Held authored head/body frame |
| Body | Still or gentle breathing | Full-body hold; independent sleep breathing unavailable |
| Hands | Neutral | Overlays fade to original Idle arms |
| Movement energy | Very low | Static once sleep weight reaches one |
| Attention | Disengaged | No native pointer tracking applied |
| Allowed idle behavior | Quiet rest | No ongoing blink; full-body freeze remains a limitation |
| Transition in | Close and settle smoothly | Idle phase approaches closed frame; coupled movement requires review |
| Transition out | Reopen and resume calmly | Sleep fades to running Idle phase; watch for a phase jump |

Wake is a two-second Full State Demo phase, not a seventh semantic state. Click-to-wake uses awake/state semantics and requires rendered review.

## All ten emotions

| Emotion | D representation | Reason |
| --- | --- | --- |
| neutral | SUPPORTED baseline | Original neutral robot face |
| happy | UNSUPPORTED | No independently verified happy expression |
| excited | UNSUPPORTED | No independently verified excited expression |
| curious | UNSUPPORTED | No independently verified curiosity or head tilt |
| concerned | UNSUPPORTED | No verified concern/brow/frown controls |
| surprised | UNSUPPORTED | No independently verified surprise expression |
| empathetic | UNSUPPORTED | No independently verified empathy expression |
| amused | UNSUPPORTED | No independently verified amused expression |
| focused | UNSUPPORTED | No independently verified focus expression |
| confused | UNSUPPORTED | No independently verified confused expression |

Do not relabel state poses as emotion support. Unsupported semantic inputs remain explicit in the review UI.

## All seven gestures and interaction

| Gesture | D representation | Limitation |
| --- | --- | --- |
| wave | Authored greeting mapped | Envelope sin(π×progress) × intensity; Welcome applied last, other state overlays attenuated to reveal it; listening already uses Welcome, so its additional wave cue is small |
| nod | UNSUPPORTED | No verified mapping |
| shake_head | UNSUPPORTED | No verified mapping |
| head_tilt | UNSUPPORTED | No verified mapping |
| bounce | UNSUPPORTED | Continuous float is not a discrete bounce gesture |
| celebrate | UNSUPPORTED | No verified mapping |
| shrug | UNSUPPORTED | Two speaking arms do not establish a shrug |

Click requests only available gestures; repeated requests coalesce. Hover cannot independently control smile, pupils or head on D. Native pointer capability and clip names do not establish gaze tracking. Interruption/return quality belongs in the product review.

## Repeatable review and approval gate

QA runs Full State **38s**, Speaking **12s**, Eye/Blink **20s**, Transition Stress **113s with Wave / 92s without**, and the available Gesture Demo. Forced Eye/Blink inputs remain unmapped on D; the panel must not imply an independently driven eyelid sequence works.

Full State: idle4/listening5/thinking5/speaking10/acting4/sleeping5/wake2/idle3. Stress includes the nine requested edges, ten idle/listening pairs, rapid listening/thinking/speaking at 500ms, and ten speaking/idle, thinking/idle and supported wave/idle pairs. Several-minute actual idle observation is separate from simulation.

Each state, gesture, interaction and limitation must be judged on the rendered robot. See [the product review](avatar-deep-review.md). No onboarding or other product stage starts before explicit user visual approval.
