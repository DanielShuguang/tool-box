## 为什么

项目当前缺少截图功能，用户需要借助外部工具（如 Snipaste、微信截图）进行屏幕捕获和标注。将截图工具集成到工具箱中，可以提供统一的使用体验，并支持快捷键触发、标注编辑、一键导出等功能，提升工作效率。

## 变更内容

新增截图工具模块，包含以下功能：

- **屏幕捕获**：支持全屏截图、区域框选截图、窗口截图
- **预览窗口**：截图后在截图区域旁边显示预览小窗，支持置顶显示
- **标注编辑**：基于 Fabric.js 实现画笔、矩形、圆形、箭头、文字、马赛克等标注工具
- **导出功能**：支持复制到剪贴板、保存为 PNG/JPG 文件
- **快捷键触发**：支持全局快捷键（可自定义）和主窗口按钮两种触发方式
- **配置管理**：支持在应用设置和工具内独立配置截图参数

## 功能 (Capabilities)

### 新增功能

- `screen-capture`: 屏幕捕获功能，包含全屏、区域、窗口三种截图模式，使用 Rust `screenshots` crate 实现
- `screenshot-preview`: 截图预览功能，在截图区域旁边显示预览小窗，支持快速操作（编辑、保存、复制）
- `screenshot-editor`: 截图标注编辑器，基于 Fabric.js 实现画笔、形状、文字、马赛克等标注工具
- `screenshot-config`: 截图工具配置管理，包含快捷键自定义、保存格式、默认路径等配置项

### 修改功能

<!-- 无现有功能需要修改 -->

## 影响

### 新增文件

**Rust 后端**：
- `src-tauri/src/screenshot/` - 截图功能模块
- 依赖：`screenshots`、`image` crate

**Vue 前端**：
- `src/views/Screenshot/` - 截图工具页面
- `src/stores/screenshot.ts` - 截图状态管理
- 依赖：`fabric` (Fabric.js)

### 修改文件

- `src-tauri/Cargo.toml` - 添加 screenshots、image 依赖
- `src-tauri/src/lib.rs` - 注册截图相关 Tauri 命令
- `src-tauri/capabilities/default.json` - 添加截图相关权限
- `src/router/` - 添加截图工具路由
- `src/stores/settings.ts` - 添加截图配置项

### 窗口管理

需要创建两个新窗口：
- `screenshot-capture` - 全屏透明窗口，用于区域选择
- `screenshot-preview` - 预览/编辑窗口

### 快捷键

需要注册全局快捷键：
- 全屏截图（默认：`Ctrl+Shift+S`）
- 区域截图（默认：`Ctrl+Shift+A`）
- 窗口截图（默认：`Ctrl+Shift+W`）
