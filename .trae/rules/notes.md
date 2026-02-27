---
alwaysApply: false
description: 项目开发中的注意事项和最佳实践要点
---

# 注意事项

## 代码质量要求

1. 修改代码后必须运行 `pnpm lint`、`pnpm fmt` 和 `pnpm build` 确保代码质量
2. 遵循现有的代码风格和命名约定

## 功能开发

1. 新增功能时，在 `src/views/` 中创建新页面
2. 新增 Tauri 命令时，同时更新前端和后端代码

## 类型安全

1. 使用 TypeScript 严格模式，确保类型安全
2. 避免使用 `any` 类型，使用 `unknown` 或具体类型替代

## 测试相关

1. 编写前端测试代码时，如果调用了 Tauri 命令或者使用 invoke 与后端交互，可以通过 `@tauri-apps/api/mocks` 提供的工具来模拟后端行为，避免实际调用后端

## 关键词

注意事项、代码质量、功能开发、类型安全、测试、mock、Tauri
