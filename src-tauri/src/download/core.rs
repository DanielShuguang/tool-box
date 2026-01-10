use std::sync::Arc;

use anyhow::{Error, Result as AnyResult};
use futures::{future::join_all, lock::Mutex};

use tokio::fs::{remove_file, File};

use crate::utils::output::MessageSender;

use super::downloader::{download, handle_existing_files, load_download_progress, rename_file};
use super::limiter::SpeedLimiter;
use super::utils::{report_progress};
use super::{DownloadConfig, DownloadPayload, DownloadProgress, DownloadStatus};

pub async fn perform_multithreaded_download(
    url: String,
    length: u64,
    concurrent: u64,
    progress: &mut Vec<(u64, u64)>,
    progress_path: &str,
    file: Arc<Mutex<File>>,
    speed_limiter: Option<Arc<SpeedLimiter>>,
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

        if progress.iter().any(|&(s, e)| s == start && e == end) {
            continue;
        }

        let file = Arc::clone(&file);
        let limiter = speed_limiter.as_ref().map(|l| Arc::clone(l));
        handles.push(tokio::spawn(download(
            url.clone(),
            (start, end),
            true,
            file.clone(),
            limiter,
        )));

        progress.push((start, end));
        super::downloader::save_progress(progress_path, progress.clone()).await?;
    }

    let ret = join_all(handles).await;
    drop(file);
    let err = ret.into_iter().flatten().any(|n| n.is_err());
    Ok(err)
}

pub async fn perform_singlethreaded_download(
    url: String,
    length: u64,
    file: Arc<Mutex<File>>,
    speed_limiter: Option<Arc<SpeedLimiter>>,
) -> AnyResult<bool> {
    let err = download(
        url, 
        (0, length - 1), 
        false, 
        file, 
        speed_limiter
    ).await.is_err();
    Ok(err)
}

pub async fn run(
    payload: DownloadPayload,
    path: &str,
    sender: MessageSender,
    event_name: String,
) -> AnyResult<()> {
    let (range, url, length) =
        super::downloader::check_request_info(&payload.url, sender.clone(), event_name.clone()).await?;
    let temp_path = path.to_string() + ".tmp";
    let progress_path = path.to_string() + ".progress";
    let file_path = path.to_string();

    handle_existing_files(
        &temp_path,
        &progress_path,
        range,
        &file_path,
        &sender,
        &event_name,
    )
    .await?;

    if super::downloader::check_file_exist(path).await {
        sender.send(
            &event_name,
            format!("文件已存在，跳过下载：{}", file_path),
            true,
        );
        return Ok(());
    }

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
            None,
        )
        .await?
    } else {
        sender.send(
            &event_name,
            format!("该文件不支持多线程下载，单线程下载中：{}", file_path),
            true,
        );
        perform_singlethreaded_download(url.clone(), length, file.clone(), None).await?
    };

    rename_file(&temp_path, path).await?;

    if !is_error {
        if range && super::downloader::check_file_exist(&progress_path).await {
            remove_file(&progress_path).await?;
        }
        sender.send(&event_name, format!("下载完成：{}", file_path), true);
        Ok(())
    } else {
        remove_file(path).await?;
        Err(Error::msg("下载失败"))
    }
}

pub async fn run_download(
    config: DownloadConfig,
    path: &str,
    sender: MessageSender,
    event_name: String,
    progress_event: String,
    speed_limiter: Option<SpeedLimiter>,
) -> AnyResult<()> {
    let (range, url, length) =
        super::downloader::check_request_info(&config.url, sender.clone(), event_name.clone()).await?;
    let temp_path = path.to_string() + ".tmp";
    let progress_path = path.to_string() + ".progress";
    let file_path = path.to_string();

    handle_existing_files(
        &temp_path,
        &progress_path,
        range,
        &file_path,
        &sender,
        &event_name,
    )
    .await?;

    if super::downloader::check_file_exist(path).await {
        sender.send(
            &event_name,
            format!("文件已存在，跳过下载：{}", file_path),
            true,
        );
        report_progress(
            &sender,
            &progress_event,
            DownloadProgress {
                current: length,
                total: length,
                percentage: 100.0,
                speed_mbps: 0.0,
                status: DownloadStatus::Completed,
            },
        )
        .await;
        return Ok(());
    }

    let mut progress = load_download_progress(range, &progress_path).await?;
    let file = Arc::new(Mutex::new(File::create(&temp_path).await?));
    let limiter = speed_limiter.map(Arc::new);

    let is_error = if range {
        sender.send(&event_name, format!("多线程下载中：{}", file_path), true);
        perform_multithreaded_download(
            url.clone(),
            length,
            config.concurrent,
            &mut progress,
            &progress_path,
            file.clone(),
            limiter,
        )
        .await?
    } else {
        sender.send(
            &event_name,
            format!("该文件不支持多线程下载，单线程下载中：{}", file_path),
            true,
        );
        perform_singlethreaded_download(url.clone(), length, file.clone(), limiter).await?
    };

    rename_file(&temp_path, path).await?;

    if !is_error {
        if range && super::downloader::check_file_exist(&progress_path).await {
            remove_file(&progress_path).await?;
        }
        sender.send(&event_name, format!("下载完成：{}", file_path), true);
        report_progress(
            &sender,
            &progress_event,
            DownloadProgress {
                current: length,
                total: length,
                percentage: 100.0,
                speed_mbps: 0.0,
                status: DownloadStatus::Completed,
            },
        )
        .await;
        Ok(())
    } else {
        remove_file(path).await?;
        report_progress(
            &sender,
            &progress_event,
            DownloadProgress {
                current: 0,
                total: length,
                percentage: 0.0,
                speed_mbps: 0.0,
                status: DownloadStatus::Failed("下载失败".to_string()),
            },
        )
        .await;
        Err(Error::msg("下载失败"))
    }
}
