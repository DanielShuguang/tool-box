use md5::Context;

const USER_NAME: &str = "Daniel Hu";

pub fn generate_app_key(content: &str) -> String {
    let mut hasher = Context::new();
    hasher.consume(USER_NAME.as_bytes());
    let result = hasher.finalize();
    let hash = format!("{:x}", result);
    format!("{}_{}", content, hash)
}
