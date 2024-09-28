use serde::Serialize;

#[derive(Serialize)]
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

    pub fn custom(code: usize, message: &str, data: Option<T>) -> Self {
        Self {
            code,
            message: message.to_string(),
            data,
        }
    }
}

pub struct OutputEvent<T, E = String> {
    pub data: T,
    pub event: E,
}

impl<T, E> OutputEvent<T, E> {
    pub fn new(event: E, data: T) -> Self {
        Self { data, event }
    }
}
