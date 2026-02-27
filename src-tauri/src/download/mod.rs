mod core;
mod downloader;
mod limiter;
mod progress;
mod utils;

use serde::{Deserialize, Serialize};

use crate::utils::{os, output::Message, output::MessageSender};

pub use core::{run, run_download};

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadPayload {
    pub url: String,
    pub dir_path: String,
    pub concurrent: u64,
    pub plugin_name: String,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadConfig {
    pub url: String,
    pub dir_path: String,
    pub concurrent: u64,
    pub plugin_name: String,
    pub file_name: Option<String>,
    pub event_type: Option<String>,
    pub speed_limit_mbps: Option<f64>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub current: u64,
    pub total: u64,
    pub percentage: f64,
    pub speed_mbps: f64,
    pub status: DownloadStatus,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub enum DownloadStatus {
    Starting,
    Downloading,
    Paused,
    Resumed,
    Completed,
    Failed(String),
}

#[tauri::command]
pub async fn download_file(
    payload: DownloadPayload,
    app_handle: tauri::AppHandle,
) -> Result<Message<String>, ()> {
    let sender = MessageSender::new(app_handle, &payload.plugin_name);
    let event_name = format!("{}:download-output", payload.plugin_name);
    let file_name = match payload.url.split('/').last() {
        Some(v) => v,
        None => return Ok(Message::failure("url错误")),
    };
    let system_name = os::get_system_name();
    let splitter = if system_name.to_lowercase() == "windows" {
        "\\"
    } else {
        "/"
    };
    let path = format!("{}{}{}", payload.dir_path, splitter, file_name);
    match run(payload, &path, sender, event_name).await {
        Ok(_) => Ok(Message::success(Some(String::from("下载成功")))),
        Err(e) => Ok(Message::failure(&e.to_string())),
    }
}

#[tauri::command]
pub async fn download_file_with_config(
    config: DownloadConfig,
    app_handle: tauri::AppHandle,
) -> Result<Message<String>, ()> {
    let sender = MessageSender::new(app_handle, &config.plugin_name);
    let (event_name, progress_event) =
        utils::generate_event_name(&config.plugin_name, config.event_type.as_deref());

    let file_name = match &config.file_name {
        Some(name) => name.clone(),
        None => {
            utils::extract_filename_from_url(&config.url).unwrap_or_else(|| "download".to_string())
        }
    };

    let system_name = os::get_system_name();
    let splitter = if system_name.to_lowercase() == "windows" {
        "\\"
    } else {
        "/"
    };

    let base_path = format!("{}{}{}", config.dir_path, splitter, file_name);
    let path = utils::handle_filename_conflict(&base_path, &config.dir_path);

    let speed_limiter = config.speed_limit_mbps.map(limiter::SpeedLimiter::new);

    match run_download(
        config,
        &path,
        sender,
        event_name,
        progress_event,
        speed_limiter,
    )
    .await
    {
        Ok(_) => Ok(Message::success(Some(String::from("下载成功")))),
        Err(e) => Ok(Message::failure(&e.to_string())),
    }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ResumeDownloadInfo {
    pub file_path: String,
    pub file_name: String,
    pub temp_file_path: String,
    pub url: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RangeSupportResult {
    pub supports_range: bool,
    pub total_bytes: u64,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
}

#[tauri::command]
pub async fn scan_unfinished_downloads(
    file_path: String,
) -> Result<Message<Vec<ResumeDownloadInfo>>, ()> {
    use progress::{
        get_real_file_path, get_temp_file_path, validate_progress,
        ValidationResult,
    };

    let temp_path = get_temp_file_path(&file_path);
    let real_path = match get_real_file_path(&temp_path) {
        Some(p) => p,
        None => return Ok(Message::failure("无效的临时文件路径")),
    };

    match validate_progress(&real_path).await {
        Ok(ValidationResult::Valid(progress)) => {
            let info = ResumeDownloadInfo {
                file_path: real_path.clone(),
                file_name: std::path::Path::new(&real_path)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                temp_file_path: temp_path,
                url: progress.url,
                downloaded_bytes: progress.downloaded_bytes,
                total_bytes: progress.total_bytes,
                etag: progress.etag,
                last_modified: progress.last_modified,
            };
            Ok(Message::success(Some(vec![info])))
        }
        Ok(ValidationResult::ProgressFileNotFound) => {
            Ok(Message::failure("进度文件缺失，无法恢复下载"))
        }
        Ok(ValidationResult::TempFileNotFound) => Ok(Message::failure("临时文件不存在")),
        Ok(ValidationResult::SizeMismatch { expected, actual }) => Ok(Message::failure(&format!(
            "文件已损坏，无法恢复（期望大小：{}，实际大小：{}）",
            expected, actual
        ))),
        Err(e) => Ok(Message::failure(&e.to_string())),
    }
}

#[tauri::command]
pub async fn check_server_range_support(url: String) -> Result<Message<RangeSupportResult>, ()> {
    use reqwest::header::{HeaderValue, ACCEPT_RANGES, CONTENT_LENGTH};

    let client = reqwest::Client::new();
    match client.head(&url).send().await {
        Ok(resp) => {
            let headers = resp.headers();
            let supports_range = headers
                .get(ACCEPT_RANGES)
                .map(|val| val == &HeaderValue::from_static("bytes"))
                .unwrap_or(false);

            let total_bytes = headers
                .get(CONTENT_LENGTH)
                .and_then(|val| val.to_str().ok())
                .and_then(|val| val.parse().ok())
                .unwrap_or(0);

            let etag = headers
                .get("etag")
                .and_then(|val| val.to_str().ok())
                .map(|s| s.to_string());

            let last_modified = headers
                .get("last-modified")
                .and_then(|val| val.to_str().ok())
                .map(|s| s.to_string());

            Ok(Message::success(Some(RangeSupportResult {
                supports_range,
                total_bytes,
                etag,
                last_modified,
            })))
        }
        Err(e) => Ok(Message::failure(&format!("无法访问 URL: {}", e))),
    }
}
