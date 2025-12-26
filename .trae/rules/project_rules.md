# 项目规则

## 项目概述

这是一个基于 Tauri 2.x 的桌面应用，前端使用 Vue 3 + TypeScript，后端使用 Rust。

## 技术栈

### 前端

- Vue 3 (Composition API + TypeScript)
- Vite
- Naive UI (UI 组件库)
- UnoCSS (原子化 CSS)
- Vue Router
- VueUse
- Tauri API
- motion-v (动画库)

### 后端

- Rust
- Tauri 2.x
- Tokio (异步运行时)
- reqwest (HTTP 客户端)

## 代码质量工具

### 必须运行的命令

在完成代码修改后，必须运行以下命令确保代码质量：

```bash
# Lint 检查和自动修复
pnpm lint

# 代码格式化
pnpm fmt

# 类型检查
pnpm check
```

### 工具配置

- **Linter**: oxlint (配置文件: `.oxlintrc.json`)
- **Formatter**: oxfmt (配置文件: `.oxfmtrc.json`)
- **Type Checker**: vue-tsc (配置文件: `tsconfig.json`)
- **Git Hooks**: husky (pre-commit hook)

## 代码风格

### TypeScript/JavaScript

- 使用单引号
- 不使用分号
- 2 空格缩进
- 行宽 100 字符
- 箭头函数参数不使用括号 (当只有一个参数时)
- 尾随逗号: 不使用
- 注意代码拆分，单个文件行数不超过 300 行
- 函数形参不超过 3 个，超过时考虑使用对象参数
- 注释: 必要时添加注释，保持代码可读性，语言为中文
- 项目使用了 vite 的 unplugin 插件，import 语句要注意 `src/types/auto-imports.d.ts` 和 `src/types/components.d.ts` 这两个文件，里面定义了自动导入的组件和函数，使用时不需要在文件中手动导入

### Rust

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码

## 命名约定

### TypeScript/JavaScript

- **组件**: PascalCase (如 `AppSettings.vue`)
- **文件**: kebab-case (如 `file-search.ts`)
- **变量/函数**: camelCase (如 `searchDiskFile`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_FILE_SIZE`)
- **类型/接口**: PascalCase (如 `SearchResult`)
- **枚举**: PascalCase (如 `FileStatus`)

### Rust

- **模块**: snake_case (如 `file_search`)
- **函数/变量**: snake_case (如 `search_disk_file`)
- **结构体**: PascalCase (如 `SearchResult`)
- **枚举**: PascalCase (如 `FileStatus`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_FILE_SIZE`)

## 组件开发规范

### Vue 组件

1. 使用 `<script setup lang="ts">` 语法
2. 组件文件包含 2 个部分: `.vue` (模板), `logic.ts` (逻辑)，如果代码较多，可以拆分为多个文件
3. 使用 Composition API
4. 使用 TypeScript 进行类型定义
5. 使用 Naive UI 组件库
6. 组件拆分: 每个功能模块拆分为独立的组件，避免单个组件过于复杂

## Tauri 命令开发规范

优先根据已有代码结构和规范进行开发，避免重复造轮子。

### 后端 (Rust)

1. 在 `src-tauri/src/` 中创建对应模块
2. 使用 `#[tauri::command]` 宏定义命令
3. 在 `lib.rs` 的 `invoke_handler` 中注册命令
4. 使用 `Result<T, String>` 作为返回类型

### 前端 (TypeScript)

1. 在 `src/backend-channel/` 中创建对应文件
2. 使用 `invoke` 函数调用后端命令
3. 定义 TypeScript 类型与 Rust 结构体对应

## Git 提交规范

使用 husky pre-commit hook，提交前会自动运行 lint。

## 环境要求

- Node.js >= 22.18.0 (使用 Volta 管理)
- Rust >= 1.88
- pnpm >= 10.4.1

## 注意事项

1. 修改代码后必须运行 `pnpm lint`、`pnpm fmt` 和 `pnpm build` 确保代码质量
2. 遵循现有的代码风格和命名约定
3. 新增功能时，在 `src/views/` 中创建新页面
4. 新增 Tauri 命令时，同时更新前端和后端代码
5. 使用 TypeScript 严格模式，确保类型安全
6. 避免使用 `any` 类型，使用 `unknown` 或具体类型替代
