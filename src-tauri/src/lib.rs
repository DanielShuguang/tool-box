use download::download_file;
use file_search::{cancel_search_task, search_disk_file_real_time};
use utils::os::{get_cpu_info, get_harddisk_info};

mod download;
mod file_search;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(file_search::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            get_cpu_info,
            get_harddisk_info,
            search_disk_file_real_time,
            cancel_search_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
