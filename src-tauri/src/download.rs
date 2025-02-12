use std::{io::SeekFrom, path::Path, sync::Arc};

use anyhow::{Error, Result as AnyResult};
use futures::{future::join_all, lock::Mutex};

use reqwest::{
    header::{HeaderValue, ACCEPT_RANGES, CONTENT_LENGTH, RANGE},
    Response,
};
use serde::Deserialize;
use tokio::{
    fs::{self, remove_file, File},
    io::{AsyncSeekExt, AsyncWriteExt},
};

use crate::utils::{
    os,
    output::{Message, MessageSender},
};

/// 检测文件是否支持断点续传，是否是重定向链接
async fn check_request_info(
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

/// 检测重定向链接
async fn check_redirected_url(
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

/// 下载指定的文件切片
async fn download(
    url: String,
    (start, end): (u64, u64),
    is_partial: bool,
    file: Arc<Mutex<File>>,
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
    let mut file = file.lock().await;
    file.seek(SeekFrom::Start(start)).await?;
    file.write_all_buf(&mut bytes).await?;

    Ok(())
}

async fn rename_file(temp_path: &str, real_path: &str) -> AnyResult<()> {
    match fs::rename(temp_path, real_path).await {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::msg(format!("重命名文件失败: {}", e))),
    }
}

async fn check_file_exist<P: AsRef<Path>>(path: P) -> bool {
    fs::metadata(path).await.is_ok()
}

/// 开始下载任务
async fn run(
    payload: DownloadPayload,
    path: &str,
    sender: MessageSender,
    event_name: String,
) -> AnyResult<()> {
    let mut handles = vec![];
    let (range, url, length) =
        check_request_info(&payload.url, sender.clone(), event_name.clone()).await?;
    let temp_path = path.to_string() + ".tmp";
    let file_path = path.to_string();
    if check_file_exist(&temp_path).await || check_file_exist(&path).await {
        sender.send(
            &event_name,
            format!("文件已存在，跳过下载：{}", file_path),
            true,
        );
        return Ok(());
    }
    let file = Arc::new(Mutex::new(File::create(&temp_path).await?));
    let is_error = if range {
        sender.send(&event_name, format!("多线程下载中：{}", file_path), true);
        let length = length / payload.concurrent;
        for i in 0..payload.concurrent {
            let file = Arc::clone(&file);
            handles.push(tokio::spawn(download(
                url.clone(),
                (length * i, length * (i + 1) - 1),
                true,
                file,
            )));
        }
        let ret = join_all(handles).await;
        drop(file);
        let err = ret.into_iter().flatten().any(|n| n.is_err());
        rename_file(&temp_path, path).await?;
        err
    } else {
        sender.send(
            &event_name,
            format!("该文件不支持多线程下载，单线程下载中：{}", file_path),
            true,
        );
        let err = download(url.clone(), (0, length - 1), false, file)
            .await
            .is_err();
        rename_file(&temp_path, path).await?;
        err
    };
    if is_error {
        remove_file(&path).await?;
        Err(Error::msg("下载失败"))
    } else {
        sender.send(&event_name, format!("下载完成：{}", file_path), true);
        Ok(())
    }
}

#[derive(Deserialize, Clone)]
pub struct DownloadPayload {
    url: String,
    dir_path: String,
    concurrent: u64,
    plugin_name: String,
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
