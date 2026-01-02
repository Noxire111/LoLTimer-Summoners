use std::fs;
use tauri::{Manager, LogicalSize, Size, WindowEvent};

#[tauri::command]
fn resize_window(window: tauri::Window, width: f64, height: f64) {
    let _ = window.set_size(Size::Logical(LogicalSize { width, height }));
}

#[tauri::command]
fn save_config(app_handle: tauri::AppHandle, data: String) {
    let config_path = app_handle.path().app_config_dir().unwrap().join("lol-timer-config.json");

    if let Some(parent) = config_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let _ = fs::write(config_path, data);
}

#[tauri::command]
fn load_config(app_handle: tauri::AppHandle) -> String {
    let config_path = app_handle.path().app_config_dir().unwrap().join("lol-timer-config.json");

    match fs::read_to_string(config_path) {
        Ok(content) => content,
        Err(_) => "{}".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    if let Some(overlay) = window.app_handle().get_webview_window("overlay") {
                        let _ = overlay.close();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![save_config, load_config, resize_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}