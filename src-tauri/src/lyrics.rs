use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricsLine {
    pub time: f64,
    pub text: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricsData {
    pub track_id: String,
    pub song_name: String,
    pub artist: String,
    pub source: String,
    pub format: String,
    pub cached_at: String,
    pub lyrics: Vec<LyricsLine>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LyricsCacheInfo {
    pub total_size: u64,
    pub file_count: u64,
    pub max_size: u64,
}

static mut LYRICS_CACHE_DIR: Option<std::path::PathBuf> = None;

fn get_lyrics_cache_dir() -> std::path::PathBuf {
    unsafe {
        if let Some(ref custom_dir) = LYRICS_CACHE_DIR {
            if custom_dir.exists() {
                return custom_dir.clone();
            }
        }
    }

    let cache_dir = std::env::var("APPDATA")
        .map(|appdata| std::path::PathBuf::from(appdata).join("tool-box").join("lyrics-cache"))
        .unwrap_or_else(|_| std::path::PathBuf::from(".").join("lyrics-cache"));

    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    cache_dir
}

#[tauri::command]
pub async fn get_lyrics_cache_path() -> String {
    get_lyrics_cache_dir().to_string_lossy().to_string()
}

#[tauri::command]
pub async fn set_lyrics_cache_path(path: String) -> Result<(), String> {
    let new_path = std::path::PathBuf::from(&path);

    if let Some(parent) = new_path.parent() {
        if !parent.exists() {
            return Err("父目录不存在".to_string());
        }
    } else {
        return Err("无效的路径".to_string());
    }

    unsafe {
        LYRICS_CACHE_DIR = Some(new_path);
    }

    let cache_dir = get_lyrics_cache_dir();
    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    Ok(())
}

fn get_lyrics_file_path(track_id: &str) -> std::path::PathBuf {
    let cache_dir = get_lyrics_cache_dir();
    cache_dir.join(format!("{}.json", track_id))
}

#[tauri::command]
pub async fn save_lyrics_cache(track_id: String, lyrics_data: String) -> Result<(), String> {
    let file_path = get_lyrics_file_path(&track_id);

    fs::write(&file_path, lyrics_data)
        .map_err(|e| format!("Failed to save lyrics cache: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn read_lyrics_cache(track_id: String) -> Result<String, String> {
    let file_path = get_lyrics_file_path(&track_id);

    if !file_path.exists() {
        return Err("Lyrics cache not found".to_string());
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read lyrics cache: {}", e))
}

#[tauri::command]
pub async fn delete_lyrics_cache(track_id: String) -> Result<(), String> {
    let file_path = get_lyrics_file_path(&track_id);

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete lyrics cache: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn clear_all_lyrics_cache() -> Result<u64, String> {
    let cache_dir = get_lyrics_cache_dir();
    let mut deleted_count: u64 = 0;

    if cache_dir.exists() {
        for entry in fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache directory: {}", e))?
        {
            if let Ok(entry) = entry {
                if entry.path().is_file() {
                    let _ = fs::remove_file(&entry.path());
                    deleted_count += 1;
                }
            }
        }
    }

    Ok(deleted_count)
}

#[tauri::command]
pub async fn get_lyrics_cache_info(max_size: u64) -> Result<LyricsCacheInfo, String> {
    let cache_dir = get_lyrics_cache_dir();
    let mut total_size: u64 = 0;
    let mut file_count: u64 = 0;

    if cache_dir.exists() {
        for entry in fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache directory: {}", e))?
        {
            if let Ok(entry) = entry {
                if entry.path().is_file() {
                    if let Ok(metadata) = entry.metadata() {
                        total_size += metadata.len();
                    }
                    file_count += 1;
                }
            }
        }
    }

    Ok(LyricsCacheInfo {
        total_size,
        file_count,
        max_size,
    })
}

#[tauri::command]
pub async fn cleanup_lyrics_cache_by_lru(max_size: u64) -> Result<u64, String> {
    let cache_dir = get_lyrics_cache_dir();

    if !cache_dir.exists() {
        return Ok(0);
    }

    let mut files: Vec<(std::path::PathBuf, std::time::SystemTime)> = Vec::new();

    for entry in fs::read_dir(&cache_dir)
        .map_err(|e| format!("Failed to read cache directory: {}", e))?
    {
        if let Ok(entry) = entry {
            if entry.path().is_file() && entry.path().extension().map(|ext| ext == "json").unwrap_or(false) {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        files.push((entry.path(), modified));
                    }
                }
            }
        }
    }

    files.sort_by(|a, b| a.1.cmp(&b.1));

    let mut deleted_count: u64 = 0;
    let mut current_size: u64 = files.iter()
        .filter_map(|(path, _)| std::fs::metadata(path).ok().map(|m| m.len()))
        .sum();

    for (path, _) in files {
        if current_size <= max_size {
            break;
        }

        if let Ok(size) = std::fs::metadata(&path).map(|m| m.len()) {
            current_size -= size;
        }

        if let Ok(_) = std::fs::remove_file(&path) {
            deleted_count += 1;
        }
    }

    Ok(deleted_count)
}
