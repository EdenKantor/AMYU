# AMYU

Desktop-first embodied companion foundation. The current milestone is **Avatar Correction / Replacement — awaiting human visual approval**. The browser lab now loads an actual third-party Rive character and provides repeatable silent conversation demos. The earlier generated developer character was rejected for visual quality and remains a test fixture only.

AMYU is the product/runtime name. A future onboarding flow lets the user choose the companion's personal name. Onboarding is paused until the user explicitly approves this avatar milestone.

## Prerequisites

- Node.js **22.12 or newer** and **pnpm 11.19.0**, pinned in `packageManager`.
- Browser with WebAssembly and Canvas support. Web Audio is used only by the separate audio boundary, not by the silent avatar demos.
- Native Windows 11 development additionally needs Rust, Microsoft C++ build tools and WebView2. Follow [Tauri's official prerequisites](https://v2.tauri.app/start/prerequisites/). Native validation is outside this corrective milestone.

## Install and review

From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173`. Hebrew with RTL is the default; English is available in the lab.

- **Play speaking demo** runs for **8 seconds**, with changing synthetic energy and brief rests, then returns to idle with energy zero.
- **State demo** runs for **15 seconds**: idle 2s → listening 3s → thinking 3s → speaking 5s → idle 2s.
- These are silent visual demos: no audio playback, AI account, microphone or provider connection.
- State, emotion, energy, awake, reduced motion, supported gestures, pause/reset, event history and JSON exports remain available. Unsupported artwork controls are disabled or reported explicitly.
- The rig inspector shows actual asset names, input types, authored animation mappings, attribution and the supported/unsupported/unknown capability matrix. Missing mappings report `UNMAPPED`.

The current asset exposes two native booleans, `isTalking` and `isListening`. AMYU also mixes inspected authored thinking, talking, wave, mouth and eye timelines. Listening combines the native mouth cue with a held authored wave frame, raising a hand near the head/shoulder. Energy changes the weight of authored talking motion; it is not a discovered continuous mouth parameter. **Gaze and head follow are unsupported by this adapter**, so pointer telemetry does not imply visible character tracking.

See the [avatar correction report](docs/avatar-correction-report.md) for the demo procedure, current limitations, inspection and screenshot review. Agent review and automated tests do not replace the user's visual acceptance.

## Validate and build

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm build` builds browser and desktop frontend assets; it does not compile Rust. The [build report](docs/build-report.md) records validation status. Final corrective verification and human review are separate gates.

The historical `pnpm character:build` command regenerates the original developer test fixture. It is not part of the current replacement workflow and does not create or modify the third-party character.

## Native scaffold and recorded blocker

The same shared lab has a Tauri entry point:

```powershell
pnpm dev:desktop
pnpm --filter @amyu/desktop native:check
pnpm --filter @amyu/desktop native:test
pnpm build:desktop
```

The native frontend uses strict loopback port **1420**. This scaffold opens a normal lab window. Installer bundling is disabled.

The earlier native attempts used a contained Rust installation in the original generated development workspace. Formatting passed; Windows Application Control blocked dependency DLL/build-script loading with Win32 error **4551**, and no executable was produced. The current source package does not include that scratch toolchain. Preserve the [native validation record](docs/native-validation.md); this avatar correction does not rerun native work or alter host policy.

On Windows, the optional wrapper uses a contained toolchain under this repository's ignored `work/rust` directory when present, or an existing global Rust toolchain:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File apps/desktop/native.ps1 dev
```

It also supports `build`, `check`, `test` and `fmt`. It installs nothing, changes only process environment variables and restores them on exit.

## Character and attribution

The current default is `assets/character/third-party/expressive-floating.riv`: **Expressive Floating Character Rig (Old Work Share)** by **kouidero**, downloaded 2026-10-03, **66,484 bytes**, with no artwork/file modifications. The source's license link resolves to **CC BY 4.0**. See [asset attribution and license](assets/character/third-party/README.md), [third-party provenance](docs/third-party-assets.md) and [actual inspection](docs/expressive-floating-capabilities.md).

The temporary prototype mascot is not the AMYU production identity. AMYU does not claim ownership of this third-party artwork. A final original production character remains a separate art deliverable.

## Repository and boundaries

```text
apps/       avatar-lab, desktop (Tauri/Rust), api (reserved)
packages/   avatar-contract, protocol, embodiment, avatar-rive,
            audio, observability, shared-ui
            companion-core, conversation, vision, memory, skills,
            capabilities, permissions, connectors, user-profile (contracts only)
providers/  mock-live, gemini-live, openai-live, mock-vision (reserved)
skills/     companion, desktop-vision, calendar, email (reserved)
assets/     character, audio
evals/      conversation, memory, embodiment, skills (reserved)
docs/       architecture, contracts, provenance, roadmap, ADRs and validation
tests/      manual-acceptance.md
```

Semantic intent feeds the deterministic `EmbodimentDirector`; the artwork adapter maps its independent pose to verified Rive controls and timelines. React presents controls and diagnostics. The correction keeps `AvatarController`, local life, `GazeController`, renderer inspection and contract tests independent of this asset.

Start with [architecture](docs/architecture.md), [avatar contract](docs/avatar-contract.md), [embodiment](docs/embodiment.md), [Rive specification](docs/rive-character-spec.md), [asset replacement](docs/avatar-assets.md) and [roadmap](docs/roadmap.md). Major decisions are in [ADRs](docs/adr).

## Scope and approval gate

There is no live/mock conversation, provider integration, memory persistence, onboarding, screen/camera capture, Skills UI, accounts or executable OS tool. Transparent desktop presence, tray, drag/position persistence, global cursor tracking and multi-monitor safety are later work.

Candidate A is selected for human review after actual Candidate B evaluation: B exposes no mouth/talking animation or energy control and was not integrated. A's native Listening animation affects only five mouth paths and provides no head/eye/body cue; AMYU adds a held `Waving` frame at 30% progress and 80% mix. Root agent review found this visibly distinct from idle and the original thinking hand-to-chin pose clear, but human readability/approval remains pending. Authored idle/start-pose restoration addresses earlier thinking/wave/speech pose latching. Continuous mouth amplitude, full emotion blend, gaze/head follow, visemes and six gestures are unsupported by the current adapter; blink and wave are supported after browser verification of actual eye closure/opening, an autonomous blink, authored waving and neutral return. The capability panel preserves these limits.

The user must judge idle life, readable listening/thinking/speaking and acceptable mouth movement using the browser demo. A rejection of listening, thinking, speaking or mouth keeps the milestone incomplete. Record approval in [manual acceptance](tests/manual-acceptance.md). Onboarding and native corrective work remain paused; this correction is prepared for the user-requested GitHub push.
