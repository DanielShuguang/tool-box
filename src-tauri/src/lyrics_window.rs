use std::sync::Arc;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WebviewWindow};
use tokio::sync::Mutex;

#[derive(serde::Serialize, serde::Deserialize, Clone, Default)]
pub struct LyricsWindowPosition {
    pub x: Option<i32>,
    pub y: Option<i32>,
}

impl LyricsWindowPosition {
    fn store_key() -> &'static str {
        "lyrics-window-position"
    }

    async fn save(app: &tauri::AppHandle, position: &LyricsWindowPosition) -> Result<(), String> {
        let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
        let store_path = app_data.join("settings.json");

        let mut settings = serde_json::Map::new();
        if store_path.exists() {
            let content = tokio::fs::read_to_string(&store_path)
                .await
                .map_err(|e| e.to_string())?;
            if let Ok(json) = serde_json::from_str::<serde_json::Map<String, serde_json::Value>>(&content) {
                settings = json;
            }
        }

        settings.insert(
            Self::store_key().to_string(),
            serde_json::to_value(position).map_err(|e| e.to_string())?,
        );

        tokio::fs::write(&store_path, serde_json::to_string_pretty(&settings).unwrap())
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    async fn load(app: &tauri::AppHandle) -> Result<Self, String> {
        let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
        let store_path = app_data.join("settings.json");

        if !store_path.exists() {
            return Ok(Self::default());
        }

        let content = tokio::fs::read_to_string(&store_path)
            .await
            .map_err(|e| e.to_string())?;

        let json: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| e.to_string())?;

        if let Some(pos) = json.get(Self::store_key()) {
            serde_json::from_value(pos.clone()).map_err(|e| e.to_string())
        } else {
            Ok(Self::default())
        }
    }
}

pub struct LyricsWindowState {
    pub window: Option<WebviewWindow>,
}

impl LyricsWindowState {
    pub fn new() -> Self {
        Self { window: None }
    }
}

#[tauri::command]
pub async fn create_lyrics_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<Mutex<LyricsWindowState>>>,
) -> Result<(), String> {
    let mut state_guard = state.lock().await;

    if state_guard.window.is_some() {
        return Err("歌词窗口已存在".to_string());
    }

    // 加载保存的位置或计算默认位置
    let saved_position = LyricsWindowPosition::load(&app).await?;

    let (x, y) = if saved_position.x.is_some() && saved_position.y.is_some() {
        (saved_position.x.unwrap(), saved_position.y.unwrap())
    } else {
        // 获取主显示器信息，计算屏幕底部中央位置
        match app.primary_monitor() {
            Ok(Some(monitor)) => {
                let width = 600.0;
                let height = 80.0;
                // 屏幕水平居中，垂直靠近底部（留出任务栏空间，假设任务栏约48px）
                let x = monitor.position().x + (monitor.size().width as i32 - width as i32) / 2;
                let y = monitor.position().y + monitor.size().height as i32 - height as i32 - 48;
                (x, y)
            }
            _ => (0, 0),
        }
    };

    let window = WebviewWindowBuilder::new(
        &app,
        "lyrics-window",
        WebviewUrl::App("lyrics.html".into())
    )
    .title("桌面歌词")
    .position(x as f64, y as f64)
    .inner_size(600.0, 80.0)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| e.to_string())?;

    let app_handle = app.clone();
    let state_clone = state.inner().clone();
    let window_clone = window.clone();

    window.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Moved(position) => {
                let app_handle_clone = app_handle.clone();
                let position_data = LyricsWindowPosition {
                    x: Some(position.x as i32),
                    y: Some(position.y as i32),
                };
                tauri::async_runtime::block_on(async move {
                    let _ = LyricsWindowPosition::save(&app_handle_clone, &position_data).await;
                });
            }
            tauri::WindowEvent::CloseRequested { .. } => {
                // 保存当前窗口位置
                if let Ok(current_pos) = window_clone.outer_position() {
                    let app_handle_clone = app_handle.clone();
                    let position_data = LyricsWindowPosition {
                        x: Some(current_pos.x),
                        y: Some(current_pos.y),
                    };
                    tauri::async_runtime::block_on(async move {
                        let _ = LyricsWindowPosition::save(&app_handle_clone, &position_data).await;
                    });
                }

                let app_handle_clone = app_handle.clone();
                let state_clone_inner = state_clone.clone();
                tauri::async_runtime::block_on(async move {
                    let mut state_guard = state_clone_inner.lock().await;
                    state_guard.window = None;
                    let _ = app_handle_clone.emit_to("main", "lyrics-window-closed", ());
                });
            }
            _ => {}
        }
    });

    state_guard.window = Some(window);
    Ok(())
}

#[tauri::command]
pub async fn close_lyrics_window(
    state: tauri::State<'_, Arc<Mutex<LyricsWindowState>>>,
) -> Result<(), String> {
    let mut state_guard = state.lock().await;
    
    if let Some(window) = state_guard.window.take() {
        window.close().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn is_lyrics_window_open(
    state: tauri::State<'_, Arc<Mutex<LyricsWindowState>>>,
) -> Result<bool, String> {
    let state_guard = state.lock().await;
    Ok(state_guard.window.is_some())
}
