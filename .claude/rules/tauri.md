# Tauri 开发

## 命令开发

### 后端（Rust）开发

1. 在 `src-tauri/src/` 中创建模块
2. 使用 `#[tauri::command]` 宏定义命令
3. 在 `lib.rs` 的 `invoke_handler` 中注册命令
4. 返回类型：`Result<T, String>`

### 前端（TypeScript）开发

1. 在 `src/backend-channel/` 中创建文件
2. 使用 `invoke` 函数调用后端命令
3. 定义与 Rust 结构体对应的 TypeScript 类型

## 插件

| 插件 | 用途 |
|------|------|
| tauri-plugin-fs | 文件系统访问 |
| tauri-plugin-dialog | 原生对话框 |
| tauri-plugin-shell | Shell 命令 |
| tauri-plugin-notification | 系统通知 |
| tauri-plugin-os | 操作系统信息 |
| tauri-plugin-http | HTTP 请求 |
| tauri-plugin-store | 持久化存储 |
| tauri-plugin-cli | CLI 参数 |
| tauri-plugin-autostart | 自动启动 |
| tauri-plugin-global-shortcut | 全局快捷键 |
