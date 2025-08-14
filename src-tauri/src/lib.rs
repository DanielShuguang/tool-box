use autostart::{is_auto_start_enabled, set_auto_start};
use download::download_file;
use file_search::{cancel_search_task, search_disk_file_real_time};
use utils::os::{get_cpu_info, get_harddisk_info};

mod autostart;
mod download;
mod file_search;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(autostart::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(file_search::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            get_cpu_info,
            get_harddisk_info,
            search_disk_file_real_time,
            cancel_search_task,
            set_auto_start,
            is_auto_start_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
