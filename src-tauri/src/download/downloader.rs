use std::io::{ErrorKind, SeekFrom};
use std::path::Path;
use std::sync::Arc;

use anyhow::{Error, Result as AnyResult};
use futures::lock::Mutex;

use reqwest::{
    header::{HeaderValue, ACCEPT_RANGES, CONTENT_LENGTH, RANGE},
    Response,
};
use tokio::{
    fs::File,
    io::{AsyncSeekExt, AsyncWriteExt},
};

use crate::utils::output::MessageSender;

use super::limiter::SpeedLimiter;

pub async fn check_request_info(
    url: &str,
    sender: MessageSender,
    event_name: String,
) -> AnyResult<(bool, String, u64)> {
    let req = reqwest::Client::new().head(url);
    let resp = req.send().await?;
    if !resp.status().is_success() {
        return Err(Error::msg("请求失败"));
    }
    let url = check_redirected_url(&resp, sender, event_name).await?;
    let headers = resp.headers();
    let range = headers
        .get(ACCEPT_RANGES)
        .map(|val| (val == &HeaderValue::from_static("bytes")).then(|| ()))
        .flatten()
        .is_some();
    let length = headers
        .get(CONTENT_LENGTH)
        .map(|val| val.to_str().ok())
        .flatten()
        .map(|val| val.parse().ok())
        .flatten()
        .ok_or(Error::msg("获取文件长度失败"))?;

    Ok((range, url, length))
}

pub async fn check_redirected_url(
    resp: &Response,
    sender: MessageSender,
    event_name: String,
) -> AnyResult<String> {
    if resp.status().is_redirection() {
        sender.send(
            &event_name,
            format!("检测到重定向链接: {}", resp.url()),
            true,
        );

        let headers = resp.headers();
        if let Some(val) = headers.get(reqwest::header::LOCATION) {
            return val
                .to_str()
                .map(|val| val.to_string())
                .ok()
                .ok_or(Error::msg("获取重定向URL失败"));
        }
    }
    Ok(resp.url().to_string())
}

pub async fn download(
    url: String,
    (start, end): (u64, u64),
    is_partial: bool,
    file: Arc<Mutex<File>>,
    speed_limiter: Option<Arc<SpeedLimiter>>,
) -> AnyResult<()> {
    let req = reqwest::Client::new().get(url);
    let req = if is_partial {
        req.header(RANGE, format!("bytes={}-{}", start, end))
    } else {
        req
    };
    let rep = req.send().await?;
    if !rep.status().is_success() {
        return Err(Error::msg("请求失败"));
    }
    let mut bytes = rep.bytes().await?;
    
    if let Some(limiter) = speed_limiter {
        if let Some(limiter) = Arc::into_inner(limiter) {
            let mut limiter = limiter;
            limiter.wait(bytes.len() as u64).await;
        }
    }
    
    let mut file = file.lock().await;
    file.seek(SeekFrom::Start(start)).await?;
    file.write_all_buf(&mut bytes).await?;

    Ok(())
}

pub async fn rename_file(temp_path: &str, real_path: &str) -> AnyResult<()> {
    match tokio::fs::rename(temp_path, real_path).await {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::msg(format!("重命名文件失败: {}", e))),
    }
}

pub async fn check_file_exist<P: AsRef<Path>>(path: P) -> bool {
    tokio::fs::metadata(path).await.is_ok()
}

pub async fn is_file_locked<P: AsRef<Path>>(path: P) -> bool {
    match tokio::fs::File::open(path).await {
        Ok(mut file) => {
            if let Err(e) = file.seek(SeekFrom::Start(0)).await {
                return e.kind() == ErrorKind::PermissionDenied;
            }
            false
        }
        Err(_) => true,
    }
}

pub async fn handle_existing_files(
    temp_path: &str,
    progress_path: &str,
    range: bool,
    file_path: &str,
    sender: &MessageSender,
    event_name: &str,
) -> AnyResult<()> {
    if check_file_exist(temp_path).await {
        if is_file_locked(temp_path).await {
            sender.send(
                event_name,
                format!("文件正在下载中，跳过下载：{}", file_path),
                true,
            );
            return Ok(());
        } else {
            if let Err(e) = tokio::fs::remove_file(temp_path).await {
                sender.send(
                    event_name,
                    format!("删除临时文件失败：{}，错误：{}", temp_path, e),
                    true,
                );
                return Err(Error::msg("删除临时文件失败"));
            }
            if range && check_file_exist(progress_path).await {
                if let Err(e) = tokio::fs::remove_file(progress_path).await {
                    sender.send(
                        event_name,
                        format!("删除进度文件失败：{}，错误：{}", progress_path, e),
                        true,
                    );
                    return Err(Error::msg("删除进度文件失败"));
                }
            }
        }
    }
    Ok(())
}

pub async fn save_progress(progress_path: &str, progress: Vec<(u64, u64)>) -> AnyResult<()> {
    let json = serde_json::to_string(&progress)?;
    tokio::fs::write(progress_path, json).await?;
    Ok(())
}

pub async fn load_progress(progress_path: &str) -> AnyResult<Vec<(u64, u64)>> {
    if !check_file_exist(progress_path).await {
        return Ok(vec![]);
    }
    let content = tokio::fs::read_to_string(progress_path).await?;
    let progress: Vec<(u64, u64)> = serde_json::from_str(&content)?;
    Ok(progress)
}

pub async fn load_download_progress(range: bool, progress_path: &str) -> AnyResult<Vec<(u64, u64)>> {
    if range {
        load_progress(progress_path).await
    } else {
        Ok(vec![])
    }
}
