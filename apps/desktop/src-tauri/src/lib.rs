use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeDiagnostics {
    product: &'static str,
    milestone: &'static str,
    platform: &'static str,
    executable_capabilities_enabled: bool,
}

/// This command reports fixed application metadata. It performs no OS action.
#[tauri::command]
fn native_diagnostics() -> NativeDiagnostics {
    NativeDiagnostics {
        product: "AMYU",
        milestone: "avatar-lab",
        platform: std::env::consts::OS,
        executable_capabilities_enabled: false,
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![native_diagnostics])
        .run(tauri::generate_context!())
        .expect("failed to run AMYU Avatar Lab");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn diagnostics_do_not_expose_executable_capabilities() {
        let diagnostics = native_diagnostics();
        let value = serde_json::to_value(diagnostics).expect("serializable IPC metadata");
        assert_eq!(value["product"], "AMYU");
        assert_eq!(value["milestone"], "avatar-lab");
        assert_eq!(value["executableCapabilitiesEnabled"], false);
        assert_eq!(value.as_object().expect("object").len(), 4);
    }
}
