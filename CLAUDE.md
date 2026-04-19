# 工具箱 - 开发指南

## 项目概述

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

---

## 环境要求

- **Node.js**：>= 22.18.0（由 Volta 管理）
- **Rust**：>= 1.88
- **pnpm**：>= 10.4.1

---

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

---

## 代码规范

### 前端（Vue 3 + TypeScript）

**文件命名**

- 组件：`PascalCase`（例如 `Download.vue`）
- 存储：`camelCase`（例如 `download.ts`）
- 工具函数：`camelCase`（例如 `formatDate.ts`）
- 类型：`camelCase`（例如 `types/download.ts`）

**代码风格**

- 单引号
- 不使用分号
- 2 空格缩进
- 行宽：100 字符
- 箭头函数：单个参数时不使用括号
- 不使用尾随逗号
- 单文件最多 400 行
- 函数参数最多 3 个（超过时使用对象参数）
- 必要时使用中文注释

**组件结构**

```vue
<script setup lang="ts">
// 1. 导入
// 2. 类型/接口
// 3. Props/Emits
// 4. 响应式状态
// 5. 计算属性
// 6. 监听器
// 7. 方法
// 8. 生命周期
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped lang="scss">
/* 作用域样式 */
</style>
```

**组件拆分规则**

- 简单/小型组件：拆分为 `.vue`（模板）+ `logic.ts`（逻辑）
- 复杂组件：按功能拆分为多个 `.vue` 文件，逻辑封装到独立 `.ts` 文件

**状态管理（Pinia）**

- 使用 `defineStore` 的 setup 模式
- 存储文件位置：`src/stores/*.ts`
- 命名：按功能命名（例如 `download.ts`、`randomPicker.ts`）

**自动导入**

项目使用 Vite 的 unplugin 插件。查看 `src/types/auto-imports.d.ts` 和 `src/types/components.d.ts` 了解自动导入的组件和函数。

### 后端（Rust）

**文件命名**

- 模块：`snake_case`（例如 `file_search`）
- 函数/变量：`snake_case`（例如 `search_disk_file`）
- 结构体：`PascalCase`（例如 `SearchResult`）
- 枚举：`PascalCase`（例如 `FileStatus`）
- 常量：`UPPER_SNAKE_CASE`（例如 `MAX_FILE_SIZE`）

**模块组织**

- 一个模块对应一个功能域
- 使用 `#[tauri::command]` 宏定义命令
- 使用 `anyhow` 进行错误处理

**命令模式**

```rust
#[tauri::command]
async fn command_name(
    state: tauri::State<'_, AppState>,
    param: ParamType,
) -> Result<ReturnType, String> {
    // 实现
}
```

---

## 命名规范

### TypeScript / JavaScript

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 组件 | PascalCase | `AppSettings.vue` |
| 文件 | kebab-case | `file-search.ts` |
| 变量/函数 | camelCase | `searchDiskFile` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 类型/接口 | PascalCase | `SearchResult` |
| 枚举 | PascalCase | `FileStatus` |

### Rust

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 模块 | snake_case | `file_search` |
| 函数/变量 | snake_case | `search_disk_file` |
| 结构体 | PascalCase | `SearchResult` |
| 枚举 | PascalCase | `FileStatus` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

---

## 代码质量

### 前端命令

```bash
# 静态检查并自动修复（仅修改的文件）
npx oxlint --fix src/file.ts

# 代码格式化（仅修改的文件）
npx oxfmt src/file.ts

# 类型检查
pnpm check
```

### 后端命令

```bash
# Rust 代码格式化
cargo fmt

# Rust 代码静态检查
cargo clippy
```

### 必选工作流

代码修改后，必须执行：

1. `pnpm lint` - 静态检查
2. `pnpm fmt` - 代码格式化
3. `pnpm build` - 构建验证

---

## 测试

- **框架**：Vitest 4.x
- **断言库**：`@testing-library/jest-dom`

```bash
pnpm test           # 运行测试
pnpm test:ui        # 使用 UI 运行
pnpm test:coverage  # 使用覆盖率运行
```

### 测试说明

测试调用 Tauri 命令或使用 `invoke` 的代码时，使用 `@tauri-apps/api/mocks` 来模拟后端行为。

---

## Tauri 命令开发

### 后端（Rust）开发

1. 在 `src-tauri/src/` 中创建模块
2. 使用 `#[tauri::command]` 宏定义命令
3. 在 `lib.rs` 的 `invoke_handler` 中注册命令
4. 返回类型：`Result<T, String>`

### 前端（TypeScript）开发

1. 在 `src/backend-channel/` 中创建文件
2. 使用 `invoke` 函数调用后端命令
3. 定义与 Rust 结构体对应的 TypeScript 类型

---

## Tauri 插件

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

---

## 开发命令

```bash
pnpm dev           # 启动 Vite 开发服务器
pnpm tauri dev    # 启动 Tauri 开发
pnpm build        # 构建前端（类型检查 + Vite 构建）
pnpm tauri build  # 构建 Tauri 应用程序
pnpm test         # 运行测试
pnpm lint         # 静态检查并自动修复
pnpm check        # 类型检查
```

---

## 窗口配置

- **主窗口**：`label: "main"`，无装饰，最小 1024x768

---

## 重要说明

### 代码质量

1. 代码修改后，必须运行 `pnpm lint`、`pnpm fmt` 和 `pnpm build`
2. 遵循现有的代码风格和命名规范

### 功能开发

1. 新功能：在 `src/views/` 中创建新页面
2. 新 Tauri 命令：同时更新前端和后端

### 类型安全

1. 使用 TypeScript 严格模式
2. 避免使用 `any` 类型 - 使用 `unknown` 或具体类型代替
