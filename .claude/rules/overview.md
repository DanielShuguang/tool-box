# 项目概述

基于 Tauri 2.x（Rust 后端 + Vue 3 前端）构建的个人桌面工具应用程序。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3（组合式 API）、TypeScript、Vite |
| UI 框架 | Naive UI |
| CSS | UnoCSS（原子化 CSS）、Sass |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 动画 | Motion-v |
| 桌面 API | Tauri API 2.x |
| 后端 | Tauri 2.x（Rust） |
| 异步运行时 | Tokio |
| HTTP 客户端 | reqwest |
| 包管理器 | pnpm 10.4+ |

## 环境要求

- **Node.js**：>= 22.18.0（由 Volta 管理）
- **Rust**：>= 1.88
- **pnpm**：>= 10.4.1

## 功能模块

| 模块 | 说明 |
|------|------|
| RandomPicker | 随机选择器 |
| FileSearch | 文件搜索 |
| ReadFile | 文件读取 |
| EyeProtection | 护眼工具 |
| Todo | 待办事项 |
| Translator | 翻译工具 |
| WindowsActivatiion | Windows 激活 |
| Screenshot | 截图工具 |

## 窗口配置

- **主窗口**：`label: "main"`，无装饰，最小 1024x768
