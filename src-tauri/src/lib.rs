use autostart::{is_auto_start_enabled, set_auto_start};
use download::{download_file, download_file_with_config};
use file_search::{cancel_search_task, search_disk_file_real_time};
use lyrics::{cleanup_lyrics_cache_by_lru, clear_all_lyrics_cache, delete_lyrics_cache, get_lyrics_cache_info, get_lyrics_cache_path, read_lyrics_cache, save_lyrics_cache, set_lyrics_cache_path};
use lyrics_window::{close_lyrics_window, create_lyrics_window, is_lyrics_window_open, LyricsWindowState};
use music_player::{check_file_exists, read_audio_file, scan_audio_folder};
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::{broadcast, Mutex};
use utils::os::{get_cpu_info, get_harddisk_info};

mod autostart;
mod download;
mod file_search;
mod lyrics;
mod lyrics_window;
mod music_player;
mod utils;

pub struct AppState {
    pub tx: broadcast::Sender<LyricsEvent>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct LyricsEvent {
    pub event_type: String,
    pub data: serde_json::Value,
}

#[tauri::command]
async fn send_lyrics_to_window(
    state: tauri::State<'_, Arc<AppState>>,
    event_type: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let event = LyricsEvent { event_type, data };
    let _ = state.tx.send(event);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, _rx) = broadcast::channel(100);
    let lyrics_window_state = Arc::new(Mutex::new(LyricsWindowState::new()));
    let tx_clone = tx.clone();
    
    tauri::Builder::default()
        .manage(Arc::new(AppState { tx }))
        .manage(lyrics_window_state)
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let mut rx = tx_clone.subscribe();
            
            tauri::async_runtime::spawn(async move {
                while let Ok(event) = rx.recv().await {
                    if let Some(lyrics_window) = app_handle.get_webview_window("lyrics-window") {
                        let _ = lyrics_window.emit("lyrics-event", event);
                    }
                }
            });
            
            Ok(())
        })
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
            send_lyrics_to_window,
            create_lyrics_window,
            close_lyrics_window,
            is_lyrics_window_open,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
