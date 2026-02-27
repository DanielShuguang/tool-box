---
alwaysApply: false
description: 代码质量工具配置与检查规则，包括 lint、fmt、typecheck 等工具的使用
---

# 代码质量工具规则

## 必须运行的命令

在完成代码修改后，必须执行 TypeScript 和 oxc 检测确保代码质量，注意是增量检查而不是全量检查。

### 前端检查命令

```bash
# Lint 检查和自动修复（仅检查修改的文件）
npx oxlint --fix <修改的文件>

# 代码格式化（仅格式化修改的文件）
npx oxfmt <修改的文件>

# 类型检查（使用增量编译缓存）
pnpm check
```

### 后端检查命令

```bash
# Rust 代码格式化
cargo fmt

# Rust 代码检查
cargo clippy
```

## 工具配置

- **Linter**: oxlint
  - 配置文件: `.oxlintrc.json`
- **Formatter**: oxfmt
  - 配置文件: `.oxfmtrc.json`
- **Type Checker**: vue-tsc
  - 配置文件: `tsconfig.json`
- **Git Hooks**: husky
  - pre-commit hook

## 关键词

lint、fmt、typecheck、oxlint、oxfmt、vue-tsc、cargo fmt、clippy、代码检查、代码格式化
