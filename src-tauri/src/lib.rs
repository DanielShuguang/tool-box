use autostart::{is_auto_start_enabled, set_auto_start};
use download::{
    check_server_range_support, download_file, download_file_with_config, scan_unfinished_downloads,
};
use file_search::{cancel_search_task, search_disk_file_real_time};
use font::get_system_fonts;
use screenshot::{
    capture_region, capture_screen, capture_window, create_capture_window, create_editor_window,
    create_preview_window, get_screenshot_data, get_windows, ScreenshotState,
};
use utils::os::{get_cpu_info, get_harddisk_info};

mod autostart;
mod download;
mod file_search;
mod font;
mod screenshot;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_os::init())
        .plugin(autostart::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(file_search::init())
        .manage(ScreenshotState {
            data: std::sync::Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_file_with_config,
            scan_unfinished_downloads,
            check_server_range_support,
            get_cpu_info,
            get_harddisk_info,
            get_system_fonts,
            search_disk_file_real_time,
            cancel_search_task,
            set_auto_start,
            is_auto_start_enabled,
            capture_screen,
            capture_region,
            capture_window,
            get_windows,
            create_capture_window,
            create_preview_window,
            create_editor_window,
            get_screenshot_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
