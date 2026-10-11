# AMYU manual acceptance

Updated **2026-10-10**. Record observer, date, OS/browser, exact asset/runtime, elapsed duration and result for each completed visual check. A checked review item means the review was performed, not that its artistic result passed. An unchecked box is pending. Automated values are not proof of rendered quality.

## Current milestone — Windows Desktop Pet Shell

The user's revised milestone authorizes native Pet Shell implementation with the existing robot and keeps Avatar Lab separate. It supersedes the earlier restriction on native work while preserving the avatar's known visual limits. Final production artwork approval and approval to start onboarding/providers are not implied.

Record current build and launch evidence in [native validation](../docs/native-validation.md) and [build report](../docs/build-report.md). Browser-preview checks must be labeled as browser checks. A workflow that compiles or starts a process does not by itself complete this native acceptance list.

### Native acceptance checklist

- [ ] Build the Windows EXE and installer with the exact source commit recorded.
- [ ] Launch the production EXE on an authorized Windows 11 desktop with Vite stopped; record OS, WebView2 version, artifact hash and observer.
- [ ] Confirm the main window is the compact Pet Shell, with the current robot visible and animated immediately after loading.
- [ ] Confirm transparent background, no normal title bar, and always-on-top behavior against another ordinary app window.
- [ ] Drag the top handle; confirm normal composer input remains usable and note any unwanted focus behavior.
- [ ] Resize with the bottom-right grip and S/M/L presets; verify readable composer, uncropped robot/props and bounded sizes.
- [ ] Close/relaunch after moving and resizing; verify both position and size restore.
- [ ] Check missing/malformed saved geometry, a disconnected monitor, negative monitor coordinates and different DPI settings; record which cases were actually tested.
- [ ] Toggle the compact composer, enter text, send with Enter/button, dismiss the reply, and verify the mic placeholder requests no access.
- [ ] Observe listening → thinking → speaking → idle in the native pet, including the explicit local placeholder reply and final quiet rest.
- [ ] Review acting, sleep, wake, avatar click, interruption by new input, and repeated sends for stale poses or speech energy.
- [ ] Open Avatar Lab from the DEV menu; confirm it has a separate decorated window, functional controls and independent lifecycle.
- [ ] Minimize/recover from the taskbar, close the pet, and check remaining lab/process behavior.
- [ ] Capture native pet, compact composer, resized pet and separate Avatar Lab evidence; identify browser images separately when used.
- [ ] Record reduced-motion and sustained native idle behavior for a stated observed duration.
- [ ] Obtain the user's review of this milestone before starting the next product stage.

### Frontend preview checklist

- [x] Confirm the port 1420 pet preview explicitly identifies itself as a browser preview.
- [x] Review the default, minimum and larger preview layouts, composer, menu, local mock flow, acting and sleeping. Browser review: 2026-10-11, default 360×460, minimum 300×360, larger 480×620; source demo controls no longer leak after clipping fix; Hebrew input accepted.
- [ ] Confirm the `?mode=lab` route and independent port 5173 Avatar Lab remain available.
- [x] Record screenshots and observed state/interaction outcomes without claiming native drag, persistence, transparency or always-on-top acceptance. See `docs/screenshots/pet-shell/browser-*.jpg`; `?mode=lab` was opened from the pet menu and inspected at 1200×900.

## Avatar review record — Friendly Floating Bot, unapproved as final artwork

Candidate A reached its visual ceiling. Candidate C was explicitly rejected by the user. The user prefers a soft robot, which authorizes evaluating D without granting visual approval. Original D artwork is unchanged: **Friendly Floating Bot by sukeycool**, **CC BY 4.0**, 139,255 bytes, SHA-256 `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`. Runtime: Rive Canvas **2.44.0**.

Actual findings and screenshots belong in [the product review](../docs/avatar-deep-review.md). The [state specification](../docs/avatar-state-design.md) describes the composed six-state behavior and its limits. The following records are from the earlier browser avatar review, not native Pet Shell acceptance.

- [x] Inspect the actual downloaded D binary, main artboard, ten main timelines, native inputs and theme ViewModel; record unknown binding/state-graph limits.
- [x] Preserve creator/source/license attribution and verify unchanged file size/hash.
- [x] Confirm the actual D canvas, correct attribution and explicit capability warnings at startup and after reset.
- [x] Review all six actual state appearances: idle, listening, thinking, speaking, acting and sleeping. All remain PARTIAL; label-free meaning is not established.
- [x] Run **Full State Demo, 38s**: idle4/listening5/thinking5/speaking10/acting4/sleeping5/wake2/idle3. Sampled transitions and final idle; acting also reviewed directly.
- [x] Run **Speaking Demo, 12s**: varied syllables, micro/phrase pauses, original speech trace and body motion, zero-energy rest and idle return. Sampled actual frames and completion.
- [x] Judge the actual trace at energy 0, 0.3, 0.7 and 1. Small trace and coupled arms remain a quality limit.
- [x] Run **Eye/Blink Demo, 20s** and observe original authored blink/closed sleep/wake shapes. Forced independent D eye/blink control remains unsupported.
- [x] Execute ten idle ↔ listening pairs in the completed stress run. Sampled raised greeting-hand composition remains semantically ambiguous.
- [x] Compare thinking's one-hand hologram with acting's two-hand hologram. Acting's faded shared prop and speech trace weaken distinction.
- [x] Check sleep has visibly closed eyes and a quiet face; judge the full-body hold and wake phase transition. Settled sleep after 2.2s has fine closed lines; the body freezes without breathing.
- [x] Complete the **113s stress test with Wave** after the final fixes: nine initial edges, ten idle/listening pairs, rapid L/T/S at 500ms, ten speech/idle, thought/idle and wave/idle pairs. Observations are sampled, not a continuous video review.
- [x] Inspect for stuck arms, mouth, lids, props, draw order and body pose in sampled transitions and final neutral pose. Final rest is clean; rapid blended transitions remain visually busy.
- [x] Run the **20.4s Wave Gesture Demo** from idle, listening, thinking and speaking, including interruption and return. Post-fix run completed; direct thinking/speaking captures verify priority, final idle clean. Listening's extra Wave cue is weak.
- [x] Keep nod, shake-head, tilt, bounce, celebrate and shrug unsupported unless actual authored evidence and visible review justify a change.
- [x] Observe a sustained Idle run for **3m02s**, visible clock **46:08 → 49:10**. Sampled motion repeats the approximately six-second float; final pose is clean. This is actual browser time, not simulation or a continuously watched 49-minute soak.
- [x] Review pointer presence, one click, ten repeated clicks and click-to-wake. Greeting returns cleanly; no independent hover, gaze or head-follow mapping is claimed.
- [x] Classify all ten emotions. Current D has neutral baseline only; the other nine have no verified distinct expression.
- [x] Capture all six actual state frames and provide repeatable demos; stills do not establish motion quality.
- [ ] Verify pause/reset/cancel, leaving Studio, rendering failure/retry and candidate changes clear stale demos and overrides.
- [x] Directly exercise D pause/resume and Reset, with neutral restored. Earlier server-down fetch failure recovered after restarting Vite and reloading. The broader combined lifecycle item above remains separate.
- [x] Run current lint/typecheck/tests and both frontend builds: final post-fix **pnpm check PASS, 112 tests / 16 files**, including eight actual-WASM D tests and seventeen session tests.
- [ ] Obtain explicit user visual approval of the model and all requested state behavior before onboarding.

## Broader browser checks

Apply a control check only when the active artwork supports it; otherwise record the capability gap.

- [ ] Load/reload without credentials or remote asset requirements; confirm one rendering loop and cleanup on unmount.
- [ ] Resize the stage; original robot/props remain visible within its presentation crop.
- [ ] Hide and resume the tab; avoid large jumps, queued blink bursts or catch-up loops.
- [ ] Review reduced motion, Hebrew RTL/English LTR, legible numeric diagnostics and bounded history.
- [x] D reduced-motion main pose holds across separated samples and speech gain decreases. Returning the viewport to normal narrower size retains robot, attribution and QA controls. No claim that nested props stop or that a new RTL review was performed.
- [ ] Exercise missing/wrong asset recovery and explicit missing-binding diagnostics.
- [ ] Record a 30-minute real browser soak separately if performed; simulated duration is not a rendered soak.

## Recorded historical results

[A/C product review](../docs/avatar-deep-review-candidate-a.md) records A's 18-timeline audit, 38s state demo, 12s speech, 20s eye demo, 113s stress, 20.4s Wave and 3m25s actual idle review. A's listening failed and speech remained partial. C's original rendering and activation were observed before the user rejected its look. These checks do not approve D.

The original developer-rig smoke review and earlier corrective screenshots remain historical in [the previous correction report](../docs/avatar-correction-report.md). Neither is acceptance of the current robot.

## Historical Windows record

The earlier avatar-only milestone did not include native acceptance and recorded Windows Application Control error 4551. The revised native milestone now includes Pet Shell build/launch, bundled resources, drag/resize and saved geometry. Read the current [native validation record](../docs/native-validation.md) for the latest outcome; do not infer it from the old avatar review. Tray and dynamic click-through remain deferred.

## Approval record

**The user authorized the native Pet Shell milestone using the current prototype; no final artwork approval is recorded.** Record the user's actual milestone decision and any remaining visual conditions here. Onboarding, providers, voice, memory, vision and other product stages remain paused pending a separately approved next stage.
