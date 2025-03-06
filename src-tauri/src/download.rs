use std::io::{ErrorKind, SeekFrom};
use std::{path::Path, sync::Arc};

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

/// 保存下载进度到文件
async fn save_progress(progress_path: &str, progress: Vec<(u64, u64)>) -> AnyResult<()> {
    let json = serde_json::to_string(&progress)?;
    fs::write(progress_path, json).await?;
    Ok(())
}

/// 读取下载进度文件
async fn load_progress(progress_path: &str) -> AnyResult<Vec<(u64, u64)>> {
    if !check_file_exist(progress_path).await {
        return Ok(vec![]);
    }
    let content = fs::read_to_string(progress_path).await?;
    let progress: Vec<(u64, u64)> = serde_json::from_str(&content)?;
    Ok(progress)
}

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

/// 检查文件是否被占用
async fn is_file_locked<P: AsRef<Path>>(path: P) -> bool {
    match File::open(path).await {
        Ok(mut file) => {
            // 尝试对文件进行读写操作以检测是否被占用
            if let Err(e) = file.seek(SeekFrom::Start(0)).await {
                return e.kind() == ErrorKind::PermissionDenied;
            }
            false
        }
        Err(_) => true, // 文件无法打开，可能被占用
    }
}

/// 检查并处理 .tmp 文件和进度文件
async fn handle_existing_files(
    temp_path: &str,
    progress_path: &str,
    range: bool,
    file_path: &str,
    sender: &MessageSender,
    event_name: &str,
) -> AnyResult<()> {
    if check_file_exist(temp_path).await {
        if is_file_locked(temp_path).await {
            // 如果文件被占用，跳过下载
            sender.send(
                event_name,
                format!("文件正在下载中，跳过下载：{}", file_path),
                true,
            );
            return Ok(());
        } else {
            // 如果文件未被占用，删除 .tmp 文件和进度文件
            if let Err(e) = remove_file(temp_path).await {
                sender.send(
                    event_name,
                    format!("删除临时文件失败：{}，错误：{}", temp_path, e),
                    true,
                );
                return Err(Error::msg("删除临时文件失败"));
            }
            // 仅在支持断点续传时删除进度文件
            if range && check_file_exist(progress_path).await {
                if let Err(e) = remove_file(progress_path).await {
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

/// 加载下载进度（仅在支持断点续传时）
async fn load_download_progress(range: bool, progress_path: &str) -> AnyResult<Vec<(u64, u64)>> {
    if range {
        load_progress(progress_path).await
    } else {
        Ok(vec![])
    }
}

/// 执行多线程下载任务
async fn perform_multithreaded_download(
    url: String,
    length: u64,
    concurrent: u64,
    progress: &mut Vec<(u64, u64)>,
    progress_path: &str,
    file: Arc<Mutex<File>>,
) -> AnyResult<bool> {
    let mut handles = vec![];
    let chunk_size = length / concurrent;

    for i in 0..concurrent {
        let start = chunk_size * i;
        let end = if i == concurrent - 1 {
            length - 1
        } else {
            chunk_size * (i + 1) - 1
        };

        // 检查是否已经下载过该切片
        if progress.iter().any(|&(s, e)| s == start && e == end) {
            continue;
        }

        let file = Arc::clone(&file);
        handles.push(tokio::spawn(download(
            url.clone(),
            (start, end),
            true,
            file.clone(),
        )));

        // 更新进度记录
        progress.push((start, end));
        save_progress(progress_path, progress.clone()).await?;
    }

    let ret = join_all(handles).await;
    drop(file);
    let err = ret.into_iter().flatten().any(|n| n.is_err());
    Ok(err)
}

/// 执行单线程下载任务
async fn perform_singlethreaded_download(
    url: String,
    length: u64,
    file: Arc<Mutex<File>>,
) -> AnyResult<bool> {
    let err = download(url, (0, length - 1), false, file).await.is_err();
    Ok(err)
}

/// 开始下载任务
async fn run(
    payload: DownloadPayload,
    path: &str,
    sender: MessageSender,
    event_name: String,
) -> AnyResult<()> {
    let (range, url, length) =
        check_request_info(&payload.url, sender.clone(), event_name.clone()).await?;
    let temp_path = path.to_string() + ".tmp";
    let progress_path = path.to_string() + ".progress"; // 进度记录文件
    let file_path = path.to_string();

    // 检查并处理 .tmp 文件和进度文件
    handle_existing_files(
        &temp_path,
        &progress_path,
        range,
        &file_path,
        &sender,
        &event_name,
    )
    .await?;

    // 如果目标文件已存在，跳过下载
    if check_file_exist(path).await {
        sender.send(
            &event_name,
            format!("文件已存在，跳过下载：{}", file_path),
            true,
        );
        return Ok(());
    }

    // 加载下载进度
    let mut progress = load_download_progress(range, &progress_path).await?;
    let file = Arc::new(Mutex::new(File::create(&temp_path).await?));

    let is_error = if range {
        sender.send(&event_name, format!("多线程下载中：{}", file_path), true);
        perform_multithreaded_download(
            url.clone(),
            length,
            payload.concurrent,
            &mut progress,
            &progress_path,
            file.clone(),
        )
        .await?
    } else {
        sender.send(
            &event_name,
            format!("该文件不支持多线程下载，单线程下载中：{}", file_path),
            true,
        );
        perform_singlethreaded_download(url.clone(), length, file.clone()).await?
    };

    // 下载完成后重命名文件
    rename_file(&temp_path, path).await?;

    // 下载完成后删除进度记录文件（仅在支持断点续传时）
    if !is_error {
        if range && check_file_exist(&progress_path).await {
            remove_file(&progress_path).await?;
        }
        sender.send(&event_name, format!("下载完成：{}", file_path), true);
        Ok(())
    } else {
        remove_file(path).await?;
        Err(Error::msg("下载失败"))
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
