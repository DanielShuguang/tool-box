use std::{io::SeekFrom, path::Path, sync::Arc};

use anyhow::{Error, Result as AnyResult};
use futures::{future::join_all, lock::Mutex};
use reqwest::{
    header::{HeaderValue, ACCEPT_RANGES, CONTENT_LENGTH, RANGE},
    IntoUrl, Response,
};
use serde::Deserialize;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, State,
};
use tokio::{
    fs::{self, remove_file, File},
    io::{AsyncSeekExt, AsyncWriteExt},
    sync::mpsc,
};

use crate::utils::output::{Message, OutputEvent};

/// 检测文件是否支持断点续传，是否是重定向链接
async fn check_request_info<U: IntoUrl>(
    url: U,
    output: State<'_, Output>,
) -> AnyResult<(bool, String, u64)> {
    let req = reqwest::Client::new().head(url);
    let resp = req.send().await?;
    if !resp.status().is_success() {
        return Err(Error::msg("请求失败"));
    }
    let url = check_redirected_url(&resp, output).await?;
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
async fn check_redirected_url(resp: &Response, output: State<'_, Output>) -> AnyResult<String> {
    if resp.status().is_redirection() {
        output
            .send(OutputEvent::new(
                Events::DownloadOutput,
                format!("检测到重定向链接: {}", resp.url()),
            ))
            .await?;

        let headers = resp.headers();
        if let Some(val) = headers.get(reqwest::header::LOCATION) {
            return val
                .to_str()
                .map(|val| val.to_string())
                .ok()
                .ok_or(Error::msg("获取重定向URL失败"));
        }
    }
    Ok(resp.url().to_string().into())
}

/// 下载指定的文件切片
async fn download<U: IntoUrl>(
    url: U,
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

async fn rename_file<P: AsRef<Path>>(temp_path: P, real_path: P) -> AnyResult<()> {
    match fs::rename(temp_path, real_path).await {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::msg(format!("重命名文件失败: {}", e))),
    }
}

async fn check_file_exist<P: AsRef<Path>>(path: P) -> bool {
    fs::metadata(path).await.is_ok()
}

/// 开始下载任务
async fn run<U: IntoUrl, P: AsRef<Path>>(
    url: U,
    path: P,
    task_num: u64,
    output: State<'_, Output>,
) -> AnyResult<()> {
    let url = url.into_url()?;
    let mut handles = vec![];
    let (range, url, length) = check_request_info(url.clone(), output.clone()).await?;
    let temp_path = path.as_ref().to_string_lossy().to_string() + ".tmp";
    let file_name = path
        .as_ref()
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    if check_file_exist(&temp_path).await || check_file_exist(&path).await {
        output
            .send(OutputEvent::new(
                Events::DownloadOutput,
                format!("文件已存在，跳过下载：{}", file_name),
            ))
            .await?;
        return Ok(());
    }
    let file = Arc::new(Mutex::new(File::create(&temp_path).await?));
    let is_error = if range {
        output
            .send(OutputEvent::new(
                Events::DownloadOutput,
                format!("多线程下载中：{}", file_name),
            ))
            .await?;
        let length = length / task_num;
        for i in 0..task_num {
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
        rename_file(&temp_path, &path.as_ref().to_string_lossy().to_string()).await?;
        err
    } else {
        output
            .send(OutputEvent::new(
                Events::DownloadOutput,
                format!("该文件不支持多线程下载，单线程下载中：{}", file_name),
            ))
            .await?;
        let err = download(url.clone(), (0, length - 1), false, file)
            .await
            .is_err();
        rename_file(&temp_path, &path.as_ref().to_string_lossy().to_string()).await?;
        err
    };
    if is_error {
        remove_file(&path).await?;
        Err(Error::msg("下载失败"))
    } else {
        output
            .send(OutputEvent::new(
                Events::DownloadOutput,
                format!("下载完成：{}", file_name),
            ))
            .await?;
        Ok(())
    }
}

#[derive(Deserialize)]
struct DownloadPayload {
    url: String,
    dir_path: String,
    concurrent: u64,
}

#[tauri::command]
async fn download_file(
    payload: DownloadPayload,
    output: State<'_, Output>,
) -> Result<Message<String>, ()> {
    let DownloadPayload {
        url,
        dir_path,
        concurrent,
    } = payload;
    let file_name = match url.split('/').last() {
        Some(v) => v,
        None => return Ok(Message::failure("url错误")),
    };
    let path = format!("{}/{}", dir_path, file_name);
    match run(url, path, concurrent, output).await {
        Ok(_) => Ok(Message::success(Some(String::from("下载成功")))),
        Err(e) => Ok(Message::failure(&e.to_string())),
    }
}

enum Events {
    DownloadOutput,
}

struct Output {
    tx: Mutex<mpsc::Sender<OutputEvent<String, Events>>>,
}

impl Output {
    pub async fn send(
        &self,
        event: OutputEvent<String, Events>,
    ) -> Result<(), mpsc::error::SendError<OutputEvent<String, Events>>> {
        self.tx
            .lock()
            .await
            .send(OutputEvent::new(event.event, event.data))
            .await?;
        Ok(())
    }
}

pub fn init<R: tauri::Runtime>() -> TauriPlugin<R> {
    println!("download plugin init");

    let (output_tx, mut output_rx) = mpsc::channel(5);
    Builder::new("download")
        .invoke_handler(tauri::generate_handler![download_file])
        .setup(|app| {
            app.manage(Output {
                tx: Mutex::new(output_tx),
            });
            let handle = app.app_handle();

            tauri::async_runtime::spawn(async move {
                loop {
                    if let Some(output) = output_rx.recv().await {
                        println!("[download] {}", output.data);
                        let event_name = match output.event {
                            Events::DownloadOutput => "download-output",
                        };
                        match handle.emit_all(event_name, output.data) {
                            Ok(_) => {}
                            Err(e) => println!("[download] 事件发送失败：{e}"),
                        };
                    }
                }
            });

            Ok(())
        })
        .build()
}
