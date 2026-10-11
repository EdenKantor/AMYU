# AMYU

AMYU is a desktop-first embodied companion. The current milestone builds the **Windows Desktop Pet Shell**: a compact floating robot, a small composer, and a silent local conversation demo. **Avatar Lab remains a separate developer surface.** The user's revised milestone authorizes native pet work with the existing prototype robot; it does not approve the artwork as AMYU's final identity.

The shell uses Tauri 2, React and the existing renderer-independent avatar architecture. No API key is required. Onboarding, AI providers, microphone streaming, TTS, memory, vision, Skills and Connectors remain out of scope.

## Run

Use Node.js **22.12+** and **pnpm 11.19.0**. Native Windows development also requires Rust, Microsoft C++ build tools and WebView2; see [Windows build instructions](docs/windows-build.md).

```powershell
pnpm install --frozen-lockfile
pnpm dev:desktop
```

The native main window is the **Pet Shell**. Its menu opens **Avatar Lab · DEV** in a separate, decorated window. For frontend-only development:

```powershell
# Pet Shell browser preview: http://127.0.0.1:1420
pnpm --filter @amyu/desktop dev

# Standalone Avatar Lab: http://127.0.0.1:5173
pnpm dev
```

The desktop frontend also serves the lab at `http://127.0.0.1:1420/?mode=lab`. The browser preview identifies itself explicitly; native movement, minimization and close controls require Tauri. Browser preview resizing does not establish that native resizing works.

## Pet interactions

- Use the top handle to drag the native window, the bottom-right grip to resize it, or **Pet options → Pet size** for presets. The default is 360 × 460 logical pixels; normal bounds are 300 × 360 through 560 × 700.
- Toggle the compact chat bar, type a message and send. A local sequence runs **listening → thinking → speaking → idle**, displaying a clearly labeled placeholder reply. There is no backend conversation or audio.
- Use **Take a nap / Wake up** and **Try a little movement** for sleeping and acting. Clicking the robot greets it or wakes it.
- The microphone button explains that voice is unavailable; it does not request microphone access.
- Native geometry persistence restores size and position with monitor work-area bounds. Transparency, framelessness and always-on-top are native window settings; their observed acceptance status is tracked separately from configuration.

See [Pet Shell behavior and limitations](docs/pet-shell.md), [native validation](docs/native-validation.md), and the [manual acceptance checklist](tests/manual-acceptance.md). The current build and validation results are in the [build report](docs/build-report.md).

## Validate and package

```powershell
pnpm check
pnpm --filter @amyu/desktop native:check
pnpm --filter @amyu/desktop native:test
pnpm build:desktop
```

`pnpm check` runs lint, TypeScript checks, tests and both frontend builds. It does **not** compile Rust. The Windows native build packages the Pet Shell and its local resources. The [Windows Build workflow](https://github.com/EdenKantor/AMYU/actions/workflows/windows-build.yml) provides an independent Windows build path and downloadable EXE/NSIS artifacts; it does not publish a GitHub release. Read the [Windows build guide](docs/windows-build.md) for prerequisites, output paths and the recorded Application Control / error 4551 issue.

## Avatar and developer lab

The current robot is **Friendly Floating Bot** by **sukeycool**, licensed **CC BY 4.0**. The original `.riv` file is unchanged: 139,255 bytes, SHA-256 `03cf8342c66171d7d5b09a00f363118d16528d372080cbb2d4b21f7d5147dc54`. Attribution stays available in the pet menu and [asset record](assets/character/third-party/README.md). This is a third-party prototype, not AMYU-owned production artwork.

All six semantic states use existing authored Rive timelines. Their quality limits remain explicit: listening resembles a greeting, speech has a small coupled mouth/arm route, thinking and acting share a hologram, and sleeping holds the body still. Independent gaze, head-follow, numeric mouth aperture and independent eyelid control are unsupported. Idle uses the source's authored float/blink motion. No new mascot has been substituted for this milestone.

Avatar Lab retains state controls, capability inspection, reset, reduced motion, speech/eye/gesture demos and the 113-second transition stress test. Read the [avatar product review](docs/avatar-deep-review.md), [state design](docs/avatar-state-design.md), [capability audit](docs/friendly-floating-bot-capabilities.md) and [provenance](docs/third-party-assets.md) for evidence. Passing tests and semantic labels do not prove visual quality.

## Architecture and scope

`PetSession` owns local product interaction state independently of React, Rive and the lab. `EmbodimentDirector`, `AvatarController` and local-life behavior remain shared; `RiveAvatarRenderer` maps their frames to the current asset. Native Rust owns window creation and geometry persistence. Narrow Tauri capabilities expose pet window actions and the developer lab command, without arbitrary OS execution.

```text
apps/desktop/      Pet Shell frontend and Tauri/Rust host
apps/avatar-lab/   separate browser development surface
packages/         avatar contracts, embodiment, Rive renderer, shared UI
assets/           attributed prototype character and supporting resources
docs/             architecture, build records, reviews and roadmap
tests/            manual acceptance records
```

The remaining conversation, provider, memory, vision, Skills and Connector directories contain foundations or reserved boundaries for later milestones. The current local demo does not activate those systems. Tray integration, startup registration, click-through, production signing and final original character art are also deferred.

Start with [architecture](docs/architecture.md), [avatar contract](docs/avatar-contract.md), [embodiment](docs/embodiment.md), and the [revised roadmap](docs/roadmap.md). After this milestone, stop for the user's review before beginning another product stage.
