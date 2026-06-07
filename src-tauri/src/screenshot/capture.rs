use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl};

pub struct ScreenshotState {
    pub data: Mutex<Option<Vec<u8>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowInfo {
    pub id: isize,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Find the screen containing the given coordinates
fn find_screen_by_coords(x: i32, y: i32) -> Result<Screen, String> {
    let screens = Screen::all().map_err(|e| format!("获取屏幕列表失败: {}", e))?;
    screens
        .into_iter()
        .find(|s| {
            let info = &s.display_info;
            x >= info.x
                && y >= info.y
                && x < info.x + info.width as i32
                && y < info.y + info.height as i32
        })
        .ok_or_else(|| format!("坐标 ({}, {}) 不在任何屏幕范围内", x, y))
}

#[cfg(target_os = "windows")]
mod platform {
    use super::*;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows_sys::Win32::Foundation::{BOOL, HWND, TRUE, FALSE};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowRect, GetWindowTextW, IsWindowVisible,
    };

    struct WindowInfoRaw {
        hwnd: isize,
        title: String,
        rect: (i32, i32, i32, i32),
    }

    unsafe extern "system" fn enum_window_callback(hwnd: HWND, lparam: isize) -> BOOL {
        let windows = &mut *(lparam as *mut Vec<WindowInfoRaw>);

        if IsWindowVisible(hwnd) == FALSE {
            return TRUE;
        }

        let mut buf = [0u16; 512];
        let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
        if len <= 0 {
            return TRUE;
        }

        let title = OsString::from_wide(&buf[..len as usize])
            .to_string_lossy()
            .to_string();

        if title.is_empty() {
            return TRUE;
        }

        let mut rect = windows_sys::Win32::Foundation::RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };

        if GetWindowRect(hwnd, &mut rect) == FALSE {
            return TRUE;
        }

        windows.push(WindowInfoRaw {
            hwnd: hwnd as isize,
            title,
            rect: (rect.left, rect.top, rect.right, rect.bottom),
        });

        TRUE
    }

    pub fn enumerate_windows() -> Vec<WindowInfo> {
        let mut windows = Vec::new();
        unsafe {
            EnumWindows(Some(enum_window_callback), &mut windows as *mut Vec<WindowInfoRaw> as isize);
        }

        windows
            .into_iter()
            .map(|w: WindowInfoRaw| WindowInfo {
                id: w.hwnd,
                title: w.title,
                x: w.rect.0,
                y: w.rect.1,
                width: (w.rect.2 - w.rect.0) as u32,
                height: (w.rect.3 - w.rect.1) as u32,
            })
            .collect()
    }
}

/// Capture the entire primary screen
#[tauri::command]
pub async fn capture_screen() -> Result<Vec<u8>, String> {
    let screens = Screen::all().map_err(|e| format!("获取屏幕列表失败: {}", e))?;
    let screen = screens.first().ok_or("未找到可用屏幕")?;

    let image = screen
        .capture()
        .map_err(|e| format!("屏幕截图失败: {}", e))?;

    let png_data = image
        .to_png()
        .map_err(|e| format!("PNG 编码失败: {}", e))?;

    Ok(png_data)
}

/// Capture a specific region of the screen
#[tauri::command]
pub async fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<Vec<u8>, String> {
    let screen = find_screen_by_coords(x, y)?;

    let adjusted_x = x - screen.display_info.x;
    let adjusted_y = y - screen.display_info.y;

    let image = screen
        .capture_area(adjusted_x, adjusted_y, width, height)
        .map_err(|e| format!("区域截图失败: {}", e))?;

    let png_data = image
        .to_png()
        .map_err(|e| format!("PNG 编码失败: {}", e))?;

    Ok(png_data)
}

/// Capture a specific window by HWND
#[tauri::command]
pub async fn capture_window(window_id: isize) -> Result<Vec<u8>, String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Foundation::{HWND, RECT};
        use windows_sys::Win32::UI::WindowsAndMessaging::GetWindowRect;

        let mut rect = RECT {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };

        if unsafe { GetWindowRect(window_id as HWND, &mut rect) } == 0 {
            return Err("获取窗口矩形失败".to_string());
        }

        let width = (rect.right - rect.left) as u32;
        let height = (rect.bottom - rect.top) as u32;

        if width == 0 || height == 0 {
            return Err("窗口尺寸无效".to_string());
        }

        capture_region(rect.left, rect.top, width, height).await
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = window_id;
        Err("窗口截图仅在 Windows 上支持".to_string())
    }
}

/// Get list of visible windows
#[tauri::command]
pub async fn get_windows() -> Result<Vec<WindowInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        Ok(platform::enumerate_windows())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("窗口枚举仅在 Windows 上支持".to_string())
    }
}

/// Create a fullscreen transparent overlay window for region capture
#[tauri::command]
pub async fn create_capture_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("screenshot-capture") {
        window.show().map_err(|e: tauri::Error| e.to_string())?;
        window.set_focus().map_err(|e: tauri::Error| e.to_string())?;
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(
        &app,
        "screenshot-capture",
        WebviewUrl::App("/#/screenshot/capture".into()),
    )
    .title("截图选择")
    .fullscreen(true)
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .build()
    .map_err(|e| format!("创建截图窗口失败: {}", e))?;

    Ok(())
}

/// Create a preview window for the captured screenshot
#[tauri::command]
pub async fn create_preview_window(app: AppHandle, image_data: Vec<u8>) -> Result<(), String> {
    // 解码图片获取尺寸
    let img = image::load_from_memory(&image_data)
        .map_err(|e| format!("解码图片失败: {}", e))?;
    let img_width = img.width() as f64;
    let img_height = img.height() as f64;

    // 计算合适的窗口大小（图片尺寸 + UI 边距）
    // 预览窗口有 header(36px) + padding(8px*2) + actions(36px) + border(8px) ≈ 96px
    let ui_height = 120.0;
    let ui_width_padding = 20.0;

    // 限制最大尺寸为屏幕的 80%，最小尺寸 300x200
    let max_width = 1200.0;
    let max_height = 900.0;
    let min_width = 300.0;
    let min_height = 200.0;

    let window_width = (img_width + ui_width_padding).clamp(min_width, max_width);
    let window_height = (img_height + ui_height).clamp(min_height, max_height);

    // 存储截图数据到托管状态，供前端通过命令获取
    let state = app.state::<ScreenshotState>();
    *state.data.lock().map_err(|e| format!("状态锁定失败: {}", e))? = Some(image_data);

    if let Some(window) = app.get_webview_window("screenshot-preview") {
        window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: window_width as u32,
                height: window_height as u32,
            }))
            .map_err(|e: tauri::Error| e.to_string())?;
        window.show().map_err(|e: tauri::Error| e.to_string())?;
        window.set_focus().map_err(|e: tauri::Error| e.to_string())?;
        window
            .emit("screenshot-ready", ())
            .map_err(|e| format!("发送通知失败: {}", e))?;
        return Ok(());
    }

    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "screenshot-preview",
        WebviewUrl::App("/#/screenshot/preview".into()),
    )
    .title("截图预览")
    .inner_size(window_width, window_height)
    .decorations(false)
    .always_on_top(true)
    .resizable(true)
    .build()
    .map_err(|e| format!("创建预览窗口失败: {}", e))?;

    // 等待前端 JS 加载完成再发送事件
    let window_clone = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(800)).await;
        if let Err(e) = window_clone.emit("screenshot-ready", ()) {
            eprintln!("emit screenshot-ready 失败: {}", e);
        }
    });

    Ok(())
}

/// 从托管状态中获取截图数据（不消费，支持多次读取）
#[tauri::command]
pub async fn get_screenshot_data(state: tauri::State<'_, ScreenshotState>) -> Result<Vec<u8>, String> {
    state
        .data
        .lock()
        .map_err(|e| format!("状态锁定失败: {}", e))?
        .as_ref()
        .cloned()
        .ok_or_else(|| "没有截图数据".into())
}

/// Create an editor window for the screenshot
#[tauri::command]
pub async fn create_editor_window(app: AppHandle) -> Result<(), String> {
    // 从状态获取图片数据以计算窗口大小
    let state = app.state::<ScreenshotState>();
    let image_data = state
        .data
        .lock()
        .map_err(|e| format!("状态锁定失败: {}", e))?
        .clone();

    // 计算合适的窗口大小
    let (window_width, window_height) = if let Some(data) = &image_data {
        if let Ok(img) = image::load_from_memory(data) {
            let img_width = img.width() as f64;
            let img_height = img.height() as f64;
            // 编辑器有 toolbar(48px) + properties(80px) + actions(48px) + padding(40px) ≈ 220px
            let ui_height = 220.0;
            let ui_width_padding = 60.0;
            let w = (img_width + ui_width_padding).clamp(600.0, 1400.0);
            let h = (img_height + ui_height).clamp(500.0, 1000.0);
            (w, h)
        } else {
            (800.0, 600.0)
        }
    } else {
        (800.0, 600.0)
    };

    if let Some(window) = app.get_webview_window("screenshot-editor") {
        window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: window_width as u32,
                height: window_height as u32,
            }))
            .map_err(|e: tauri::Error| e.to_string())?;
        window.show().map_err(|e: tauri::Error| e.to_string())?;
        window.set_focus().map_err(|e: tauri::Error| e.to_string())?;
        window
            .emit("screenshot-ready", ())
            .map_err(|e| format!("发送通知失败: {}", e))?;
        return Ok(());
    }

    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "screenshot-editor",
        WebviewUrl::App("/#/screenshot/editor".into()),
    )
    .title("截图编辑")
    .inner_size(window_width, window_height)
    .decorations(true)
    .build()
    .map_err(|e| format!("创建编辑器窗口失败: {}", e))?;

    // 等待前端 JS 加载完成再发送事件
    let window_clone = window.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(800)).await;
        if let Err(e) = window_clone.emit("screenshot-ready", ()) {
            eprintln!("emit screenshot-ready 失败: {}", e);
        }
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_capture_screen() {
        match capture_screen().await {
            Ok(data) => assert!(!data.is_empty(), "截图数据不应为空"),
            Err(e) => println!("截图测试跳过（无显示器）: {}", e),
        }
    }

    #[tokio::test]
    async fn test_capture_region() {
        match capture_region(0, 0, 100, 100).await {
            Ok(data) => assert!(!data.is_empty(), "区域截图数据不应为空"),
            Err(e) => println!("区域截图测试跳过（无显示器）: {}", e),
        }
    }

    #[tokio::test]
    async fn test_capture_region_out_of_bounds() {
        let result = capture_region(-9999, -9999, 100, 100).await;
        assert!(result.is_err(), "超出屏幕范围的坐标应返回错误");
    }

    #[tokio::test]
    async fn test_get_windows() {
        let result = get_windows().await;
        #[cfg(target_os = "windows")]
        {
            assert!(result.is_ok());
            let windows = result.unwrap();
            assert!(!windows.is_empty(), "应至少有一个可见窗口");
        }
        #[cfg(not(target_os = "windows"))]
        {
            assert!(result.is_err());
        }
    }
}
