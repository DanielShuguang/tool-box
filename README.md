# Tool Box (工具箱)

基于 Tauri 2.x 构建的个人桌面工具应用程序，集成多个实用工具，方便日常工作学习。

## 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| Vue 3 | 前端框架（组合式 API） |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Naive UI | UI 组件库 |
| UnoCSS | 原子化 CSS |
| Pinia | 状态管理 |
| Vue Router | 路由管理 |
| Motion-v | 动画库 |
| Vitest | 测试框架 |

### 后端

| 技术 | 说明 |
|------|------|
| Tauri 2.x | 桌面应用框架 |
| Rust | 后端语言 |
| Tokio | 异步运行时 |
| reqwest | HTTP 客户端 |

## 功能模块

| 模块 | 说明 |
|------|------|
| RandomPicker | 随机选择器 |
| Download | 下载管理（含断点续传） |
| FileSearch | 文件搜索 |
| ReadFile | 文件读取 |
| EyeProtection | 护眼工具 |
| Todo | 待办事项 |
| Accounting | 记账功能 |
| Translator | 翻译工具 |
| CanvasBoard | 画板（支持历史记录、自动保存） |
| WindowsActivatiion | Windows 激活 |

## 环境要求

- Node.js >= 22.18.0（由 Volta 管理）
- Rust >= 1.88
- pnpm >= 10.4.1

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

```bash
pnpm tauri dev
```

### 3. 构建应用

```bash
pnpm tauri build
```

## 代码质量

```bash
pnpm lint        # 静态检查并自动修复
pnpm fmt         # 代码格式化
pnpm check       # 类型检查
pnpm build       # 构建验证
pnpm test        # 运行测试
```

## 项目结构

```
tool-box/
├── src/                    # 前端源码
│   ├── views/              # 页面组件
│   ├── components/        # 公共组件
│   ├── stores/             # Pinia 状态
│   ├── backend-channel/    # Tauri 命令调用
│   ├── utils/              # 工具函数
│   └── hooks/              # 组合式函数
├── src-tauri/              # Rust 后端源码
│   └── src/
│       ├── download/       # 下载模块
│       ├── file_search/    # 文件搜索
│       └── ...
└── openspec/               # OpenSpec 工作流
```

## 注意

- 本项目仅供学习交流使用，请勿用于商业用途
- 代码仅供参考，如有问题请自行解决
