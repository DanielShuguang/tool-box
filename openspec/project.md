# 项目上下文

## 目的

tool-box 是一个基于 Tauri 构建的跨平台桌面工具集，旨在提供一系列实用工具来提高用户的工作效率。项目目标是创建一个轻量、高效、功能丰富的桌面应用，包含文件搜索、翻译、待办事项、护眼模式、Windows 激活等多种工具。

## 技术栈

### 前端

- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - 类型安全的 JavaScript 超集
- Naive UI - Vue 3 组件库
- Vite - 下一代前端构建工具
- SCSS - CSS 预处理器
- @vueuse/core - Vue 组合式 API 工具集
- lodash-es - 实用工具库
- date-fns - 日期处理库
- mitt - 事件总线
- @vicons - 图标库
- unocss - 原子化 CSS 框架（优先使用）

### 后端

- Rust - 系统编程语言
- Tauri - 跨平台桌面应用框架
- Tokio - Rust 异步运行时
- Reqwest - Rust HTTP 客户端
- Serde - Rust 序列化/反序列化库
- sysinfo - 系统信息库
- anyhow - Rust 错误处理库

### 开发工具

- pnpm - 包管理器
- oxlint - 代码检查工具
- oxfmt - 代码格式化工具
- husky - Git 钩子工具
- VS Code - 集成开发环境

## 项目约定

### 代码风格

- 前端使用 TypeScript，遵循严格的类型检查
- 代码格式化使用 oxfmt，配置文件：`.oxfmtrc.json`
- 代码检查使用 oxlint，配置文件：`.oxlintrc.json`
- 命名约定：
  - 变量和函数：camelCase
  - 组件和类：PascalCase
  - 文件和目录：kebab-case
- 缩进使用 2 个空格
- 每行最大长度：100 个字符

### 架构模式

- 采用前后端分离架构，前端使用 Vue 3 组件化开发
- 后端使用 Rust + Tauri 提供原生功能支持
- 前后端通信通过 Tauri 的 invoke 机制
- 使用插件化架构组织 Rust 代码，每个功能模块封装为独立插件
- 状态管理使用 Vue 3 的 Composition API 和 Pinia（如果需要）
- 路由使用 Vue Router

### 测试策略

- 目前项目未实现自动化测试
- 开发过程中采用手动测试验证功能
- 计划在后续版本中添加单元测试和端到端测试

### Git 工作流程

- 主分支：main（受保护，仅允许合并请求）
- 开发分支：develop（日常开发）
- 功能分支：feature/xxx（开发新功能）
- 修复分支：fix/xxx（修复 bug）
- 提交信息：使用中文，格式清晰，描述具体变更内容
- 代码提交前必须通过 lint 和格式化检查（通过 husky pre-commit 钩子强制执行）

## 领域上下文

### 核心功能模块

- **文件搜索**：实时搜索本地文件系统
- **翻译工具**：文本翻译功能
- **待办事项**：任务管理功能
- **护眼模式**：屏幕护眼功能
- **Windows 激活**：Windows 系统激活工具
- **文件下载**：文件下载功能
- **系统信息**：查看 CPU、硬盘等系统信息

## 重要约束

- 必须兼容 Windows、macOS 和 Linux 平台
- 应用体积应保持轻量，避免不必要的依赖
- 性能要求：文件搜索等功能必须保持高效响应
- 安全性：确保应用不收集用户隐私数据

## 外部依赖

- Tauri 插件生态系统（http、cli、os、notification、shell、fs、dialog、store 等）
- 系统 API：文件系统访问、系统信息获取、网络请求等
- 第三方库：如 mammoth（Word 文档处理）、xlsx（Excel 文档处理）等
