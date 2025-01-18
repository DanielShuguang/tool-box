use std::time::Duration;

use anyhow::Result as AnyResult;
use async_recursion::async_recursion;
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, State,
};
use tokio::{
    fs, runtime,
    sync::{
        mpsc::{self, error::TryRecvError},
        watch, Mutex,
    },
    time,
};

use crate::utils::output::{Message, MessageSender};

static SEARCH_STREAM_EVENT: &'static str = "search-disk-file-output";

#[derive(Deserialize)]
pub struct SearchDiskFilePayload {
    name: String,
    concurrent: usize,
    disks: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SearchResultModel {
    path: String,
    is_dir: bool,
    size: String,
}

// 递归遍历文件夹，模糊查询
#[async_recursion]
async fn search_dir(
    path: String,
    name: String,
    tx: mpsc::Sender<Vec<SearchResultModel>>,
    cancel_rx: watch::Receiver<bool>,
) -> AnyResult<()> {
    if *cancel_rx.borrow() {
        return Ok(());
    }

    let mut files = fs::read_dir(path.clone()).await?;

    let mut dirs = vec![];
    let mut search_result = vec![];
    while let Some(file) = files.next_entry().await? {
        let file_name = match file.file_name().into_string() {
            Ok(str) => str,
            Err(_) => continue,
        };
        let file_path = format!("{}{}{}", path.clone(), std::path::MAIN_SEPARATOR, file_name);
        if file_name.contains(&name) {
            let is_dir = file.metadata().await?.is_dir();
            search_result.push(SearchResultModel {
                path: file_path.clone(),
                is_dir,
                size: if is_dir {
                    String::from("0")
                } else {
                    file.metadata().await?.len().to_string()
                },
            });
        }
        match file.file_type().await {
            Ok(val) => {
                if val.is_dir() {
                    dirs.push(file_path);
                }
            }
            Err(_) => continue,
        }
    }

    if !search_result.is_empty() {
        tx.send(search_result).await?;
    }

    let mut handles = vec![];
    for dir_path in dirs {
        handles.push(tokio::spawn(search_dir(
            dir_path,
            name.clone(),
            tx.clone(),
            cancel_rx.clone(),
        )));
    }

    join_all(handles).await;

    Ok(())
}

async fn do_search_task(
    payload: SearchDiskFilePayload,
    cancel_rx: watch::Receiver<bool>,
    sender: MessageSender,
) -> Result<Message<()>, String> {
    let SearchDiskFilePayload {
        name,
        disks,
        concurrent: _,
    } = payload;

    let mut handles = vec![];

    let (tx, mut rx) = mpsc::channel(5);

    for disk in disks {
        handles.push(tokio::spawn(search_dir(
            disk,
            name.clone(),
            tx.clone(),
            cancel_rx.clone(),
        )));
    }

    let sen = sender.clone();
    tokio::spawn(async move {
        loop {
            match rx.try_recv() {
                Ok(result) => {
                    sen.send(SEARCH_STREAM_EVENT, result, false);
                }
                Err(TryRecvError::Empty) => continue,
                Err(TryRecvError::Disconnected) => break,
            }
        }
    });

    join_all(handles).await;
    drop(tx);

    sender.send(SEARCH_STREAM_EVENT, None::<()>, true);
    Ok(Message::success(None))
}

#[tauri::command]
pub async fn search_disk_file_real_time(
    payload: SearchDiskFilePayload,
    rx_state: State<'_, ReceiverState>,
    app_handle: tauri::AppHandle,
) -> Result<Message<()>, String> {
    let rt = match runtime::Builder::new_multi_thread()
        .worker_threads(payload.concurrent)
        .enable_all()
        .build()
    {
        Ok(v) => v,
        Err(e) => return Ok(Message::failure(&format!("创建tokio运行时失败: {}", e))),
    };

    let sender = MessageSender::new(app_handle, "file-search");

    let cancel_rx = rx_state.rx.lock().await;
    let cancel_rx1 = cancel_rx.clone();
    let sender1 = sender.clone();
    rt.spawn(do_search_task(payload, cancel_rx1, sender1));

    loop {
        time::sleep(Duration::from_millis(100)).await;
        if *cancel_rx.borrow() {
            rt.shutdown_background();
            break;
        }
    }

    sender.send(SEARCH_STREAM_EVENT, None::<()>, true);
    Ok(Message::success(None))
}

#[tauri::command]
pub async fn cancel_search_task(state: State<'_, SenderState>) -> Result<Message<String>, String> {
    if let Err(e) = state.tx.lock().await.send(true) {
        return Ok(Message::failure(&e.to_string()));
    };

    Ok(Message::success(Some(String::from("停止成功"))))
}

pub struct SenderState {
    tx: Mutex<watch::Sender<bool>>,
}

pub struct ReceiverState {
    rx: Mutex<watch::Receiver<bool>>,
}

pub fn init<R: tauri::Runtime>() -> TauriPlugin<R> {
    println!("file-search plugin init");

    let (output_tx, _) = watch::channel(false);
    Builder::new("file-search")
        .setup(|app, _| {
            let output_rx = output_tx.subscribe();
            let mut output_rx1 = output_tx.subscribe();
            let output_tx1 = output_tx.clone();

            app.manage(SenderState {
                tx: Mutex::new(output_tx),
            });
            app.manage(ReceiverState {
                rx: Mutex::new(output_rx),
            });

            tauri::async_runtime::spawn(async move {
                loop {
                    let is_cancel = output_rx1.changed().await;
                    if is_cancel.is_err() || *output_rx1.borrow() {
                        time::sleep(Duration::from_millis(500)).await;
                        output_tx1.send_replace(false);
                    }
                }
            });

            Ok(())
        })
        .build()
}
