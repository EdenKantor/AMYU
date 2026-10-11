mod geometry;
mod persistence;

use geometry::{SavedGeometry, WorkArea};
use persistence::GeometryPersistence;
use serde::Serialize;
use tauri::{
    LogicalSize, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder,
    WindowEvent,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeDiagnostics {
    product: &'static str,
    milestone: &'static str,
    platform: &'static str,
    executable_capabilities_enabled: bool,
}

/// Metadata only; the pet's window controls grant no arbitrary OS execution.
#[tauri::command]
fn native_diagnostics() -> NativeDiagnostics {
    NativeDiagnostics {
        product: "AMYU",
        milestone: "pet-shell",
        platform: std::env::consts::OS,
        executable_capabilities_enabled: false,
    }
}

/// The URL and window properties are fixed by Rust, not supplied over IPC.
/// An async command avoids blocking the Windows webview IPC handler.
#[tauri::command]
async fn open_avatar_lab(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(lab) = app.get_webview_window("avatar-lab") {
        lab.unminimize().map_err(|error| error.to_string())?;
        lab.show().map_err(|error| error.to_string())?;
        return lab.set_focus().map_err(|error| error.to_string());
    }
    WebviewWindowBuilder::new(
        &app,
        "avatar-lab",
        WebviewUrl::App("index.html?mode=lab".into()),
    )
    .title("AMYU · Avatar Lab (Developer)")
    .inner_size(1200.0, 900.0)
    .min_inner_size(900.0, 650.0)
    .decorations(true)
    .transparent(false)
    .always_on_top(false)
    .resizable(true)
    .build()
    .map(|_| ())
    .map_err(|error| error.to_string())
}

fn work_area(monitor: &tauri::Monitor) -> WorkArea {
    let area = monitor.work_area();
    WorkArea {
        x: area.position.x,
        y: area.position.y,
        width: area.size.width,
        height: area.size.height,
        scale: monitor.scale_factor(),
    }
}

fn capture_geometry(window: &tauri::Window) -> Option<SavedGeometry> {
    // Minimized Windows windows may report sentinel coordinates or zero size.
    // Preserve the last normal bounds instead.
    if window.is_minimized().ok()? {
        return None;
    }
    let position = window.outer_position().ok()?;
    let size = window.inner_size().ok()?;
    let scale = window.scale_factor().ok()?;
    if size.width == 0 || size.height == 0 || !scale.is_finite() || scale <= 0.0 {
        return None;
    }
    Some(SavedGeometry {
        version: 1,
        x: position.x,
        y: position.y,
        width: size.width as f64 / scale,
        height: size.height as f64 / scale,
    })
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            native_diagnostics,
            open_avatar_lab
        ])
        .setup(|app| {
            let pet = app
                .get_webview_window("pet")
                .expect("configured pet window");
            let geometry_path = app
                .path()
                .app_local_data_dir()
                .ok()
                .map(|path| path.join("pet-window.json"));
            let saved = geometry_path.as_deref().and_then(persistence::read);
            let mut monitors = Vec::new();
            if let Ok(Some(primary)) = pet.primary_monitor() {
                monitors.push(work_area(&primary));
            }
            if let Ok(available) = pet.available_monitors() {
                monitors.extend(available.iter().map(work_area));
            }
            if let Some(restored) = geometry::restore(saved, &monitors) {
                pet.set_min_size(Some(LogicalSize::new(
                    restored.min_width,
                    restored.min_height,
                )))?;
                pet.set_position(PhysicalPosition::new(restored.saved.x, restored.saved.y))?;
                // Use destination-display DPI even before Windows delivers the
                // scale-factor notification for a hidden repositioned window.
                pet.set_size(PhysicalSize::new(
                    (restored.saved.width * restored.scale).round() as u32,
                    (restored.saved.height * restored.scale).round() as u32,
                ))?;
            } else {
                let _ = pet.center();
            }
            if let Some(path) = geometry_path {
                match GeometryPersistence::start(path) {
                    Ok(persistence) => {
                        app.manage(persistence);
                    }
                    Err(error) => eprintln!("AMYU window persistence unavailable: {error}"),
                }
            }
            // Restore while hidden so launch never flashes at (0, 0). No focus
            // request is made when showing, moving or resizing the pet.
            pet.show()?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "pet" {
                return;
            }
            let Some(persistence) = window.try_state::<GeometryPersistence>() else {
                return;
            };
            match event {
                WindowEvent::Moved(_)
                | WindowEvent::Resized(_)
                | WindowEvent::ScaleFactorChanged { .. } => {
                    if let Some(geometry) = capture_geometry(window) {
                        persistence.save(geometry);
                    }
                }
                WindowEvent::CloseRequested { .. } => {
                    if let Some(geometry) = capture_geometry(window) {
                        persistence.save(geometry);
                    }
                    persistence.flush();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run AMYU Desktop Pet");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn diagnostics_do_not_expose_executable_capabilities() {
        let value = serde_json::to_value(native_diagnostics()).expect("serializable IPC metadata");
        assert_eq!(value["product"], "AMYU");
        assert_eq!(value["milestone"], "pet-shell");
        assert_eq!(value["executableCapabilitiesEnabled"], false);
        assert_eq!(value.as_object().expect("object").len(), 4);
    }
}
