# Native validation record

## Revised Pet Shell milestone — updated 2026-10-13

The product entry point is now the compact Pet Shell. Avatar Lab remains a separate developer window. Native configuration enables transparency, frameless presentation, always-on-top, resize bounds and NSIS packaging. **The hosted Windows build passed and its downloaded production EXE runs successfully on this host.** Local Rust compilation remains blocked; manual acceptance is partial.

The existing toolchain was reused from the earlier workspace through `native.ps1 -RustRoot`; no Rust installation or security configuration was changed. Verified versions: rustc 1.99.0 and cargo 1.99.0. Native outputs were directed to this repository's ignored `work/native-target`.

| Actual attempt | Result |
| --- | --- |
| `cargo fmt --check` | PASS |
| `cargo check --locked` | Windows Application Control blocked `debug/build/generic-array-addf822b734c4982/build-script-build`, error **4551** |
| `native.ps1 build` (locked Tauri release + NSIS) | Frontend built; Application Control blocked `release/build/zmij-b6b5019f2cb5540e/build-script-build`, error **4551** |
| Local native compilation/tests/packaging | Not completed because dependency build scripts are blocked |
| GitHub Windows compile/tests | PASS, all 11 native tests in [run 38274777583](https://github.com/EdenKantor/AMYU/actions/runs/38274777583), including real Windows file save/flush/reload and corrupted-data fallback |
| GitHub release packaging | PASS in the same run: optimized Windows EXE and NSIS installer uploaded |
| GitHub process smoke | PASS: native title/window and process lifetime, no Vite. This check does not assert visual acceptance |
| Local downloaded EXE launch | PASS on October 12 and 13; bundled production route, robot animation and compact composer |

Logs are retained locally in ignored `work/native-check.log` and `work/native-build.log`. The local attempts fail before compiling AMYU's native source; hosted Windows CI subsequently compiled and tested that source and built the installer. A separate pnpm argument-forwarding error was fixed by keeping the literal locked-build command in a package script. No Application Control policy or other host security control was disabled, weakened or bypassed. Package scripts no longer request a PowerShell execution-policy override.

### Local native observation record

Observer: Codex via the Windows Computer Use skill. Dates: **2026-10-12–13**, Asia/Jerusalem. OS: Windows 11 Core, 25H2, build **26200.9457**. Installed WebView2 directory: **154.0.4258.62**. Exact source, artifact URLs and verified EXE/installer hashes are in the [build report](build-report.md#download-and-provenance). The EXE was extracted under ignored `work/windows-ci-ba76f62/`; no installer was run. Ports 1420 and 5173 had no listening development servers; native accessibility exposed `http://tauri.localhost/`.

| Native observation | Result |
| --- | --- |
| Immediate animated pet, compact shell, transparent background and no title bar | Observed |
| Type/Enter; local listening → thinking → speaking → idle | Observed with native state images on October 12 |
| Move handle | Observed origin change `(3053, 26)` → `(2943, 71)` on October 13 |
| L size preset | Observed native size change `373 × 455` → `480 × 620`, readable composer and full robot |
| Close/relaunch persistence | PASS: saved JSON and relaunched capture both `(2943, 71, 480, 620)` |
| Sleep and click-to-wake | Observed closed-eye hold and return to idle |
| Separate Avatar Lab | Decorated window, production `index.html?mode=lab`, working sleeping control; closing lab leaves pet running |
| Resize grip | Unresolved: automation did not demonstrate a size change |
| Always-on-top against foreground window; taskbar recovery; S/M presets; native acting/interruption stress | Pending conclusive native checks |
| Hardware monitor/DPI changes; sustained idle/reduced motion; installer installation | Not performed |

The final lab-window automation encountered `coordinate input geometry is unavailable`, followed by `foreground window did not report a process id` during recovery, so further UI input stopped. No Windows security setting was changed. Multi-monitor/DPI and invalid geometry have focused Rust tests; those tests do not replace hardware checks. Native captures and remaining acceptance are linked from the build report and [manual checklist](../tests/manual-acceptance.md).

## Preserved earlier native investigation

Date: **2026-10-03**. Target: Windows 11 x64. These attempts were made in the original development workspace before publication at the repository root. The host has Microsoft C++ tooling and WebView2 154.0.4258.53. Node is 24.12.0; pnpm is 11.19.0. This is a preserved validation history, not a new native run from the published source.

## Contained toolchain

The official x64 `rustup-init.exe` was downloaded from Rust's official distribution server and its published SHA-256 verified. Rust/rustfmt were installed only under workspace `work/rust`, with `RUSTUP_HOME` and `CARGO_HOME` pointing there and `--no-modify-path`. No permanent PATH or system prerequisite configuration was changed. This installation method follows [rustup's custom-location guidance](https://rust-lang.github.io/rustup/installation/index.html#choosing-where-to-install).

Versions: rustc 1.99.0 (b940084d7, 2026-09-28), cargo 1.99.0 (5f94df478, 2026-08-27). Cargo resolved and wrote `apps/desktop/src-tauri/Cargo.lock` for 416 packages, including Tauri 2.12.1. The lockfile is included in the relocated source. The scratch Rust installation and compiled target artifacts belonged to the previous workspace's `work/rust`; neither was copied into the current source package.

`apps/desktop/native.ps1` looks for an optional toolchain in the repository's ignored `work/rust` directory, or falls back to an existing global Rust toolchain. A fresh clone has no contained toolchain merely because the wrapper is present. The script has no hard-coded path to the previous installation and does not install Rust. It modifies process environment variables only and restores them on exit. The documented PowerShell execution-policy flag applies only to that process; it does not change machine policy.

## Results

| Check | Result |
| --- | --- |
| Desktop IPC schema tests | Passed, 2/2; validates camelCase metadata and rejects extra/capability fields |
| Rust formatting (`cargo fmt --check`) | Passed after a formatting correction |
| Debug native compile (`cargo check --locked`) | Blocked by Windows Application Control while loading `yoke_derive` procedural-macro DLL |
| Native release build (`tauri build`) | Frontend build passed, then Windows Application Control blocked `serde_core` build-script execution |
| Native Rust unit test execution | Pending: dependencies cannot compile under current host policy |
| Native executable/installer | Not produced; development installer bundling is disabled |
| Native ACL/CSP runtime, WebView2 visual checks and 30-minute native soak | Pending, since no native executable could be built |

## Exact host blocker

Debug compile reports Rust `E0463: can't find crate for yoke_derive`. The DLL exists and has a `.rustc` metadata section. A direct Windows loader probe returns Win32 **4551** for this DLL while other compiled procedural-macro DLLs load. Windows describes 4551 as: “An Application Control policy has blocked this file.”

The standard release build independently reports the same policy error for `serde_core`'s `build-script-build` executable before it can execute. No security policy was disabled, modified or bypassed to force compilation. Native completion requires a build environment whose approved policy permits these reviewed Rust build dependencies; a policy owner may need to authorize the build artifacts.

The source and lockfile remain reviewable. Successful browser/frontend validation does not count as a native build, runtime permission test or desktop acceptance pass. Onboarding remains gated by the outstanding acceptance checks.
