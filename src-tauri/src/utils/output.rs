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

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Serialize;
    use std::collections::HashMap;

    #[derive(Serialize, Clone, Debug, PartialEq)]
    struct TestData {
        name: String,
        value: i32,
    }

    #[test]
    fn test_message_success_with_data() {
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        let message = Message::success(Some(data.clone()));

        assert_eq!(message.code, 200);
        assert_eq!(message.message, "success");
        assert_eq!(message.data, Some(data));
    }

    #[test]
    fn test_message_success_without_data() {
        let message: Message<String> = Message::success(None);

        assert_eq!(message.code, 200);
        assert_eq!(message.message, "success");
        assert!(message.data.is_none());
    }

    #[test]
    fn test_message_failure() {
        let message = Message::<String>::failure("错误信息");

        assert_eq!(message.code, 500);
        assert_eq!(message.message, "错误信息");
        assert!(message.data.is_none());
    }

    #[test]
    fn test_message_failure_with_empty_message() {
        let message = Message::<String>::failure("");

        assert_eq!(message.code, 500);
        assert_eq!(message.message, "");
        assert!(message.data.is_none());
    }

    #[test]
    fn test_message_custom() {
        let data = vec!["item1", "item2"];
        let message = Message::custom(404, "未找到", Some(data.clone()));

        assert_eq!(message.code, 404);
        assert_eq!(message.message, "未找到");
        assert_eq!(message.data, Some(data));
    }

    #[test]
    fn test_message_custom_without_data() {
        let message = Message::<HashMap<String, i32>>::custom(403, "禁止访问", None);

        assert_eq!(message.code, 403);
        assert_eq!(message.message, "禁止访问");
        assert!(message.data.is_none());
    }

    #[test]
    fn test_message_serialization() {
        let message = Message::success(Some(TestData {
            name: "test".to_string(),
            value: 100,
        }));

        let json = serde_json::to_string(&message).expect("序列化失败");
        assert!(json.contains("\"code\":200"));
        assert!(json.contains("\"message\":\"success\""));
        assert!(json.contains("\"name\":\"test\""));
        assert!(json.contains("\"value\":100"));
    }

    #[test]
    fn test_message_different_types() {
        let string_msg: Message<String> = Message::success(Some("hello".to_string()));
        let int_msg: Message<i32> = Message::success(Some(42));
        let bool_msg: Message<bool> = Message::success(Some(true));

        assert_eq!(string_msg.data, Some("hello".to_string()));
        assert_eq!(int_msg.data, Some(42));
        assert_eq!(bool_msg.data, Some(true));
    }

    #[test]
    fn test_message_serialize_with_hashmap() {
        let mut map = HashMap::new();
        map.insert("key1".to_string(), 100);
        map.insert("key2".to_string(), 200);
        let message = Message::success(Some(map));

        let json = serde_json::to_string(&message).expect("序列化失败");
        assert!(json.contains("\"code\":200"));
        assert!(json.contains("\"message\":\"success\""));
    }

    #[test]
    fn test_message_with_nested_data() {
        #[derive(Serialize, Clone, Debug, PartialEq)]
        struct NestedData {
            items: Vec<i32>,
            config: HashMap<String, bool>,
        }

        let mut config = HashMap::new();
        config.insert("enabled".to_string(), true);

        let data = NestedData {
            items: vec![1, 2, 3],
            config,
        };
        let message = Message::success(Some(data));

        assert_eq!(message.code, 200);
        assert_eq!(message.message, "success");
        assert!(message.data.is_some());
    }
}
