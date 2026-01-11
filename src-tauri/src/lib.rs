use autostart::{is_auto_start_enabled, set_auto_start};
use download::{download_file, download_file_with_config};
use file_search::{cancel_search_task, search_disk_file_real_time};
use lyrics::{cleanup_lyrics_cache_by_lru, clear_all_lyrics_cache, delete_lyrics_cache, get_lyrics_cache_info, get_lyrics_cache_path, read_lyrics_cache, save_lyrics_cache, set_lyrics_cache_path};
use music_player::{check_file_exists, read_audio_file, scan_audio_folder};
use utils::os::{get_cpu_info, get_harddisk_info};

mod autostart;
mod download;
mod file_search;
mod lyrics;
mod music_player;
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
        .plugin(file_search::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_file_with_config,
            get_cpu_info,
            get_harddisk_info,
            search_disk_file_real_time,
            cancel_search_task,
            set_auto_start,
            is_auto_start_enabled,
            scan_audio_folder,
            read_audio_file,
            check_file_exists,
            save_lyrics_cache,
            read_lyrics_cache,
            delete_lyrics_cache,
            clear_all_lyrics_cache,
            get_lyrics_cache_info,
            cleanup_lyrics_cache_by_lru,
            get_lyrics_cache_path,
            set_lyrics_cache_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
