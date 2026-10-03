# Foundation + Avatar Lab build report

Date: **2026-10-03**. The browser Avatar Lab is functional and runs without an AI account or API key. The repository also contains the Tauri 2/Rust desktop scaffold and native validation record. The native executable has not been built on this host. The milestone is **ready for remaining validation; onboarding remains gated**.

## Implemented scope

The pnpm monorepo separates semantic avatar intent, deterministic local behavior, artwork mapping, audio envelopes, protocol validation, observability and the React development interface. The avatar research addendum was applied to the existing implementation.

- The application `AvatarController` supports six conversation states, ten emotions, seven gestures, weighted `setGaze(x, y, weight?)`, speech energy and awake control. No companion personal name is hard-coded.
- The deterministic `EmbodimentDirector` and local life engine produce smooth state/emotion blending, varied blinks, breathing, micro movement, saccades, posture changes, hover/click reactions and private sleep/wake timing.
- The local `GazeController` applies a dead zone, range limits and easing. Eyes respond sooner than the head; head movement is smaller. Seeded attention breaks reduce continuous pointer staring during idle.
- The actual bundled `.riv` contains original temporary vector artwork with 23 continuous numeric controls. A renderer-side adapter maps the independent pose into those controls; the production target has a separate configurable adapter.
- The lab provides Hebrew by default with RTL, English, state/emotion/intensity/energy/gaze/gesture controls, awake and reduced-motion controls, direct pose overrides, a local six-state sequence, pause/reset, bounded event history and JSON exports.
- Asset inspection reports artboards, state machines, ViewModel properties, actual input names/types, current mappings and capabilities as `supported`, `unsupported` or `unknown`. Missing or wrong-type mapped inputs report `UNMAPPED`. Runtime limitations in binding and state enumeration remain explicit.
- Zod schemas validate semantic events and future tool request/result boundaries. Amplitude lip sync supports outgoing PCM RMS, noise gating, attack/release smoothing and an existing Web Audio playback analyser. A future viseme interface reserves indices 0–14; advanced viseme rendering is not implemented.

There is no AI provider connection, conversation implementation, microphone capture, screen/camera capture, memory storage, onboarding, Skills UI or executable OS tool. Future packages contain boundaries only. The native window is a normal lab window; transparent desktop presence, tray, drag/position persistence and global cursor tracking belong to a later milestone.

## Repository structure

```text
apps/
  avatar-lab/                 browser entry point
  desktop/                   React entry point and Tauri/Rust scaffold
  api/                       reserved boundary
packages/
  avatar-contract/ protocol/ embodiment/ avatar-rive/
  audio/ observability/ shared-ui/
  companion-core/ conversation/ vision/ memory/ skills/
  capabilities/ permissions/ connectors/ user-profile/  boundaries only
providers/                   reserved provider boundaries
assets/character/            original developer Rive file and manifest
assets/audio/                reserved
skills/ evals/               reserved future structure
scripts/                     reproducible developer artwork generation
docs/                        architecture, contracts, provenance, ADRs and validation
tests/manual-acceptance.md    outstanding human/native acceptance checks
```

The companion's intelligence and future platform capabilities remain independent from artwork. Replacing a reviewed asset requires its local file, adapter configuration and metadata; it should not change conversation, memory, permissions, provider or audio code. See [architecture](architecture.md), [application avatar contract](avatar-contract.md) and [asset replacement acceptance](avatar-assets.md).

## Commands

Use Node.js 22.12 or newer and the repository-pinned pnpm 11.19.0. From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

The browser lab opens at `http://127.0.0.1:5173`. Native development requires Rust, Microsoft C++ tooling and WebView2:

```powershell
pnpm dev:desktop
pnpm build:desktop
```

The native frontend uses strict loopback port 1420. If a contained Rust toolchain is present under the repository's ignored `work/rust` directory, select it with `pnpm dev:desktop:local` or `pnpm build:desktop:local`; otherwise the wrapper requires an existing global Rust toolchain. These wrappers change process environment only and do not install prerequisites. The host policy blocker described below also affects the contained toolchain. Native installer bundling is disabled in this development scaffold.

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm character:build
```

`pnpm build` builds both frontend applications. It does not compile Rust. `pnpm character:build` regenerates the temporary Rive asset and its manifest. [README](../README.md) contains prerequisite and native check/test commands.

## Validation and measurement

| Check | Recorded status |
| --- | --- |
| ESLint and TypeScript | Passed in the final `pnpm check` run from the current workspace |
| Vitest | **68 passing tests across 10 files** in the final run |
| Both frontend production builds | Passed in the final run; both bundle the local 7.48 kB Rive asset and matching WASM |
| Production dependency audit | No reported advisories for the six production dependencies at validation time |
| Deterministic 30-minute simulated animation soak | Passed; checks finite/bounded output and varied blinking, without rendering or waiting 30 minutes |
| Browser Rive rendering and controls | Visually inspected; screenshots linked below |
| Rust formatting | Passed |
| Native debug check and release build | Blocked by Windows Application Control, Win32 error **4551** |
| Native Rust tests, executable launch, ACL/CSP runtime and WebView2 acceptance | Pending |
| Human one-minute life criterion and 30-minute visual/native session | Pending; record results in manual acceptance |

Automated coverage includes semantic contracts, capability states, event/tool schemas, deterministic replay, state/emotion interpolation, weighted gaze, attention breaks, sleep/wake, interruption of mouth energy, bounded gestures, amplitude envelopes, metrics/log bounds, lab session behavior, actual Rive decoding/mappings, production adapter aliases and native IPC schemas. Automated success does not establish the qualitative perception-of-life criterion or native operation.

The final visual review caught and corrected a hidden closed-mouth path in the generated developer rig. A regression test now captures the actual WASM runtime's Canvas2D drawing commands and verifies a visible closed mouth with four curves that morph from frown to smile. Browser screenshots confirm the change on the real canvas; the command-capture test does not draw pixels.

Current lab latency samples measure **intent to the next director frame**. `avatar_state_latency_ms` and `affect_latency_ms` stop in `LabSession.tick`, before Rive applies or draws the frame. They are not measurements of completed rendering, speech detection, live-provider response or barge-in playback latency. FPS/frame interval and Rive advance/draw time have separate instrumentation. Unused future latency categories are not reported as measured zeroes.

The [native validation record](native-validation.md) documents the host's Application Control failures while loading Rust build dependencies. No policy was disabled or bypassed, and no executable was produced. Native completion requires an approved build environment, followed by runtime and manual checks.

## Artwork and production requirements

The temporary prototype mascot is not the AMYU production identity. It is an original developer fallback used to validate architecture and behavior. Community assets remain references; the repository does not bundle their artwork. Provenance, licensing evidence and known unknowns are recorded in [avatar assets](avatar-assets.md) and [third-party assets](third-party-assets.md).

The configurable production target contains **33 controls**: 18 numbers, five booleans and ten triggers. It includes normalized gaze/head/face/body values, continuous speech/emotion intensity, an emotion index 0–9, conversation flags, seven gesture triggers, click reaction and sleep/wake triggers. See the exact [production Rive contract](rive-character-spec.md) and `createProductionRig` in `packages/avatar-rive/src/production.ts`. A final original production `.riv`, its rights/provenance record and visual acceptance are separate deliverables. Declared support starts unknown until actual controls and their visual behavior are verified. ViewModel/Data Binding properties can be inspected, but driving them requires a future renderer-side binding adapter.

## Browser visual evidence

- [English Avatar Lab](screenshots/avatar-lab-english.jpg)
- [Hebrew Avatar Lab with RTL](screenshots/avatar-lab-hebrew.jpg)
- [Concerned expression after the mouth-path repair](screenshots/concerned.jpg)
- [Active asset inspection and capability matrix](screenshots/asset-inspector.jpg)

These images show browser development UI and the real Rive canvas. They do not demonstrate a native executable, a completed 30-minute session or the finished production character.

## Exact next-milestone readiness

**Foundation ready for validation; onboarding gated.** Resolve native build policy through an approved environment, launch the Tauri/WebView2 lab, verify runtime permissions and local assets, and complete the [manual acceptance checklist](../tests/manual-acceptance.md), including the one-minute life check and 30-minute visual/native soak. The permitted developer rig can satisfy this gate; final production art is a separate delivery.

After those results are recorded, onboarding is the next planned milestone. Work stops here: realtime voice, vision, memory, Skills and connectors do not begin automatically. The ordered gates are in the [roadmap](roadmap.md).
