use crate::utils::{crypto::generate_app_key, output::Message};
use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,
};

#[cfg(target_os = "windows")]
use std::path::Path;
#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

const APP_NAME: &str = "ToolBox";

#[derive(Debug, Serialize, Deserialize)]
pub struct AutostartPayload {
    pub enable: bool,
}

#[derive(Debug, Serialize)]
pub struct AutostartStatus {
    pub enabled: bool,
}

async fn run(payload: AutostartPayload) -> anyhow::Result<()> {
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = Path::new("Software")
            .join("Microsoft")
            .join("Windows")
            .join("CurrentVersion")
            .join("Run");
        let key = hkcu.open_subkey_with_flags(&path, KEY_WRITE)?;

        if payload.enable {
            let exe_path = std::env::current_exe()?;
            let exe_path = exe_path.to_string_lossy().to_string();
            let key_name = generate_app_key(APP_NAME);
            key.set_value(&key_name, &exe_path)?;
        } else {
            let key_name = generate_app_key(APP_NAME);
            key.delete_value(&key_name)?;
        }
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    Err(anyhow::Error::msg("Autostart is only supported on Windows"))
}

async fn check_autostart_status() -> anyhow::Result<bool> {
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = Path::new("Software")
            .join("Microsoft")
            .join("Windows")
            .join("CurrentVersion")
            .join("Run");
        let key = hkcu.open_subkey(&path)?;

        let key_name = generate_app_key(APP_NAME);
        match key.get_value::<String, &str>(&key_name) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    #[cfg(not(target_os = "windows"))]
    Ok(false)
}

#[tauri::command]
pub async fn set_auto_start<R: tauri::Runtime>(
    payload: AutostartPayload,
    _: AppHandle<R>,
) -> Result<Message<String>, String> {
    match run(payload).await {
        Ok(_) => Ok(Message::success(Some("设置成功".to_string()))),
        Err(e) => Ok(Message::failure(&format!("设置失败: {}", e))),
    }
}

#[tauri::command]
pub async fn is_auto_start_enabled() -> Result<Message<AutostartStatus>, String> {
    match check_autostart_status().await {
        Ok(enabled) => Ok(Message::success(Some(AutostartStatus { enabled }))),
        Err(e) => Ok(Message::failure(&format!("获取状态失败: {}", e))),
    }
}

pub fn init<R: tauri::Runtime>() -> TauriPlugin<R> {
    println!("autostart plugin init");
    Builder::<R>::new("autostart")
        .setup(|_app, _api| Ok(()))
        .build()
}
