mod core;
mod downloader;
mod limiter;
mod utils;

use serde::{Deserialize, Serialize};

use crate::utils::{
    os,
    output::Message,
    output::MessageSender,
};

pub use core::{run, run_download};

#[derive(Deserialize, Clone)]
pub struct DownloadPayload {
    pub url: String,
    pub dir_path: String,
    pub concurrent: u64,
    pub plugin_name: String,
}

#[derive(Deserialize, Clone)]
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
pub struct DownloadProgress {
    pub current: u64,
    pub total: u64,
    pub percentage: f64,
    pub speed_mbps: f64,
    pub status: DownloadStatus,
}

#[derive(Serialize, Clone, Debug)]
pub enum DownloadStatus {
    #[serde(rename = "starting")]
    Starting,
    #[serde(rename = "downloading")]
    Downloading,
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "resumed")]
    Resumed,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
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
        None => utils::extract_filename_from_url(&config.url)
            .unwrap_or_else(|| "download".to_string()),
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
    
    match run_download(config, &path, sender, event_name, progress_event, speed_limiter).await {
        Ok(_) => Ok(Message::success(Some(String::from("下载成功")))),
        Err(e) => Ok(Message::failure(&e.to_string())),
    }
}
