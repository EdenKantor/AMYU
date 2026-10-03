# Native validation record

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
