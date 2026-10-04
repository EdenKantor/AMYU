# Avatar correction / replacement — ready for human review

Report finalized: **2026-10-04**. Milestone status: **NOT ACCEPTED — explicit user visual approval is pending**. Candidate A is the current browser default and is selected for human review after actual Candidate B evaluation.

The earlier generated developer avatar was rejected for visible conversation and mouth quality. It remains an architecture/contract fixture only. The corrective workflow uses actual downloaded third-party Rive files, inspects them before mapping, and preserves the existing runtime architecture. Onboarding and native corrective work remain paused. The user has requested that this correction be pushed to GitHub.

## Current artifact and provenance

Current default: **Expressive Floating Character Rig (Old Work Share)** by **kouidero**.

| Field | Recorded value |
| --- | --- |
| Local binary | `assets/character/third-party/expressive-floating.riv` |
| Official source | [Rive marketplace page](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/) |
| Actual download | [Official runtime file](https://public.rive.app/community/runtime-files/25311-47232-expressive-floating-character-rig-old-work-share.riv) |
| Download date | 2026-10-03 |
| Size | 66,484 bytes |
| SHA-256 | `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62` |
| License | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), verified through the source page's license link |
| File/artwork modifications | None; descriptive local filename only |
| Use | Attributed temporary prototype/development character |

Attribution is preserved in the [asset README](../assets/character/third-party/README.md), [license notice](../assets/character/third-party/LICENSE.md) and [third-party register](third-party-assets.md). AMYU does not claim ownership or creator endorsement.

**The temporary prototype mascot is not the AMYU production identity.**

## Actual file inspection

Inspection used the actual binary with Rive runtime **2.44.0**. The [JSON discovery record](expressive-floating-inspection.json) and [capability report](expressive-floating-capabilities.md) preserve the structure.

| Item | Actual result |
| --- | --- |
| Artboard | `Artboard` |
| State machine | `State Machine 1` |
| Boolean inputs | `isTalking`, `isListening` |
| Number inputs | None exposed |
| Trigger inputs | None exposed |
| ViewModels/properties | None reported |
| Timeline animations | 18 |
| Complete state/layer graph | UNKNOWN — not completely enumerable through the runtime API |
| Complete binding-target graph | UNKNOWN — not completely enumerable through the runtime API |

The 18 names are `idle`, `Empty`, `Listening`, `Talking`, `Waving`, `Thinking`, `DrawOrderLH`, `Mouth-talk`, `Mouth-smile`, `Mouth-normal`, `EYE-right-close`, `EYE-right-open`, `EYES-open`, `EYES-close`, `EYE-left-open`, `EYE-left-close`, `Blink-left` and `Blink-bottom-left`.

Timeline names and creator descriptions establish available material. They do not establish that AMYU listening, thinking or speaking is visually convincing.

## Native asset controls and AMYU composition

`AvatarController`, `EmbodimentDirector`, deterministic local life, `GazeController` and the renderer boundary remain. The semantic frame carries broader behavior than this artwork can display; unavailable controls are not invented.

| Behavior | Native asset control | AMYU adapter/composition |
| --- | --- | --- |
| Idle / floating | Existing state-machine playback | Preserve authored motion; open-eye baseline composed for presentation |
| Listening | `isListening` boolean and authored `Listening` timeline | Native cue is mouth-only. AMYU holds `Waving` at 30% progress / 80% mix to raise a hand near the head/shoulder |
| Speaking | `isTalking` boolean, `Talking` / `Mouth-talk` timelines | Native talking while awake, speaking and energy > 0.01; explicit authored Talking body loop; dynamic energy weights Mouth-talk's existing 30–60% work-range loop at speed 0.3 |
| Resting mouth | `Mouth-normal` timeline | Deterministic resting baseline, including energy zero |
| Limited smile | `Mouth-smile` timeline | Authored smile blend; not the full ten-emotion contract |
| Thinking | `Thinking` timeline, no dedicated inspected input | Mix the actual authored pose using semantic thinking weight |
| Wave | `Waving` timeline, no trigger input | Mix authored wave over gesture progress |
| Blink / sleeping eyes | `EYES-open`, `EYES-close` timelines | Compose open baseline and closing weight from the local eye frame |
| Gaze / head follow | No exposed input or ViewModel property | Unsupported; semantic telemetry is not visible tracking |

The renderer advances/applies the native state machine, applies deterministic authored-animation mappings, advances the artboard, then draws. Mappings and mix values are exposed in diagnostics. Missing names or mismatched types report `UNMAPPED`.

This is **playback/mixing of authored animation**, not discovery of a continuous mouth-amplitude parameter. Actual-vector draw-command tests distinguish rest at zero and changed authored mouth motion at 0.3, 0.7 and 1. Such tests do not prove pleasing pixel appearance or user acceptance.

A padded renderer crop with uniform `Fit.contain` improves framing while preserving sampled motion and shadow. It does not edit the original Rive file. Framing and transition regressions are part of the final checks.

## Visual findings and limits

Root agent browser review observed appealing open eyes and the authored **Thinking hand-to-chin pose**. Neither observation is human approval.

**Listening is a material limitation.** Actual inspection found that the `Listening` animation affects only five mouth paths and supplies no head, eye or body cue. This was checked without the AMYU open-eye overlay. The label/input can change correctly while the visual difference remains subtle. Candidate A must not be described as having a strong, ready or accepted listening state.

Authored idle playback and Thinking/Talking/Waving start-pose restoration address the earlier body-pose latch after thinking, waving and sustained speech. Focused actual-runtime regressions passed and root reviewed neutral return; existing screenshots are captured and the consolidated run passed. Repeatedly switch thinking → idle, wave → idle and speaking → idle during human review, and check that authored motion returns to the intended neutral baseline.

The current adapter marks gaze, head control, continuous mouth amplitude, full emotion blending, visemes and six other gestures unsupported. Blink and wave are supported after actual browser verification of eye closure/opening, an autonomous blink, authored waving and neutral return. Unexposed internal asset behavior stays unknown. Pointer tracking claims do not apply to Candidate A.

The AMYU-composed listening cue holds the existing `Waving` animation at 30% progress and 80% mix, alongside `isListening` and the actual Listening mouth contour. Root browser review observed an arm raised to the side near the head/shoulder and a visible difference from idle. It does not change the file or convert the native mouth-only Listening clip into a native head/eye/body feature. Human interpretation and approval remain pending.

Candidate B (AI Orb Mascot) was evaluated next in the requested order, using its actual 15,008-byte binary in ignored `work/ai-orb-mascot.riv`. It exposes no state-machine inputs; `ViewModel1` / `Instance` exposes `wrong`, `correct`, `jump` triggers and `loadingBoolean`, `typingBoolean` booleans. Its seven animations are `Lading` (actual spelling), `Idle`, `Typing`, `Correct`, `Wrong`, `Jump` and `Reveal`. No mouth/speaking/talking timeline or numeric energy control was found, so it does not meet the explicit mouth requirement and was not integrated. Its CC BY 4.0 source, download and integrity are recorded in [third-party provenance](third-party-assets.md).

Candidate A is selected for human review; Candidate C (Interactive Character Rig) remains a technical reference/fallback. User acceptance is not yet claimed. Do not silently replace an unsuitable or unavailable third-party file with generated artwork.

## Repeatable browser demos

Start from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173`. Hebrew/RTL is the default; select English if helpful for this review. Wait for the real Rive asset to load. Demo starts are disabled until the renderer is ready, and active demos are cancelled on rendering error or leaving the Studio view.

**Play speaking demo: exactly 8 seconds.** It uses a changing synthetic energy envelope with peaks and brief rests. Visible talking must change rather than holding an arbitrary open-mouth pose. Completion returns to idle and energy zero. Inspect energy 0, 0.3, 0.7 and 1 separately as well.

**State demo: exactly 15 seconds.**

| Time | Semantic state |
| --- | --- |
| 0–2s | Idle |
| 2–5s | Listening |
| 5–8s | Thinking |
| 8–13s | Speaking with changing synthetic energy |
| 13–15s | Idle |

These are **silent visual simulations**: no audio playback, microphone, AI account or provider connection. They do not validate lip synchronization against actual speech.

Manual state/energy changes cancel a demo. Pause freezes the caller-driven clock; resume continues it. Stop/reset returns speech energy to zero, including when paused. Repeat the sequence to inspect neutral return and residual poses.

## Verification record

**Final verification: 2026-10-04.** `pnpm check` passed: ESLint, TypeScript, 84 tests across 12 files, and both browser and desktop frontend production builds. Human visual approval remains pending.

| Evidence | Status |
| --- | --- |
| Latest completed automated run | 84 tests passed across 12 files |
| Final lint / typecheck / test / both frontend builds | Passed: ESLint, TypeScript, 84 tests, both frontend production builds |
| Actual binary discovery | Verified, stored in the inspection JSON |
| License / attribution / hash | Recorded; no binary/artwork changes |
| Authored mouth energy tests | Actual vector-command changes at 0, 0.3, 0.7 and 1 |
| Demo timing / cancellation / rests | Passed automated coverage; browser state demo observed Idle → Listening → Thinking → Speaking → Idle, with zero energy at completion |
| Agent browser findings | Open eyes, hand-to-chin thinking, dynamic speaking and visibly distinct composed listening cue observed; native listening limitation confirmed |
| Blink / wave visual verification | Verified actual eye closure/open return, autonomous blink, wave and neutral return |
| User acceptance | Not received |
| Native executable / runtime permissions | Not verified; historical host blocker preserved |

The deterministic 30-minute simulation checks finite/bounded semantic output and varied life behavior. It is not a real-time rendered 30-minute session or a human perception-of-life verdict. Measured state/affect latency ends at the next director frame, before Rive draw; it does not measure provider or speech response.

## Screenshot review set

The existing ten-image set and an additional speaking-demo frame were captured before the user waived further screenshots. No further screenshots are required for the requested push. Static speech frames show levels; use the live demo to judge temporal mouth motion.

| Review item | Existing screenshot | What to judge |
| --- | --- | --- |
| Idle | [idle.jpg](screenshots/avatar-correction/idle.jpg) | Open eyes, appealing framing, baseline |
| Listening | [listening.jpg](screenshots/avatar-correction/listening.jpg) | Readability despite mouth-only native cue |
| Thinking | [thinking.jpg](screenshots/avatar-correction/thinking.jpg) | Actual hand-to-chin pose |
| Speech energy 0 | [speaking-zero.jpg](screenshots/avatar-correction/speaking-zero.jpg) | Resting mouth, no stuck opening |
| Speech energy 0.3 | [speaking-low.jpg](screenshots/avatar-correction/speaking-low.jpg) | Low authored talking motion |
| Speech energy 0.7 | [speaking-high.jpg](screenshots/avatar-correction/speaking-high.jpg) | Higher visible motion |
| Speech energy 1 | [speaking-max.jpg](screenshots/avatar-correction/speaking-max.jpg) | Maximum still visually acceptable |
| Blink | [blink.jpg](screenshots/avatar-correction/blink.jpg) | Actual eye closing/open return |
| Wave | [wave.jpg](screenshots/avatar-correction/wave.jpg) | Authored motion and neutral return |
| Hebrew / RTL | [hebrew.jpg](screenshots/avatar-correction/hebrew.jpg) | Readable RTL lab, real asset and attribution |

Earlier generated-character screenshots are historical; they must not be presented as replacement evidence. Browser screenshots do not prove native execution or user acceptance.

## Human decision and stop gate

Review the real browser demo and record the result in [manual acceptance](../tests/manual-acceptance.md):

1. Does it look alive?
2. Can I tell when it is Listening?
3. Can I tell when it is Thinking?
4. Can I tell when it is Speaking?
5. Does the mouth movement look acceptable?
6. Does gaze feel natural? This asset has no exposed pointer-follow gaze controls; judge its authored eye behavior.
7. Does the asset look good enough to continue product development?

The agent considers this implementation ready for human visual review. This is not a declaration that the milestone has been accepted.

A **no** for listening, thinking, speaking or mouth means the milestone remains incomplete. Agent findings, screenshots, changing numbers and passing tests do not replace explicit user visual approval.

Browser Avatar Lab is sufficient for this selection gate. Native Windows Application Control error **4551** remains documented in the [native validation history](native-validation.md); no compile rerun, security bypass or host policy change is part of this correction. The source package does not include the old scratch Rust toolchain, and no native executable was produced.

Onboarding stays paused. No realtime provider, vision, memory, Skills or connectors begin automatically. A final original AMYU production identity remains a separate art and adapter deliverable.
