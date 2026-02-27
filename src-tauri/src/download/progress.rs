use std::path::Path;

use anyhow::Result as AnyResult;
use serde::{Deserialize, Serialize};
use tokio::fs;
use tokio::time::{sleep, Duration};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressFile {
    pub url: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
    pub created_at: i64,
    pub started_at: Option<i64>,
}

pub fn get_temp_file_path(file_path: &str) -> String {
    format!("{}.download", file_path)
}

pub fn get_progress_file_path(file_path: &str) -> String {
    format!("{}.download.json", file_path)
}

pub fn get_real_file_path(temp_file_path: &str) -> Option<String> {
    let path = Path::new(temp_file_path);
    let extension = path.extension()?.to_str()?;
    if extension == "download" {
        let stem = path.file_stem()?.to_str()?;
        return Some(stem.to_string());
    }
    None
}

pub async fn load_progress_file(file_path: &str) -> AnyResult<DownloadProgressFile> {
    let progress_path = get_progress_file_path(file_path);
    let content = fs::read_to_string(&progress_path).await?;
    let progress: DownloadProgressFile = serde_json::from_str(&content)?;
    Ok(progress)
}

pub async fn save_progress_file(
    file_path: &str,
    url: &str,
    downloaded_bytes: u64,
    total_bytes: u64,
    etag: Option<&str>,
    last_modified: Option<&str>,
    started_at: Option<i64>,
) -> AnyResult<()> {
    let progress_path = get_progress_file_path(file_path);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    let progress = DownloadProgressFile {
        url: url.to_string(),
        downloaded_bytes,
        total_bytes,
        etag: etag.map(|s| s.to_string()),
        last_modified: last_modified.map(|s| s.to_string()),
        created_at: now,
        started_at,
    };

    let json = serde_json::to_string_pretty(&progress)?;
    fs::write(&progress_path, json).await?;
    Ok(())
}

/// Update only the downloaded_bytes field in the progress file (more efficient for periodic updates)
pub async fn update_progress_bytes(file_path: &str, downloaded_bytes: u64) -> AnyResult<()> {
    let progress_path = get_progress_file_path(file_path);

    // Read existing progress
    let content = fs::read_to_string(&progress_path).await?;
    let mut progress: DownloadProgressFile = serde_json::from_str(&content)?;

    // Update only the bytes
    progress.downloaded_bytes = downloaded_bytes;

    let json = serde_json::to_string_pretty(&progress)?;
    fs::write(&progress_path, json).await?;
    Ok(())
}

/// Start a background task that periodically updates the progress file
/// Updates every 5 seconds during download
pub async fn start_periodic_progress_update(
    file_path: String,
    _total_bytes: u64,
    _url: String,
    _etag: Option<String>,
    _last_modified: Option<String>,
    _started_at: Option<i64>,
) {
    let file_path_clone = file_path.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(5)).await;

            // Get current file size
            match get_temp_file_size(&file_path_clone).await {
                Ok(current_size) => {
                    if let Err(e) = update_progress_bytes(&file_path_clone, current_size).await {
                        eprintln!("Failed to update progress file: {}", e);
                    }
                }
                Err(e) => {
                    // File might have been deleted, stop the task
                    eprintln!("Failed to get temp file size: {}", e);
                    break;
                }
            }
        }
    });
}

pub async fn delete_progress_file(file_path: &str) -> AnyResult<()> {
    let progress_path = get_progress_file_path(file_path);
    if fs::metadata(&progress_path).await.is_ok() {
        fs::remove_file(&progress_path).await?;
    }
    Ok(())
}

pub async fn get_temp_file_size(file_path: &str) -> AnyResult<u64> {
    let temp_path = get_temp_file_path(file_path);
    let metadata = fs::metadata(&temp_path).await?;
    Ok(metadata.len())
}

pub async fn validate_progress(file_path: &str) -> AnyResult<ValidationResult> {
    let temp_path = get_temp_file_path(file_path);
    let progress_path = get_progress_file_path(file_path);

    if !fs::metadata(&temp_path).await.is_ok() {
        return Ok(ValidationResult::TempFileNotFound);
    }

    if !fs::metadata(&progress_path).await.is_ok() {
        return Ok(ValidationResult::ProgressFileNotFound);
    }

    let progress = load_progress_file(file_path).await?;
    let actual_size = get_temp_file_size(file_path).await?;

    if actual_size != progress.downloaded_bytes {
        return Ok(ValidationResult::SizeMismatch {
            expected: progress.downloaded_bytes,
            actual: actual_size,
        });
    }

    Ok(ValidationResult::Valid(progress))
}

#[derive(Debug)]
pub enum ValidationResult {
    Valid(DownloadProgressFile),
    TempFileNotFound,
    ProgressFileNotFound,
    SizeMismatch { expected: u64, actual: u64 },
}
