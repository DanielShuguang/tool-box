# 任务清单

## 实施

### 1. 核心功能实现

- [ ] 1.1 创建 TypeScript 类型定义文件 `src/types/pinia-store.ts`
  - [ ] 1.1.1 定义 `StoreReadyState` 接口
  - [ ] 1.1.2 扩展 Pinia 类型定义，添加 `$ready` 属性

- [ ] 1.2 重构 `src/plugins/pinia-storage-adapter.ts`
  - [ ] 1.2.1 移除全局等待机制相关代码
    - [ ] 移除 `restorePromise` 变量
    - [ ] 移除 `restoreResolve` 变量
    - [ ] 移除 `waitForRestore()` 函数
    - [ ] 移除 `pendingStores` 集合
    - [ ] 移除 `createRestorePromise()` 函数
    - [ ] 移除 `markStoreRestored()` 函数
  - [ ] 1.2.2 实现 `createStoreReadyState()` 函数
    - [ ] 创建独立的 ready 状态管理
    - [ ] 实现 `isReady` 响应式状态
    - [ ] 实现 `waitForReady()` Promise 方法
    - [ ] 实现 `markReady()` 标记方法
  - [ ] 1.2.3 修改 `createPiniaStorage()` 插件函数
    - [ ] 为每个 store 创建独立的 ready 状态
    - [ ] 使用 `Object.defineProperty` 在 store 实例上添加 `$ready` 属性
    - [ ] 修改 `loadState()` 函数，在加载完成后调用 `markReady()`
    - [ ] 确保在 `finally` 块中标记 ready 状态

### 2. 更新使用方代码

- [ ] 2.1 修改 `src/components/Layout/Layout.vue`
  - [ ] 2.1.1 移除 `waitForRestore` 导入
  - [ ] 2.1.2 修改 `onMounted` 中的等待逻辑
    - [ ] 将 `await waitForRestore()` 替换为 `await routerStore.$ready.waitForReady()`
  - [ ] 2.1.3 验证路由跳转逻辑正常工作

### 3. 代码清理

- [ ] 3.1 确认没有其他地方使用 `waitForRestore()` 函数
  - [ ] 全局搜索 `waitForRestore` 确认所有使用位置
  - [ ] 更新所有使用该函数的地方

- [ ] 3.2 移除不再需要的代码
  - [ ] 移除全局等待机制相关的注释和文档
  - [ ] 清理未使用的导入和变量

## 测试

### 1. 单元测试

- [ ] 1.1 为 `createStoreReadyState()` 函数编写单元测试
  - [ ] 测试 `isReady` 初始状态为 false
  - [ ] 测试 `markReady()` 后 `isReady` 变为 true
  - [ ] 测试 `waitForReady()` 在 `markReady()` 后 resolve
  - [ ] 测试 `waitForReady()` 在 `markReady()` 前保持 pending

- [ ] 1.2 为 `createPiniaStorage()` 插件编写单元测试
  - [ ] 测试插件为 store 添加 `$ready` 属性
  - [ ] 测试 `$ready.isReady` 初始状态为 false
  - [ ] 测试数据加载完成后 `$ready.isReady` 变为 true
  - [ ] 测试 `$ready.waitForReady()` 正常工作
  - [ ] 测试多个 store 的 ready 状态独立管理

- [ ] 1.3 为 `loadState()` 函数编写单元测试
  - [ ] 测试正常加载数据后标记 ready
  - [ ] 测试加载失败后仍然标记 ready
  - [ ] 测试数据为 null 时正确处理

### 2. 集成测试

- [ ] 2.1 测试 Layout.vue 的路由跳转逻辑
  - [ ] 测试等待 router store ready 后正确跳转
  - [ ] 测试其他 store 加载延迟不影响路由跳转
  - [ ] 测试路由路径正确恢复

- [ ] 2.2 测试多个 store 并行加载
  - [ ] 测试多个 store 的 ready 状态独立管理
  - [ ] 测试按需等待特定 store 不影响其他 store
  - [ ] 测试所有 store 加载完成后状态正确

### 3. 性能测试

- [ ] 3.1 对比改造前后的启动时间
  - [ ] 测量应用启动到路由跳转完成的时间
  - [ ] 验证改造后启动时间减少

- [ ] 3.2 测试内存占用
  - [ ] 测量改造前后的内存占用
  - [ ] 验证每个 store 的 ready 状态管理不会造成内存泄漏

### 4. 兼容性测试

- [ ] 4.1 测试现有数据的加载
  - [ ] 验证改造后现有数据能够正确加载
  - [ ] 验证数据格式兼容性

- [ ] 4.2 测试 TypeScript 类型定义
  - [ ] 验证 `$ready` 属性的类型推断正确
  - [ ] 验证 IDE 提示正常工作

## 文档

### 1. 代码注释

- [ ] 1.1 更新 `src/plugins/pinia-storage-adapter.ts` 的注释
  - [ ] 添加 `createStoreReadyState()` 函数的注释
  - [ ] 更新 `createPiniaStorage()` 插件的注释
  - [ ] 说明 `$ready` 属性的使用方法

- [ ] 1.2 更新 `src/types/pinia-store.ts` 的注释
  - [ ] 添加类型定义的注释
  - [ ] 说明 `$ready` 属性的用途

### 2. 使用文档

- [ ] 2.1 创建或更新 Pinia Store 使用指南
  - [ ] 说明如何使用 `$ready.waitForReady()` 等待 store 加载
  - [ ] 提供使用示例
  - [ ] 说明最佳实践

- [ ] 2.2 更新 AGENTS.md（如果需要）
  - [ ] 说明新的等待机制
  - [ ] 提供迁移指南

### 3. 变更日志

- [ ] 3.1 在提案中记录变更内容
  - [ ] 记录破坏性变更
  - [ ] 记录新增功能
  - [ ] 记录性能改进

## 验收标准

### 功能验收

- [ ] 所有启用了持久化的 store 都有独立的 `$ready` 属性
- [ ] `$ready.isReady` 正确反映 store 的加载状态
- [ ] `$ready.waitForReady()` 在 store 加载完成后正确 resolve
- [ ] Layout.vue 能够正确等待 router store 加载完成后进行路由跳转
- [ ] 多个 store 的 ready 状态独立管理，互不影响

### 性能验收

- [ ] 应用启动时间相比改造前减少
- [ ] 内存占用在合理范围内，没有内存泄漏
- [ ] Store 加载性能不受影响

### 代码质量验收

- [ ] 所有代码通过 `pnpm lint` 检查
- [ ] 所有代码通过 `pnpm fmt` 格式化
- [ ] 所有代码通过 `pnpm check` 类型检查
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试全部通过

### 文档验收

- [ ] 代码注释完整且准确
- [ ] 使用文档清晰易懂
- [ ] 变更日志完整记录所有变更
