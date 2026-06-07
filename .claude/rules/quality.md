# 代码质量与测试

## 前端命令

```bash
# 静态检查并自动修复（仅修改的文件）
npx oxlint --fix src/file.ts

# 代码格式化（仅修改的文件）
npx oxfmt src/file.ts

# 类型检查
pnpm check
```

## 后端命令

```bash
# Rust 代码格式化
cargo fmt

# Rust 代码静态检查
cargo clippy
```

## 必选工作流

代码修改后，必须执行：

1. `pnpm lint` - 静态检查
2. `pnpm fmt` - 代码格式化
3. `pnpm build` - 构建验证

## 单元测试

- **框架**：Vitest 4.x
- **断言库**：`@testing-library/jest-dom`

```bash
pnpm test           # 运行测试
pnpm test:ui        # 使用 UI 运行
pnpm test:coverage  # 使用覆盖率运行
```

### 测试说明

测试调用 Tauri 命令或使用 `invoke` 的代码时，使用 `@tauri-apps/api/mocks` 来模拟后端行为。

## E2E 测试

- **框架**：WebdriverIO + tauri-driver
- **配置文件**：`wdio.conf.ts`
- **测试目录**：`e2e/specs/`

```bash
pnpm e2e            # 运行 E2E 测试
```

### E2E 测试说明

1. E2E 测试需要先构建 debug 版本：`pnpm tauri build --debug --no-bundle`
2. 测试使用 `data-testid` 属性定位元素
3. 测试运行时会自动启动 tauri-driver

### 添加新的 E2E 测试

1. 在组件中添加 `data-testid` 属性：
   ```html
   <n-button data-testid="btn-capture">开始截图</n-button>
   ```

2. 在 `e2e/specs/` 目录下创建测试文件：
   ```typescript
   describe('Feature Name', () => {
     it('should do something', async () => {
       const btn = $('[data-testid="btn-capture"]')
       await expect(btn).toBeDisplayed()
       await btn.click()
     })
   })
   ```
