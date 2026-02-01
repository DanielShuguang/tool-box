use md5::Context;

const USER_NAME: &str = "Daniel Hu";

pub fn generate_app_key(content: &str) -> String {
    let mut hasher = Context::new();
    hasher.consume(USER_NAME.as_bytes());
    let result = hasher.finalize();
    let hash = format!("{:x}", result);
    format!("{}_{}", content, hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_app_key_with_empty_string() {
        let result = generate_app_key("");
        // 验证结果包含下划线分隔符
        assert!(result.contains('_'));
        // 验证结果以内容开头
        assert!(result.starts_with('_'));
        // 验证哈希部分不为空
        let parts: Vec<&str> = result.split('_').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0], "");
        assert!(!parts[1].is_empty());
    }

    #[test]
    fn test_generate_app_key_with_content() {
        let content = "test_app";
        let result = generate_app_key(content);

        // 验证结果包含下划线分隔符
        assert!(result.contains('_'));
        // 验证结果以内容开头
        assert!(result.starts_with(content));
        // 验证格式为 content_hash (从右侧分割，最多分成2部分)
        let parts: Vec<&str> = result.rsplitn(2, '_').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[1], content);
        assert!(!parts[0].is_empty());
    }

    #[test]
    fn test_generate_app_key_consistency() {
        // 验证相同输入产生相同输出
        let content = "my_application";
        let result1 = generate_app_key(content);
        let result2 = generate_app_key(content);
        assert_eq!(result1, result2);
    }

    #[test]
    fn test_generate_app_key_different_content() {
        // 验证不同输入产生不同输出
        let result1 = generate_app_key("app1");
        let result2 = generate_app_key("app2");
        assert_ne!(result1, result2);
    }

    #[test]
    fn test_generate_app_key_hash_length() {
        // MD5 哈希应该是 32 个字符的十六进制字符串
        let result = generate_app_key("test");
        let parts: Vec<&str> = result.split('_').collect();
        assert_eq!(parts[1].len(), 32);
    }

    #[test]
    fn test_generate_app_key_with_special_characters() {
        let content = "test-app_123.456";
        let result = generate_app_key(content);

        // 从右侧分割，最多分成2部分
        let parts: Vec<&str> = result.rsplitn(2, '_').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[1], content);
    }

    #[test]
    fn test_generate_app_key_with_unicode() {
        let content = "测试应用";
        let result = generate_app_key(content);

        let parts: Vec<&str> = result.split('_').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0], content);
        // 哈希部分应该是有效的十六进制字符串
        assert!(parts[1].chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_generate_app_key_hash_is_lowercase_hex() {
        let result = generate_app_key("test");
        let parts: Vec<&str> = result.split('_').collect();
        // 验证哈希只包含小写十六进制字符
        assert!(parts[1]
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit()));
    }
}
