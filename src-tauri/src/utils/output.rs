use std::fmt::Debug;

use serde::Serialize;
use tauri::Emitter;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Message<T: Serialize> {
    pub code: usize,
    pub message: String,
    pub data: Option<T>,
}

impl<T: Serialize> Message<T> {
    pub fn success(data: Option<T>) -> Self {
        Self {
            code: 200,
            message: "success".to_string(),
            data,
        }
    }

    pub fn failure(message: &str) -> Self {
        Self {
            code: 500,
            message: message.to_string(),
            data: None,
        }
    }

    #[allow(dead_code)]
    pub fn custom(code: usize, message: &str, data: Option<T>) -> Self {
        Self {
            code,
            message: message.to_string(),
            data,
        }
    }
}

#[derive(Clone)]
pub struct MessageSender {
    app_handle: tauri::AppHandle,
    plugin_name: String,
}

impl MessageSender {
    pub fn new(app_handle: tauri::AppHandle, plugin_name: &str) -> Self {
        Self {
            app_handle,
            plugin_name: plugin_name.to_string(),
        }
    }

    pub fn send<S: Serialize + Clone + Debug>(&self, event: &str, payload: S, output: bool) {
        if output {
            println!("[{}] {:?}", self.plugin_name, payload);
        }
        match self.app_handle.emit(event, payload) {
            Ok(_) => {}
            Err(e) => println!("[{}] 事件发送失败：{}", self.plugin_name, e),
        }
    }
}
