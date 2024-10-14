use download::download_file;
use utils::os::get_cpu_info;

mod download;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(download::init())
        .invoke_handler(tauri::generate_handler![download_file, get_cpu_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
