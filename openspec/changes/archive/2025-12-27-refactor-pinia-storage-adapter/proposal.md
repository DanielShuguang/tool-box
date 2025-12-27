# 变更：重构 Pinia 持久化适配器，支持按 Store 独立等待

## 为什么

当前 `pinia-storage-adapter` 插件存在以下问题：

1. **全局等待机制不够灵活**：
   - 当前使用全局 `waitForRestore()` 函数等待所有 store 持久化数据加载完成
   - 在 [Layout.vue](file:///e:/workspace/desktop-app/tool-box/src/components/Layout/Layout.vue#L29) 中，必须等待所有 store 加载完成后才能进行路由跳转
   - 即使只需要等待特定 store（如 router store），也必须等待所有 store 加载完成

2. **性能浪费**：
   - 某些 store 的持久化数据加载可能较慢，但并不影响其他功能的初始化
   - 全局等待导致应用启动时间增加，用户体验不佳

3. **代码耦合度高**：
   - 使用全局等待机制使得代码耦合度增加
   - 组件需要了解所有 store 的加载状态，违反了单一职责原则

4. **扩展性差**：
   - 新增 store 时需要考虑对全局等待机制的影响
   - 难以针对特定 store 实现不同的加载策略

为了解决这些问题，需要改造 `pinia-storage-adapter` 插件，支持按 store 独立管理加载状态，允许代码中按需等待特定 store 的持久化数据加载完成。

## 变更内容

### 1. 改造 pinia-storage-adapter 插件

#### 1.1 移除全局等待机制

- 移除全局的 `restorePromise` 和 `restoreResolve` 变量
- 移除 `waitForRestore()` 全局函数
- 移除 `pendingStores` 集合和相关的全局状态管理逻辑

#### 1.2 为每个 Store 提供独立的等待机制

为每个启用了持久化的 store 提供以下能力：

- **`isReady` 状态**：表示该 store 的持久化数据是否已加载完成
- **`waitForReady()` 方法**：返回一个 Promise，在该 store 数据加载完成后 resolve
- **`ready` 属性**：在 store 实例上添加 `ready` 属性，提供等待方法

#### 1.3 新增 API 设计

```typescript
// 在 store 实例上添加的属性
interface StoreWithReady {
  $ready: {
    isReady: Ref<boolean>
    waitForReady: () => Promise<void>
  }
}

// 使用示例
const routerStore = useRouterStore()
await routerStore.$ready.waitForReady()
```

### 2. 更新 Layout.vue

修改 [Layout.vue](file:///e:/workspace/desktop-app/tool-box/src/components/Layout/Layout.vue#L20-30) 中的等待逻辑：

```typescript
// 修改前
await waitForRestore()
router.push(routerStore.currentRoutePath)

// 修改后
await routerStore.$ready.waitForReady()
router.push(routerStore.currentRoutePath)
```

### 3. 技术实现细节

#### 3.1 Store Ready 状态管理

为每个 store 创建独立的 ready 状态：

```typescript
function createStoreReadyState(storeId: string) {
  const isReady = ref(false)
  let resolve: (() => void) | null = null
  const promise = new Promise<void>(r => {
    resolve = r
  })

  function markReady() {
    isReady.value = true
    resolve?.()
  }

  return {
    isReady,
    promise,
    markReady
  }
}
```

#### 3.2 插件实现

```typescript
export function createPiniaStorage(globalOptions?: PersistOptions): PiniaPlugin {
  return function persistPlugin(context) {
    const persistOptions = context.options.persist

    if (!persistOptions) {
      return
    }

    const storeId = context.store.$id
    const readyState = createStoreReadyState(storeId)

    // 在 store 实例上添加 $ready 属性
    Object.defineProperty(context.store, '$ready', {
      get() {
        return {
          isReady: readyState.isReady,
          waitForReady: () => readyState.promise
        }
      },
      enumerable: false,
      configurable: false
    })

    const { fileName, key, debounce, keys: persistKeys } = persistOptions

    async function loadState() {
      try {
        const value = await load(key, undefined, fileName)
        if (value != null) {
          const data = persistKeys
            ? persistKeys.reduce(
                (acc, k) =>
                  k in (value as Record<string, unknown>)
                    ? { ...acc, [k]: (value as Record<string, unknown>)[k] }
                    : acc,
                {} as Record<string, unknown>
              )
            : value
          context.store.$patch(data as any)
        }
      } catch (error) {
        console.error(`Failed to load state for ${key}:`, error)
      } finally {
        readyState.markReady()
      }
    }

    loadState()

    // ... 保存逻辑保持不变
  }
}
```

#### 3.3 TypeScript 类型定义

在 `src/types/` 中添加类型定义：

```typescript
// src/types/pinia-store.ts
import type { Ref } from 'vue'

export interface StoreReadyState {
  isReady: Ref<boolean>
  waitForReady: () => Promise<void>
}

declare module 'pinia' {
  export interface PiniaCustomStateProperties {
    $ready?: StoreReadyState
  }
}
```

### 4. 向后兼容性考虑

- 移除全局 `waitForRestore()` 函数属于破坏性变更
- 需要更新所有使用该函数的地方（目前只有 Layout.vue）
- 在变更前确认没有其他地方使用该函数

## 影响

### 受影响规范

- 无（优化现有功能，不影响功能规范）

### 受影响代码

#### 修改文件

- `src/plugins/pinia-storage-adapter.ts` - 重构插件实现
  - 移除全局等待机制
  - 为每个 store 添加独立的 ready 状态管理
  - 修改 `loadState()` 函数，在加载完成后标记 ready 状态

- `src/components/Layout/Layout.vue` - 更新等待逻辑
  - 移除 `waitForRestore` 导入
  - 使用 `routerStore.$ready.waitForReady()` 替代全局等待

#### 新增文件

- `src/types/pinia-store.ts` - TypeScript 类型定义
  - 定义 `StoreReadyState` 接口
  - 扩展 Pinia 类型定义

### 性能影响

- **正面影响**：
  - 应用启动时间减少，因为不需要等待所有 store 加载完成
  - 按需等待机制更加灵活，可以并行加载多个 store
  - 减少不必要的等待时间

- **潜在影响**：
  - 每个 store 需要维护独立的 ready 状态，内存占用略有增加
  - 需要确保 ready 状态管理的正确性，避免内存泄漏

### 兼容性影响

- **破坏性变更**：移除全局 `waitForRestore()` 函数
- **迁移成本**：需要更新所有使用该函数的地方（目前只有 Layout.vue）
- **数据兼容性**：不影响现有数据的存储和加载

### 开发体验影响

- **正面影响**：
  - 更灵活的等待机制，开发者可以按需等待特定 store
  - 更好的代码组织，降低耦合度
  - 更清晰的 API 设计

- **注意事项**：
  - 开发人员需要了解新的 API 使用方式
  - 需要更新相关文档和示例代码

## 风险评估

### 技术风险

1. **TypeScript 类型扩展**：
   - 使用 `declare module 'pinia'` 扩展类型可能存在兼容性问题
   - **应对措施**：充分测试类型定义的正确性，确保与 Pinia 版本兼容

2. **Store 实例属性添加**：
   - 使用 `Object.defineProperty` 动态添加属性可能影响性能
   - **应对措施**：在插件初始化时添加属性，避免运行时频繁操作

3. **Ready 状态管理**：
   - 需要确保 ready 状态正确标记，避免死锁
   - **应对措施**：在 `finally` 块中标记 ready，确保一定会执行

### 兼容性风险

1. **破坏性变更**：
   - 移除全局 `waitForRestore()` 函数可能影响其他代码
   - **应对措施**：在变更前全局搜索确认所有使用位置

2. **迁移成本**：
   - 需要更新相关代码和文档
   - **应对措施**：提供清晰的迁移指南和示例代码

### 测试风险

1. **测试覆盖**：
   - 需要确保新的 API 在各种场景下正常工作
   - **应对措施**：编写全面的单元测试和集成测试

2. **性能测试**：
   - 需要验证改造后的性能表现
   - **应对措施**：对比改造前后的启动时间和内存占用

## 后续优化方向

1. **可选的等待机制**：
   - 考虑在 `persist` 配置中添加 `waitForReady` 选项，允许开发者选择是否启用 ready 状态管理

2. **超时机制**：
   - 为 `waitForReady()` 添加超时参数，避免无限等待

3. **错误处理**：
   - 在 ready 状态管理中添加错误处理机制，提供更好的错误信息

4. **开发模式支持**：
   - 在开发模式下提供 ready 状态的可视化，方便调试
