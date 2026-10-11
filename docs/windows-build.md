# Windows build guide

The Windows package runs the **Pet Shell** as its main window and bundles the separate Avatar Lab route. A production build serves local frontend and avatar resources; it does not need Vite, an API key, or an AI service.

## Prerequisites and local commands

Use Windows 11 with WebView2, Microsoft C++ Build Tools and an MSVC Rust toolchain. The frontend requires Node.js 22.12+ and pnpm 11.19.0. Follow [Tauri's Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows) for the native toolchain.

From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm check
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --locked --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo test --locked --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm dev:desktop
pnpm build:desktop
```

`pnpm check` verifies the frontend workspace. Rust check/test and the Tauri package build are separate operations. Native development uses strict loopback port 1420. Installer bundling is enabled for NSIS; no installer signing credentials are included in this repository.

The optional PowerShell wrapper accepts `dev`, `build`, `check`, `test` and `fmt`:

```powershell
& ./apps/desktop/native.ps1 check
& ./apps/desktop/native.ps1 dev
& ./apps/desktop/native.ps1 build
# Reuse an existing contained toolchain (contains cargo/ and rustup/):
& ./apps/desktop/native.ps1 check -RustRoot 'C:\path\to\existing\rust'
```

It uses the repository's optional ignored `work/rust` toolchain when available, otherwise the Rust toolchain already present in the process environment/PATH. It installs nothing and restores any process environment changes on exit. The source checkout does not include Rust. Run scripts only where permitted by the host policy; the direct package-manager and Cargo commands above are also available.

Default Cargo outputs are under `apps/desktop/src-tauri/target/release/`: the app executable is `amyu-desktop.exe`, and the NSIS installer is in `bundle/nsis/`. If `CARGO_TARGET_DIR` is set, those output paths move under that directory. The wrapper's contained-toolchain mode uses its own target directory.

## Windows CI and artifacts

The [Windows Build workflow](https://github.com/EdenKantor/AMYU/actions/workflows/windows-build.yml), defined in [`.github/workflows/windows-build.yml`](../.github/workflows/windows-build.yml), builds on a GitHub-hosted Windows runner. It supports manual **Run workflow** and relevant pushes to `main`. It uses Node 24, pinned pnpm and Rust stable with the committed lockfiles.

The workflow validates frontend code, checks Rust formatting, runs Rust tests and builds the Tauri Windows package. The `AMYU-Windows-x64-<commit>` artifact contains `AMYU.exe`, the NSIS installer, SHA-256 checksums, asset attribution, build metadata and a process-smoke report. It is retained for 30 days. It does **not** create or publish a GitHub release. Exact run status, artifact links and any process smoke-test observations belong in the [build report](build-report.md).

To retrieve a build, open the workflow, select a successful run for the intended commit and download its Windows artifact. Extract the archive before launching the executable or installer. A hosted runner build is independent of this development machine's Application Control policy; a downloaded unsigned artifact can still be restricted by the destination host's policy. Do not disable security controls to run it.

## Error 4551 and evidence

Earlier local attempts recorded Windows Application Control / error **4551** while loading `yoke_derive` during `cargo check` and executing a `serde_core` build script during release compilation. This is a real native build blocker, not a frontend failure. Repository changes do not establish that host policy has changed.

The current investigation, commands, toolchain location, logs and latest native outcome are recorded in [native validation](native-validation.md). Preserve that distinction: source/configuration checks, hosted Windows compilation, local executable launch and manual native acceptance are separate results. A passing browser demo or CI process check cannot certify transparent desktop behavior, drag/resize, saved geometry or monitor/DPI handling.

No policy bypass, Application Control disablement or host-security weakening is part of the build path. If the development host continues to block native dependencies, use the authorized hosted Windows build and validate its artifact on a Windows environment whose existing policy allows it.
