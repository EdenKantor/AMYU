# Avatar correction build report

Report finalized: **2026-10-04**. Current milestone: **Avatar Correction / Replacement — not accepted; awaiting human visual approval**. The browser lab now uses the actual unmodified Expressive Floating Character Rig by kouidero. The earlier generated developer character was rejected for visible conversation and mouth quality and remains a contract/test fixture only.

This report supersedes the earlier developer-character readiness claim. Existing foundation work and the previously completed GitHub push are preserved. The user requested a GitHub push of this corrective work. Onboarding and native build work remain outside this milestone.

## Result and remaining review

Candidate A is the default real Rive canvas asset and is selected for human review after actual Candidate B evaluation. B exposes no mouth/talking animation or energy control and was not integrated. Root agent browser review observed appealing open eyes, a distinct authored thinking hand-to-chin pose and dynamic speaking mouth movement. These are agent observations, not user acceptance. A's native Listening animation affects only five mouth paths and provides no head/eye/body cue, confirmed without the open-eye overlay. AMYU composes a held wave frame to raise a hand near the head/shoulder; root found it visibly different from idle. Human interpretation and approval remain pending.

The lab exposes an **8-second silent speaking demo** and a **15-second state demo**. Dynamic energy must visibly change the authored talking motion, with a resting mouth at zero. The user must approve listening, thinking, speaking and mouth quality before onboarding.

See the detailed [avatar correction report](avatar-correction-report.md), [actual capability inspection](expressive-floating-capabilities.md), [asset provenance](third-party-assets.md) and [manual acceptance gate](../tests/manual-acceptance.md).

## Preserved architecture

- `AvatarController` keeps six states, ten emotions, seven gestures, weighted gaze, speech energy and awake control. No companion personal name is hard-coded.
- `EmbodimentDirector`, deterministic local life and `GazeController` remain independent of Rive artwork. A feature in the semantic frame is not automatically a visible capability of this replacement asset.
- The Rive renderer loads local artwork and matching WASM, inspects actual artboards/state machines/inputs/timelines/ViewModels, reports typed mappings and explicit capabilities, and releases runtime resources on disposal.
- Missing or wrong-type inputs and absent authored timelines report `UNMAPPED`; unsupported features do not silently substitute generated artwork.
- The shared React lab keeps Hebrew default/RTL, English, state/emotion/intensity/energy controls, awake/reduced-motion, pause/reset, bounded history and JSON exports. Unsupported current-asset controls are disabled or explicit.
- Protocol schemas and reserved future package boundaries remain. The separate audio boundary supports amplitude envelopes and a future viseme interface; the current demos do not produce audio.

No provider connection, conversation implementation, microphone/screen/camera capture, memory storage, onboarding, Skills UI or OS tool was added.

## Actual Candidate A and composition

File: `assets/character/third-party/expressive-floating.riv`, **66,484 bytes**, downloaded **2026-10-03**. SHA-256: `cdef4cf409850321d28e31e5cd8c4e12ee27072f1da609e4b3c216e709cc3f62`. The bytes/artwork are unmodified.

| Inspection | Actual result |
| --- | --- |
| Artboard / state machine | `Artboard` / `State Machine 1` |
| Native state-machine inputs | Two booleans: `isTalking`, `isListening` |
| Number / trigger inputs | None exposed |
| Authored timelines | 18, including `Listening`, `Talking`, `Thinking`, `Waving`, mouth and eye poses |
| ViewModels | None reported |
| Complete state/layer and binding-target graph | UNKNOWN; runtime enumeration limits |

The adapter drives the two native booleans, then composes verified authored idle, thinking, talking, wave, resting/smiling/talking mouth and open/closed eye animations after native state-machine advancement. Thinking uses the inspected `Thinking` clip. Listening holds `Waving` at 30% progress with an 80% mix plus the native listening mouth cue; the raised hand is AMYU composition, not a native listening feature. Explicit `Talking` body playback accompanies speech; `Mouth-talk` loops its existing 30–60% open work range at speed 0.3 (about a half-second cadence), with its mix weighted by speech energy and a resting baseline at zero. Native talking is active only while awake, speaking and energy exceeds 0.01. This is playback/mixing of authored animations, not an authored numeric mouth-amplitude input.

An authored idle baseline and start-pose restoration for Thinking/Talking/Waving address the previously latched body properties on return to idle. Focused actual-runtime regressions passed; browser review and final consolidated checks passed.

A padded renderer crop uses uniform `Fit.contain` to improve presentation while preserving movement and shadow. It changes canvas framing only; the source file stays unchanged. Framing, composition and neutral-return regressions passed in final verification.

Gaze/head follow, continuous mouth amplitude, full emotion blending, visemes and six gestures are unsupported by this adapter. Blink and wave are supported after actual browser verification of eye closure/opening, an autonomous blink, authored waving and neutral return. Unexposed internal asset behavior stays unknown. See the [18 exact timeline names and evidence](expressive-floating-capabilities.md).

## Run and review

Use Node.js 22.12 or newer and pnpm 11.19.0:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173`. Select **Play speaking demo** for 8 seconds of synthetic energy with changing peaks and brief rests. It ends in idle with energy zero. Select **State demo** for idle 2s → listening 3s → thinking 3s → speaking 5s → idle 2s, totaling 15 seconds.

Both demos are **silent visual simulations**. They use no audio playback, microphone, AI or provider connection. Demo starts are disabled until Rive is ready; rendering failure or leaving Studio cancels them. Manual state/energy changes cancel an active demo; stopping/resetting restores zero energy. Pause freezes the caller-driven demo clock.

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm build` builds both frontend entry points, not the native executable. `pnpm character:build` is a historical developer-fixture generator and is not used for this replacement. Native commands remain documented in [README](../README.md).

## Verification status

**Final verification: 2026-10-04.** `pnpm check` passed: ESLint, TypeScript, 84 tests across 12 files, and both browser and desktop frontend production builds. Human visual approval remains pending.

| Check | Recorded status |
| --- | --- |
| Latest completed automated test run | 84 tests passed across 12 files |
| Final corrective ESLint / TypeScript / Vitest / both frontend builds | Passed: ESLint, TypeScript, 84 tests, both frontend production builds |
| Actual third-party file discovery | Verified with Rive 2.44.0; [JSON record](expressive-floating-inspection.json) |
| File provenance / integrity | CC BY 4.0 attribution preserved; unmodified binary hash recorded |
| Mouth energy 0, 0.3, 0.7, 1 | Actual vector draw-command tests distinguish rest and authored motion; human quality approval pending |
| Demo duration and lifecycle | Automated coverage for 8-second speaking, 15-second phases, rests and zero-energy completion |
| Browser visual review | Root observed open eyes, distinct Thinking, composed listening hand cue and dynamic speaking; human interpretation/approval pending |
| Corrective screenshots | Ten requested images plus a live state-demo speaking frame captured before the user waived further screenshots |
| User visual acceptance | Not received; milestone remains incomplete |
| Native debug check / release build | Historical Windows Application Control blocker, Win32 **4551**; not rerun here |
| Native execution / ACL / CSP / WebView2 / native soak | Not verified; no executable produced |

Foundation tests also cover semantic contracts, capability states, event/tool schemas, deterministic replay/30-minute simulated output, local life, gaze timing, sleep/wake, gestures, amplitude envelopes, metric/log bounds and native IPC schemas. They establish architectural behavior, not acceptable visible conversation, rendered human soak or native operation.

Lab latency samples measure intent to the next director frame: `avatar_state_latency_ms` and `affect_latency_ms` stop in `LabSession.tick`, before Rive applies/draws. They do not measure completed rendering, live-provider response or speech/barge-in latency. FPS and Rive advance/draw timing are separate.

## Artwork and visual evidence

The temporary prototype mascot is not the AMYU production identity. **Expressive Floating Character Rig (Old Work Share)** is by **kouidero**, licensed **CC BY 4.0** via its [official source page](https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/). See [attribution/license](../assets/character/third-party/README.md). Other researched marketplace files have not been imported.

The [correction report](avatar-correction-report.md#screenshot-review-set) lists idle, listening, thinking, four speech-energy levels, blink, wave and Hebrew screenshots. Existing captures are included; the user waived further screenshots. They are evidence from the browser, not human acceptance or native validation. Earlier developer screenshots are historical and must not represent this replacement.

The future configurable production contract remains 33 controls: 18 numbers, five booleans and ten triggers. It is a separate target, not a description of Candidate A's two booleans. Final original production art and its reviewed adapter/rights remain later deliverables.

## Native history and next gate

Earlier native attempts ran in the original generated development workspace with a contained Rust toolchain. Rust formatting passed; Windows Application Control blocked dependency DLL/build-script loading with error 4551. No executable was produced, no policy was disabled/bypassed, and that scratch toolchain was not copied into the current source package. Preserve the exact [native validation history](native-validation.md).

**The current gate is explicit human approval of the browser avatar.** Native 4551 is outside this correction; browser review is sufficient for asset selection. A “no” for listening, thinking, speaking or mouth keeps the milestone incomplete. If Candidate A is unsuitable, test actual Candidate B (AI Orb) and then Candidate C (Interactive Character Rig), preserving attribution and unknowns. Do not replace it with another generated placeholder.

Onboarding remains paused. No realtime AI, vision, memory, Skills, connectors or native policy work starts automatically.
