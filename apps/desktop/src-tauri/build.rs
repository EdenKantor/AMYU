fn main() {
    // Application commands otherwise have broader default exposure in Tauri.
    // Register this command in the ACL and grant it only to the local lab window.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["native_diagnostics"])),
    )
    .expect("failed to build AMYU Tauri configuration");
}
