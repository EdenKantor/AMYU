# Friendly Floating Bot — runtime capability audit

Original runtime audit: **2026-10-06**; integration review updated **2026-10-09**. This is the original **Friendly Floating Bot** export by **sukeycool**, Candidate D, under **CC BY 4.0**. [Marketplace source](https://www.rive.app/marketplace/28071-53022-friendly-floating-bot/). The artwork has not been rewritten. SHA-256: `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`; 139,255 bytes.

This audit establishes actual runtime behavior. A passing technical probe does not approve appearance or prove six recognizable conversation states. See `friendly-floating-bot-inspection.json` for original export metadata and `friendly-floating-bot-animation-audit.json` for condensed measured evidence.

## Actual controls

Main artboard: `tyepx ai bot`; state machine: `Theme_SM`. The exported native controls are trigger ` Receive down`, number `Number 1`, and booleans `eceive` and `istracking`. The sole ViewModel property is `ThemeVM / Instance / isDark`; binding the default instance selects the authored dark theme. There are no exported numerical mouth, eye, head, or gaze inputs.

All four native buttons were exercised using their actual vector-drawing bounds. These observations establish the number choices rather than inferring ranges from labels:

| Actual operation | Observed state routing |
| --- | --- |
| Left button / Number 1 = 1 | `Idle` |
| Second button / Number 1 = 2 **and** fire ` Receive down` | ` Receive`, then `Receive loop` after approximately 2.43 seconds |
| Third button / Number 1 = 3 | `welcome loop` |
| Right button / Number 1 = 4 | `talking loop` |
| Number 1 = 2 alone | Does not leave Idle |
| `eceive = true` | Goes directly to `Receive loop` |
| `eceive = false` after true | Enters ` Receive`; it is not an idle-reset command |
| Number 1 = 1 after each body state | Returns to `Idle` |
| `istracking = true` | Selects `tracking off` |
| `istracking = false` | Selects `tracking on` |

The native buttons also set `istracking = true`. A ` Receive down` trigger alone from Idle did not enter Receive. Exact state-machine transition conditions are not fully enumerable through this runtime, so other combinations are not asserted.

## Authored material

The main artboard has ten timelines. `Theme_Dark`, `Theme Light`, `typex logo ai`, `tracking off`, and `tracking on` produce a static pose/configuration across seven sampled phases. The five changing body timelines are `Idle`, ` Receive`, `Receive loop`, `talking loop`, and `welcome loop`. Each body timeline contains 72 frames at 24 fps; its enabled work area ends at frame 29. Idle begins at frame 1; the other four begin at frame 0. Loop clips have authored speed 0.2; the Receive entry has speed 0.5.

All five body timelines include the same blink. At absolute frame 3 / 0.125 seconds, both white visor pills collapse from about 15.85 to about 0.95 artboard units high. Frame 20 repeats that closed pose. For Idle's enabled work area, frame 3 corresponds to progress **1/14**. Holding this authored pose can provide visibly shut robot eyes, but also holds the full body's authored phase. It is not independent eye control or a complete authored sleeping animation.

Idle and Receive loop have identical head-region drawing signatures at sampled frames 0, 3, 10, 20, and 29. Their distinction is principally arms and props, not a directed head or eye response. There is no verified independent thinking head pose. The installed runtime supports named bone/node access, but probing the actual names retained in this export resolved only the artboard root; no individually addressable head or eye component was found.

Talking adds a small white visor trace. In integer-frame samples, its width ranges approximately 3.39–11.26 units and height 0.11–1.33 units. This is a stylized robot speech mark, not a continuously bound mouth aperture or viseme rig. The talking and welcome artwork can be previewed and mixed as authored; product speaking quality must be assessed visually.

## Presentation and ceiling

The complete sampled robot, shadow, and active props fit within x=62.56–307.14, y=155.42–384.14. Native control buttons begin near y=389.48. A presentation crop of **x=50, y=145, width=270, height=241** retains those sampled visuals while excluding the author's button row. This is presentation framing, not a binary edit. Extreme native pointer interactions outside the authored timelines were not included in this crop measurement.

A six-state prototype can compose existing timelines and hold the closed blink pose, but this remains an application mapping. Listening, thinking, and acting do not become independent authored semantic capabilities merely through relabeling. There is no continuous mouth input, isolated eyelid input, verified emotion set, independent head tilt, or verified directed gaze. Distinctness, warmth, sleep movement, and speech legibility require the browser review and the user's visual approval. Candidate C was rejected; that does not constitute approval of this robot.

## Reproduction and scope

Read-only probes: `work/audit-friendly-floating-bot.mjs`, `work/audit-friendly-floating-bot-controls.mjs`, `work/probe-friendly-floating-bot-head.mjs`, and `work/probe-friendly-floating-bot-nodes.mjs`. They load the original `.riv` using the installed Rive WASM and record actual native state changes and Canvas2D vector draw geometry. The harness reports no WebGL support, so image meshes are outside its validation scope. Browser review remains necessary. No avatar artwork, dependency, application integration, or Git history was modified by these probes.

## Integrated review adapter — 2026-10-09

D is now the default renderer/lab candidate. The adapter uses **authored-only playback**, with `Theme Light` and `Idle` as baseline. The inspected native state machine and theme ViewModel are not bound to the active composition. Native control observations above describe the original export, not concurrent state-machine behavior in this adapter.

| AMYU behavior | Original material used | Quality limitation |
| --- | --- | --- |
| Idle | Idle at authored speed 0.2 | Repeating float and embedded blink |
| Listening | Welcome ×0.9 | Raised greeting hand cycles outward/by face; ambiguous attention |
| Thinking | Receive loop | One-hand hologram; no inward eye/head pose |
| Speaking | Talking × bounded speech energy × speaking weight | Tiny speech trace, side marks and arms coupled |
| Acting | Receive + Talking ×0.58 | Similar hologram with two hands; faded prop and speech trace |
| Sleeping | Hold Idle progress 1/14 | Fully closed lines, full-body freeze |
| Wave | Welcome applied last with gesture envelope | Thinking/Talking attenuated during gesture; extra cue weak during listening |

All six state quality classifications are **PARTIAL**. Neutral is supported; nine other emotions and six gestures besides Wave remain unsupported. Independent blink, pupil gaze, head following, mouth aperture and visemes remain unsupported. The timeline's embedded blink is real but cannot be scheduled by AMYU's separate blink fields.

The three overlays reset their authored starting properties before the baseline and current composition are reapplied. This fixes retained props, hands, mouth and draw-order properties found by actual-WASM history tests. Reduced motion holds the main phase at 0.5 and attenuates speaking gain to 30%; sleep stays closed. Nested props can still advance on their own clocks. Eight real-WASM integration tests validate the mapped drawings and restoration, separate from browser product judgment. See [the product review](avatar-deep-review.md) for actual captures, observation limits and the 21-feature matrix.
