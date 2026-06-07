# 开发命令与重要说明

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
