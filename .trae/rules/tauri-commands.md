---
alwaysApply: false
description: Tauri 命令开发规范，包括后端 Rust 命令和前端调用的开发规范
---

# Tauri 命令开发规范

优先根据已有代码结构和规范进行开发，避免重复造轮子。

## 后端 (Rust) 开发规范

1. 在 `src-tauri/src/` 中创建对应模块
2. 使用 `#[tauri::command]` 宏定义命令
3. 在 `lib.rs` 的 `invoke_handler` 中注册命令
4. 使用 `Result<T, String>` 作为返回类型

## 前端 (TypeScript) 开发规范

1. 在 `src/backend-channel/` 中创建对应文件
2. 使用 `invoke` 函数调用后端命令
3. 定义 TypeScript 类型与 Rust 结构体对应

## 关键词

Tauri、tauri::command、invoke、Rust 后端、前端调用、backend-channel、命令注册
