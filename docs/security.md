# Security boundary

This milestone has no AI credentials, OS tools, capture, camera, microphone, cloud connectors or account storage. The future permission model is a contract only.

The Tauri webview loads bundled/local frontend assets. Its production CSP permits its own resources, Rive WebAssembly, and Tauri IPC; it does not permit remote model or connector endpoints. Development adds the loopback Vite/HMR origins only. No shell, filesystem, HTTP, opener, camera or capture plugin is installed.

One local capability is explicitly selected for the lab window. It grants only the metadata-only `native_diagnostics` command. `build.rs` declares the command in `AppManifest::commands`, so the command participates in Tauri ACL instead of the broad custom-command default. This follows [Tauri's capability guidance](https://v2.tauri.app/security/capabilities/).

Later executable operations must pass through Capability Gateway -> Permission Engine -> reviewed platform/tool adapter -> audited result. Permissions live in code, outside prompts. Connector scopes and separate screen/camera/microphone permissions remain independently revocable. Consequential external writes require user confirmation. Screenshots are ephemeral by default, with metadata audit only. Secrets belong in native/backend protected storage and must never be serialized to frontend JavaScript.

External events are runtime-validated. Future Skills are untrusted, versioned and eval gated. No dynamic arbitrary code execution or silent background surveillance is authorized by this foundation.

Native compilation was attempted with a contained Rust toolchain and the existing Windows prerequisites. The host's Application Control policy blocks a dependency DLL/build script (error 4551), so native runtime ACL/CSP verification remains pending. No Windows security policy was modified. See [native validation](native-validation.md). The scaffold's configuration is reviewable; configuration review alone is not a completed native runtime test.
