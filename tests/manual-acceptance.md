# Avatar Lab manual acceptance

Record OS, browser/webview, asset version, runtime version, date, observer, duration and outcome beside each completed check. Unchecked entries are pending. Pure automated tests are not a visual acceptance record.

## Current correction gate — not accepted

The generated developer avatar was rejected for product quality. This correction uses actual researched third-party artwork and preserves the core architecture. Browser Avatar Lab is sufficient for the current selection; native 4551 is documented and is not addressed here. All observations below require new evidence for the third-party candidate. Earlier developer-rig smoke results do not satisfy this gate.

- [ ] Confirm the primary demo loads the actual downloaded `expressive-floating.riv` with visible creator/license attribution; the generated rig is not the primary character.
- [ ] Confirm inspected `Artboard` / `State Machine 1` and boolean `isTalking` / `isListening` are used rather than guessed controls.
- [ ] Play `PLAY SPEAKING DEMO` for exactly 8s with changing synthetic energy and brief rests; judge dynamic mouth/talking motion rather than numeric telemetry. Confirm the silent/no-audio note and zero energy at completion.
- [ ] Compare energy 0, 0.3, 0.7 and 1 during the actual talking sequence. Mouth rests at zero; movement scales naturally where animation modulation permits; record the exact limitation if no continuous parameter exists.
- [ ] Play `STATE DEMO` for exactly 15s: idle 2s, listening 3s, thinking 3s, dynamic speaking 5s, idle 2s. Repeat it and check clean cancellation/reset, including readiness, render failure, leaving Studio and paused stopping.
- [ ] Inspect thinking → idle, wave → idle and speaking → idle for residual/latching poses; distinguish native asset controls from AMYU-authored timeline composition.
- [ ] A human observer identifies listening versus idle without reading labels.
- [ ] A human observer distinguishes thinking from idle and listening through the body/face.
- [ ] A human observer identifies speaking and accepts the visible mouth/talking motion.
- [ ] Verify actual blink playback; test gaze/head/pointer response only where an inspected mapping supports it. Unsupported/unknown features remain clearly identified.
- [ ] Review appearance as well as technical capability. Candidate B was actually inspected but not integrated because no mouth/talking clip or energy control was exposed. Record whether preferred Candidate A's native mouth-only Listening cue and separately composed hand pose are acceptable.
- [ ] Record the ten actual correction screenshots: idle, listening, thinking, speaking at 0/0.3/0.7/1, blink, wave and Hebrew, with the repeatable local demo path in the [correction report](../docs/avatar-correction-report.md).
- [ ] Run existing architectural tests, lint, typecheck and both frontend builds; preserve any failures honestly.
- [ ] Ask the user: does it look alive; are listening, thinking and speaking clear; is the mouth acceptable; is supported gaze natural; is the appearance good enough to continue?
- [ ] Record explicit user visual approval before starting onboarding. A “no” for listening, thinking, speaking or mouth leaves the milestone incomplete.

## Broader browser and artwork checks

Apply continuous-control checks only to assets that actually expose the relevant controls. Capability gaps must be recorded rather than simulated as passing behavior.

- [ ] Load without API credentials; verify the actual Rive canvas renders and no remote asset request is needed.
- [ ] Reload repeatedly; resize; unmount/remount; verify one animation loop and no retained runtime listeners.
- [ ] Observe idle for a full minute; perceive calm life rather than a repeated loop.
- [ ] Confirm varied natural blinks, subtle breathing, saccades and posture variation.
- [ ] Exercise all six conversation states including acting and sleeping; transitions converge smoothly.
- [ ] Sweep every emotion at 0, 0.35, 0.95 and 1; intensity remains visibly continuous.
- [ ] Sweep gaze pad corners/center; eyes move smoothly and head follows at lower amplitude.
- [ ] Verify eyes respond sooner than the head, the center dead zone avoids jitter, pointer departure eases to neutral, and idle tracking includes occasional bounded attention breaks.
- [ ] Move pointer toward/over/away from the character; hover and attention return behave naturally.
- [ ] Click once and repeatedly; reactions remain bounded and do not reset the permanent selected emotion.
- [ ] Trigger every gesture, repeat rapidly, reset during a gesture; no frozen pose remains.
- [ ] Set speech energy from 0 to 1 in speaking; mouth follows smoothly; reset/sleep stop it.
- [ ] Exercise local audio amplitude when available; playback proceeds independently of animation.
- [ ] Hide tab and resume; no large animation jump, burst of queued blinks or catch-up loop.
- [ ] Enable OS reduced motion; verify retained state feedback and reduced decorative motion.
- [ ] Hebrew default has correct RTL and English has LTR; numeric telemetry remains legible.
- [ ] Event history/metrics remain bounded; unavailable future metrics are not falsely zero.
- [ ] Simulate a missing/wrong `.riv` asset or binding; error is visible and recovery works.
- [ ] Inspect local `.riv` metadata; verify actual artboard/state-machine/input names/types are displayed and each feature's support is supported/unsupported/unknown without invented controls.
- [ ] Leave running for 30 minutes while exercising controls occasionally; record visual defects, console errors, FPS and resource trend.

## Windows 11 / Tauri — pending later validation

- [ ] Install Rust/MSVC/WebView2 prerequisites; build and launch the native lab.
- [ ] Confirm bundled Rive/WASM resources load without external endpoints.
- [ ] Confirm only diagnostics IPC is available to the lab window; reject ungranted native commands.
- [ ] Confirm production CSP blocks remote fetch and allows expected local IPC/WASM.
- [ ] Complete the same one-minute life check and 30-minute visual soak in WebView2.
- [ ] Verify the lab closes cleanly and native/frontend resources are released.

## Later desktop shell (not a current claim)

Transparent pet, always-on-top, dynamic click-through, drag persistence, multi-monitor safety, tray and focus-safe all-day presence require the later desktop shell checklist. They are not implemented in this normal lab window.

## Gate

The current corrective milestone is accepted only after the user approves the real third-party avatar visually. Passing automated tests is necessary engineering evidence but is not product acceptance. Browser selection can be reviewed while native 4551 remains blocked. Do not begin onboarding until explicit user visual approval; no realtime integration starts automatically. Native desktop and longer-session checks remain pending separately.

## Recorded browser smoke review — 2026-10-03

Historical developer-rig review: the user subsequently rejected its visible conversation states and mouth quality. Preserve these observations as runtime/history evidence; they are not acceptance of the current third-party correction.

Observer: Codex browser automation with visual canvas inspection. Environment: Windows 11, Codex in-app browser; browser engine version was not recorded. Runtime: Rive Canvas2D 2.44.0. Asset: original developer rig, 7,480 bytes, SHA-256 `967fa10c5f6cb8de08dc9c1f4bb4fbfe2ff8dbf4cf7edf75551432684851fca7`. This is a focused smoke review, not human qualitative acceptance or a timed 30-minute soak.

| Observation | Evidence and outcome |
| --- | --- |
| Real local Rive canvas loads without AI credentials | The current browser preview displays the bundled character; local WASM/asset imports are used |
| Happy and concerned expressions | Real canvas shows different curved mouth/brow presentation at intensity 1; hidden closed-mouth path was corrected and covered by an actual WASM draw-command regression test |
| Listening → thinking → speaking | Controls and state event history update locally; the selected emotion stays independent |
| Speech energy and sleep | Energy 1 visibly opens the mouth; sleep returns the energy control to 0 and clears awake |
| Click-to-wake | Clicking the sleeping character returns it to idle and awake, with a local reaction event |
| Direct controls and gaze | Mouth override/restore and keyboard gaze were exercised; pointer tracking is local to the stage |
| Asset metadata | Actual artboard/state machine and 23 number inputs appear; mappings are MAPPED; visemes are UNSUPPORTED and unavailable binding/state enumeration remains UNKNOWN |
| Languages | Hebrew RTL and English LTR were visually reviewed, including legible numeric telemetry |
| Runtime diagnostics | Selected live samples show about 60 fps and 16.7 ms intervals; no warning/error console entries were returned in the reviewed session. These samples are not a performance benchmark |

Historical developer screenshots: [English lab](../docs/screenshots/avatar-lab-english.jpg), [Hebrew lab](../docs/screenshots/avatar-lab-hebrew.jpg), [concerned expression](../docs/screenshots/concerned.jpg), and [asset inspector](../docs/screenshots/asset-inspector.jpg). Current third-party evidence belongs in the [correction report](../docs/avatar-correction-report.md). The broader checklist remains pending where the entire stated check was not completed. Native tests and the human life/soak gates remain open.
