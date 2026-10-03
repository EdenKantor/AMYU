# AMYU

Desktop-first embodied companion foundation. The current milestone is **Foundation + Avatar Lab**: a local Rive character with deterministic life, smooth state/affect, pointer attention, gestures, mouth energy and measured diagnostics. It runs without an AI account or API key.

AMYU is the product/runtime name. A future onboarding flow lets the user choose the companion's personal name. This development lab is not the finished companion first-run experience.

## Prerequisites

- Node.js **22.12 or newer** and pnpm (the repository pins pnpm in `packageManager`).
- Browser with WebAssembly, Canvas and Web Audio support for the browser lab.
- Native Windows 11 development additionally needs Rust, Microsoft C++ build tools and WebView2. Follow [Tauri's official prerequisites](https://v2.tauri.app/start/prerequisites/). macOS native validation is a later target.

## Install and run

From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173`. Hebrew is the default with RTL; switch to English in the lab. Six states, ten emotions, intensity, speech energy, gaze, awake control and seven gestures operate locally. Expand Direct rig controls to override head tilt, eye/mouth opening, smile and frown. The character follows the pointer in its stage and reacts to hover/click. Rig contract shows actual asset metadata, input types, current mapping and the supported/unsupported/unknown capability matrix; missing controls report `UNMAPPED`.

To launch the same lab in the native Tauri window after installing its prerequisites:

```powershell
pnpm dev:desktop
```

The native frontend uses strict loopback port **1420**. This milestone opens a normal lab window; the transparent floating pet, tray and focus/drag behavior come later.

On Windows, the wrapper can use an optional contained Rust toolchain under the repository's ignored `work/rust` directory. Rust is not included in the source repository. The recorded native attempts used a contained installation in the original development workspace; otherwise install the standard native prerequisites. When a contained toolchain is present, the wrapper sets only process environment variables and restores them when it exits:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File apps/desktop/native.ps1 dev
```

The same wrapper supports `build`, `check`, `test`, and `fmt`, and falls back to an existing globally available Rust toolchain. It does not install anything or change the user's permanent PATH.

## Validate and build

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm build` builds both browser and desktop frontend assets. It does not compile Rust. Native checks/builds require the native prerequisites:

```powershell
pnpm --filter @amyu/desktop native:check
pnpm --filter @amyu/desktop native:test
pnpm build:desktop
```

`build:desktop` compiles the native executable; installer bundling is disabled in this development scaffold. Regenerate the original temporary character with `pnpm character:build`. No provider connects during these commands.

## Repository

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
docs/       architecture, contracts, boundaries, roadmap and ADRs
tests/      manual-acceptance.md
```

Semantic events and local observations feed the deterministic `EmbodimentDirector`, which produces a renderer-independent pose. The Rive adapter alone maps that pose to numeric, boolean and trigger artwork controls. React presents controls and snapshots; model, platform and connector SDKs do not enter the animation path.

Start with [architecture](docs/architecture.md), [avatar contract](docs/avatar-contract.md), [embodiment](docs/embodiment.md), [Rive specification](docs/rive-character-spec.md) and [roadmap](docs/roadmap.md). Major decisions are recorded in [ADRs](docs/adr).

The [build report](docs/build-report.md) records the final 68-test validation, screenshots, native blocker and exact next-milestone readiness.

## Character asset

`assets/character/amyu-developer.riv` is an original generated developer rig with 23 continuous numeric controls. Artboard/state machine: `AMYU Developer`. It contains actual Rive vector artwork, not swapped expression images. See [asset provenance and replacement](assets/character/README.md) and [exact input ranges](assets/character/rig-manifest.json).

A final original production character remains an art deliverable. It must expose the face/body/gaze/mouth/gesture behavior in the [production specification](docs/rive-character-spec.md); its property names may differ because an adapter owns the mapping.

## Scope and known limitations

- No live/mock conversation, provider integration, memory persistence, onboarding, screen/camera capture, Skills UI, accounts or executable OS tools.
- Pointer awareness is inside the lab stage. Global cursor, transparent click-through pet, dragging, native position persistence, tray and multi-monitor safety are later desktop-shell work.
- The Rive artwork is a temporary developer design. Visual polish and the production rig need human review.
- Native attempts in the previous generated workspace used a contained Rust toolchain and formatting passed, but Windows Application Control blocked dependency DLL/build-script loading (error 4551). No executable was produced. That scratch toolchain was not copied into the current source package. See the [native validation record](docs/native-validation.md); frontend builds do not prove native execution or ACL behavior.
- A deterministic automated soak does not replace the required human one-minute life check and 30-minute visual session. Record those results in [manual acceptance](tests/manual-acceptance.md).

Stop after this milestone. Onboarding is the next planned milestone, gated by the validation record; realtime AI does not start automatically.
