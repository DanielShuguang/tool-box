# 代码规范与命名

## 前端（Vue 3 + TypeScript）

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
- 命名：按功能命名

**自动导入**

项目使用 Vite 的 unplugin 插件。查看 `src/types/auto-imports.d.ts` 和 `src/types/components.d.ts` 了解自动导入的组件和函数。

## 后端（Rust）

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

## 命名规范速查

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
