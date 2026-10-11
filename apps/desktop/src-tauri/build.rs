fn main() {
    // Application commands otherwise have broader default exposure in Tauri.
    // Grant each command only to its intended local application window.
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["native_diagnostics", "open_avatar_lab"]),
    ))
    .expect("failed to build AMYU Tauri configuration");
}
