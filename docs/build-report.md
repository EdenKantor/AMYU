# Desktop Pet Shell build report

Updated **2026-10-13**. The revised milestone makes Pet Shell the native product entry point and retains Avatar Lab in a separate window/route. The current robot and renderer-independent architecture are preserved. No onboarding, provider, microphone stream, TTS, memory, vision or connectors were added. Implementation and Windows packaging are delivered; manual acceptance remains partial.

## Current milestone results

| Check | Result |
| --- | --- |
| Frontend lint, TypeScript, tests and production builds | **PASS**, 124 tests across 17 files; both frontends build |
| Native Rust formatting | **PASS** with the existing contained Rust 1.99.0 toolchain |
| Local debug native compile | **BLOCKED**, Application Control error 4551 on `generic-array` build script |
| Local native release / NSIS build | **BLOCKED**, Application Control error 4551 on `zmij` build script; frontend build passed |
| GitHub Rust compilation/tests | **PASS**, all 11 native tests in [run 38274777583](https://github.com/EdenKantor/AMYU/actions/runs/38274777583) |
| GitHub Windows packaging | **PASS**, release EXE and `AMYU_0.1.0_x64-setup.exe` built and uploaded in the same successful run |
| Production process smoke | **PASS**, AMYU native window created, process stayed alive, no Vite; packaged report explicitly excludes visual acceptance |
| Local launch of downloaded CI EXE | **PASS**, production `http://tauri.localhost/`, visible animated robot, no development server |
| Native visual/interaction acceptance | **PARTIAL**, composer/state flow, drag, large size preset, restart geometry and separate lab observed; remaining checks listed below |

## Download and provenance

- [Successful Windows workflow run](https://github.com/EdenKantor/AMYU/actions/runs/38274777583)
- [Windows EXE and NSIS artifact](https://github.com/EdenKantor/AMYU/actions/runs/38274777583/artifacts/11758464133), retained for 30 days by the workflow
- Source commit: `ba76f627e0873210cd4bebe81daaf80a599a14b1`. Subsequent documentation/evidence commits do not change this binary's source provenance.
- Artifact: `AMYU-Windows-x64-ba76f627e0873210cd4bebe81daaf80a599a14b1`.
- EXE SHA-256: `318ee19a8f4a4cda28c8a0e0f42e1a37299991cf4f482b1caf2f705bd803e0a0`.
- Installer SHA-256: `1dc0a2d8e736c98b0f4df1be69d9ece67f67f36a5444285f71e067969cedcd72`.

Downloaded files matched the packaged checksums. The portable EXE was launched locally; installer installation/uninstallation was not tested. This is an unsigned prototype artifact, not a published release.

## Observed native behavior and remaining acceptance

Codex inspected the production app through Windows Computer Use on October 12–13, 2026. The pet renders over the desktop with no normal title bar. Native typing, local listening → thinking → speaking → idle, and sleep/click-to-wake were observed. The handle changed the window origin from `(3053, 26)` to `(2943, 71)`. The L preset changed the native size from `373 × 455` to `480 × 620`. Closing and relaunching restored exactly `(2943, 71, 480, 620)`, matching the saved JSON.

Avatar Lab opened in a separate decorated production window, its sleeping control changed the rendered pose, and closing it left the pet running. Local compilation still fails with 4551; that does not prevent this host from running the downloaded CI EXE.

The bottom-right grip automation did not establish a resize; this remains unresolved rather than passed. Always-on-top is configured but foreground overlap has not been conclusively validated. S/M presets, taskbar recovery, native acting/interruption stress, multi-monitor/DPI hardware changes, installer behavior and sustained native idle/reduced-motion review remain pending. The UI helper eventually reported `coordinate input geometry is unavailable`, then `foreground window did not report a process id` during lab-window targeting; UI input stopped after the recovery failed. No app defect is inferred solely from those helper errors.

Native evidence: [pet](screenshots/pet-shell/native-pet.png), [composer](screenshots/pet-shell/native-composer.png), [thinking](screenshots/pet-shell/native-thinking.png), [speaking](screenshots/pet-shell/native-speaking.png), [return to idle](screenshots/pet-shell/native-return.png), [separate Avatar Lab](screenshots/pet-shell/native-avatar-lab.png). The [larger layout image](screenshots/pet-shell/browser-resized.jpg) is **browser evidence only**; no clean native resized screenshot was retained because the transparent capture included unrelated application content. The native size and restart observations above were still verified directly.

Recommended next milestone: **Windows Pet acceptance and polish**—resolve grip resizing, test remaining native interactions and monitor/DPI cases, then obtain user visual acceptance. Stop here for the user's decision; onboarding and providers remain separately gated.

Pet Shell uses a product `PetSession` with the existing EmbodimentDirector, LocalLifeEngine and Rive renderer. It provides a compact composer, explicitly local silent mock replies, six semantic states, sleep/wake, acting demonstration and a developer entry to Avatar Lab. The native layer owns bounded geometry, work-area/DPI restoration and debounced persistence. The pet window is configured transparent, frameless and always on top; native drag and resize use scoped Tauri APIs.

Visual inspection found the source Rive demo controls could leak outside the intended crop in a tall canvas. The renderer now clips to the framing rectangle as well as aligning it. Actual Rive/WASM regression coverage checks six states at four canvas aspect ratios, preview/reset and disposal. The downloaded asset is unchanged.

The [Windows workflow](https://github.com/EdenKantor/AMYU/actions/workflows/windows-build.yml) runs frontend checks, native formatting/tests, a locked release build, NSIS packaging and a production process/window smoke check. It uploads an EXE, installer, checksums and provenance; it does not publish a release. A process smoke check is not visual desktop acceptance.

See [Pet Shell behavior](pet-shell.md), [Windows build instructions](windows-build.md), [native evidence](native-validation.md) and the [manual acceptance checklist](../tests/manual-acceptance.md). Stop for user review after this milestone; do not begin onboarding or provider integration automatically.

## Historical avatar refinement report

Updated **2026-10-09**. Current work: **Friendly Floating Bot six-state prototype review**. D is now the default in the renderer and lab. No avatar has explicit human visual approval. Candidate A reached its practical ceiling; the user rejected C's model and prefers a soft robot. D uses original third-party Rive artwork without modifying its bytes.

See [the product review](avatar-deep-review.md), [state design](avatar-state-design.md), [D audit](friendly-floating-bot-capabilities.md), [provenance](third-party-assets.md) and [manual gate](../tests/manual-acceptance.md). The [previous correction report](avatar-correction-report.md) and [A/C review](avatar-deep-review-candidate-a.md) are historical evidence, not current acceptance.

## Preserved architecture and scope

- `AvatarController` retains six states, ten emotions, seven gestures, gaze intent, speech energy and awake control.
- `EmbodimentDirector`, deterministic local life and gaze intent remain independent of Rive artwork. A semantic frame field does not establish a visible capability.
- The Rive renderer inspects actual artboards, state machines, typed inputs, timelines and ViewModels. Missing mappings and unsupported controls remain explicit.
- Candidate adapters own authored composition and presentation framing. The downloaded artwork is unchanged.
- Shared Hebrew/RTL and English/LTR lab controls, bounded history, diagnostic exports and error handling remain.
- Development-only QA exposes state/speech/eye/stress/gesture demos, reset, actual animation mixes and unsupported warnings.
- No onboarding, provider, voice conversation, memory, vision, connectors or additional native desktop work was added.

## Active review implementation

Candidate D is **Friendly Floating Bot** by **sukeycool**, CC BY 4.0, downloaded 2026-10-05; **139,255 bytes**; SHA-256 `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`.

Its main artboard is `tyepx ai bot`, native state machine `Theme_SM`. Four state-machine controls and the `ThemeVM.Instance.isDark` property are actually exported. The adapter composes authored Idle, Welcome, Receive and Talking clips using authored-only playback and the original light theme. Uniform crop x=50–320/y=145–386 excludes the source demo buttons while retaining sampled character, shadow and props.

Listening uses a raised greeting hand, moving between outward palm and hand by the face. Thinking uses the one-hand hologram. Speaking uses the authored trace and arms modulated by the synthetic speech envelope. Acting combines hologram and two-hand emphasis. Sleeping holds the measured closed-eye frame. These are application compositions, with coupled body/eye/face tracks. They are not six independent native clips. No numeric mouth aperture, independent blink/eyelid driver, gaze, head follow, visemes or nine non-neutral emotions is claimed.

Actual WASM history tests exposed retained overlay properties; Welcome, Receive and Talking now reset their authored starting properties before the current composition is applied. Wave applies Welcome last and attenuates conflicting state overlays. A manual wake interrupts the active demo and explicitly resumes the session's remembered awake state, keeping UI and director state consistent (Acting during the Full State sleep phase). Reduced motion holds the main clip phase and reduces speech gain; nested authored props can keep moving.

## Run and repeat the review

Use Node.js **22.12+** and pnpm **11.19.0**:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173/`. D loads by default. A is labeled reference and C rejected in the development review picker. Actual observed quality is recorded in the product review.

| Demo | Timing and purpose |
| --- | --- |
| Full State | **38s**: idle4/listening5/thinking5/speaking10/acting4/sleeping5/wake2/idle3 |
| Speaking | **12s**, 28 varied synthetic syllable pulses, micro/phrase pauses, zero energy and idle at completion |
| Eye/Blink | **20s** semantic sequence; independent D eyelid control is unsupported, so it cannot prove a forced blink mapping |
| Transition Stress | **113s with supported Wave; 92s without**; nine initial edges, ten idle/listening pairs, rapid L/T/S at 500ms, repeated returns |
| Gesture | Only verified gestures; one supported Wave sequence lasts **20.4s** |

Demos are silent. They use no microphone, audio playback, account or AI connection. Readiness, cancellation, pause, reset and neutral return require both technical and rendered review.

## Verification status

The final consolidated check after the Wave-order and wake/demo-interruption fixes **passed**: ESLint, TypeScript, **112 tests across 16 files**, and production builds for the browser lab and desktop frontend. This includes **eight actual-WASM D tests** and **seventeen session tests**.

```powershell
pnpm check
```

This runs ESLint, TypeScript, Vitest and both browser/desktop frontend production builds. Frontend production output does not compile the native executable. Relevant regression coverage includes authored time/phase, baseline restoration, cadence and cancellation, reset semantics, supported-only gestures and actual WASM drawing behavior.

| Check | Current record |
| --- | --- |
| D original file integrity | Size/hash verified against the documented original |
| Actual runtime structure/controls | Recorded in D inspection and drawing audits |
| Current lint/typecheck/tests/frontend builds | PASS; 112 tests / 16 files, both frontend builds |
| D six-state browser review | All six sampled; Full State 38s, Speaking 12s, Eye 20s, Gesture 20.4s and post-fix Stress 113s completed; artistic quality remains PARTIAL. Detailed observation log in product review |
| Explicit user visual approval | Not received |
| Native executable | Historical Windows Application Control error **4551**; outside this milestone |

The historical Candidate A pass included complete timeline and eye audit, 38s states, 12s speech, 20s eyes, 113s stress, 20.4s gesture and 3m25s real idle observation. It still failed the requested listening/speech quality. This evidence illustrates why passing checks cannot grant visual acceptance.

Lab intent latency stops at the next director frame before Rive drawing. It does not measure completed rendering, provider response or live speech. FPS/advance/draw samples remain separate.

## Native history and next gate

Earlier native work used a contained Rust toolchain. Formatting passed, but Windows Application Control blocked DLL/build-script loading with error 4551; no executable was produced. No host policy was bypassed. Preserve [the native validation record](native-validation.md).

The current gate is explicit human approval of the actual browser avatar. Onboarding and all other product stages remain paused. Any remaining weak state, mouth or interaction must be stated in the product review before asking the user to judge the result.
