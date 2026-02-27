---
alwaysApply: false
description: TypeScript、JavaScript 和 Rust 的代码风格规范
---

# 代码风格规则

## TypeScript / JavaScript 风格

- 使用单引号
- 不使用分号
- 2 空格缩进
- 行宽 100 字符
- 箭头函数参数不使用括号（当只有一个参数时）
- 尾随逗号：不使用
- 单个文件行数不超过 300 行
- 函数形参不超过 3 个，超过时考虑使用对象参数
- 注释：必要时添加注释，保持代码可读性，语言为中文

## Rust 风格

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码

## 自动导入注意事项

项目使用了 Vite 的 unplugin 插件，import 语句要注意 `src/types/auto-imports.d.ts` 和 `src/types/components.d.ts` 这两个文件，里面定义了自动导入的组件和函数，使用时不需要在文件中手动导入。

## 关键词

代码风格、单引号、分号、缩进、行宽、箭头函数、尾随逗号、文件行数、函数参数、自动导入、unplugin
