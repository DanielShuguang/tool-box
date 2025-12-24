use base64::Engine;
use std::fs;
use std::path::Path;

static SUPPORTED_EXTENSIONS: &[&str] = &["mp3", "wav", "flac", "m4a", "ogg", "aac"];

#[derive(serde::Serialize, Clone)]
pub struct AudioFile {
    pub id: String,
    pub name: String,
    pub path: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
}

fn read_audio_metadata(file_path: &Path) -> (Option<String>, Option<String>, Option<String>) {
    let file = match fs::File::open(file_path) {
        Ok(f) => f,
        Err(_) => return (None, None, None),
    };

    let mss = symphonia::core::io::MediaSourceStream::new(Box::new(file), Default::default());

    let hint = symphonia::core::probe::Hint::new();
    let probed = match symphonia::default::get_probe().format(
        &hint,
        mss,
        &Default::default(),
        &Default::default(),
    ) {
        Ok(p) => p,
        Err(_) => return (None, None, None),
    };

    let mut format = probed.format;
    let _track = match format
        .tracks()
        .iter()
        .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
    {
        Some(t) => t,
        None => return (None, None, None),
    };

    let mut title = None;
    let mut artist = None;
    let mut album = None;

    let metadata = format.metadata();
    if let Some(metadata) = metadata.current() {
        for tag in metadata.tags() {
            match tag.key.as_str() {
                "TITLE" | "TIT2" => title = Some(tag.value.to_string()),
                "ARTIST" | "TPE1" => artist = Some(tag.value.to_string()),
                "ALBUM" | "TALB" => album = Some(tag.value.to_string()),
                _ => {}
            }
        }
    }

    (title, artist, album)
}

#[tauri::command]
pub async fn scan_audio_folder(folder_path: String) -> Result<Vec<AudioFile>, String> {
    let mut audio_files = Vec::new();

    let path = Path::new(&folder_path);
    if !path.exists() {
        return Err("文件夹不存在".to_string());
    }

    let entries = std::fs::read_dir(path).map_err(|_| "无法读取目录")?;
    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let file_path = entry.path();
        if !file_path.is_file() {
            continue;
        }
        let ext = match file_path.extension() {
            Some(e) => e.to_string_lossy().to_lowercase(),
            None => continue,
        };
        if !SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
            continue;
        }
        let file_name = entry.file_name().to_string_lossy().to_string();
        let full_path = file_path.to_string_lossy().to_string();
        let default_title = file_name.trim_end_matches(&format!(".{}", ext)).to_string();

        let (metadata_title, artist, album) = read_audio_metadata(&file_path);
        let title = metadata_title.unwrap_or(default_title);

        audio_files.push(AudioFile {
            id: format!(
                "{}-{}",
                chrono::Utc::now().timestamp_millis(),
                audio_files.len()
            ),
            name: file_name,
            path: full_path,
            title,
            artist,
            album,
        });
    }

    Ok(audio_files)
}

#[tauri::command]
pub async fn read_audio_file(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    let content = match fs::read(path) {
        Ok(c) => c,
        Err(e) => {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                return Err("没有权限读取该文件".to_string());
            }
            return Err("读取文件失败".to_string());
        }
    };
    let base64 = base64::engine::general_purpose::STANDARD.encode(content);
    Ok(base64)
}
