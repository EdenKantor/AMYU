# ADR 0001 — Tauri 2 desktop foundation

Status: accepted for Windows-first development; native compilation attempted and blocked by host Application Control policy. See [native validation](../native-validation.md).

Use Tauri 2, Rust, React, TypeScript and Vite. Windows 11 is the first native target; keep platform code out of core for later macOS support. There is no demonstrated blocker requiring Electron.

The first native window is the shared Avatar Lab. Pet/panel window behavior, tray, focus policy and OS capability adapters are later milestones. A single restricted metadata command establishes typed, runtime-validated IPC without prematurely adding desktop powers.

Consequence: a native build requires Rust, Microsoft C++ tooling and WebView2. Browser lab tests cannot substitute for native validation. [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) and [configuration](https://v2.tauri.app/reference/config/) are the official references.
