# 变更：优化数据持久化逻辑，迁移到 Pinia Store

## 为什么

当前项目存在两套数据持久化方案，存在以下问题：

1. **代码重复和维护成本高**：
   - `usePersistentStorage` hook 和 `pinia-storage-adapter` 插件都实现了数据持久化功能
   - 两套方案需要分别维护，增加了代码维护成本

2. **状态管理不统一**：
   - 部分状态使用 `usePersistentStorage` hook（如 Todo、EyeProtection、MusicPlayer 等）
   - 部分状态使用 Pinia store（如 settings store）
   - 缺乏统一的状态管理方案，不利于代码一致性

3. **Pinia 优势未充分利用**：
   - Pinia 提供了更好的类型支持、DevTools 集成和状态管理能力
   - `pinia-storage-adapter` 已经实现并经过验证（参考 `settings.ts`）
   - 使用 Pinia 可以更好地利用 Vue 3 的响应式系统

4. **性能优化空间**：
   - `usePersistentStorage` 使用共享缓存机制，但每个 hook 调用都需要单独管理订阅者
   - Pinia store 提供了更高效的状态共享机制

5. **开发体验**：
   - Pinia store 提供更好的类型推断和 IDE 支持
   - 统一的 API 使用方式，降低学习成本

为了解决这些问题，需要逐步将 `usePersistentStorage` 的使用场景迁移到基于 Pinia store 的持久化方案，统一项目的数据持久化策略。

## 变更内容

### 1. 创建新的 Pinia Stores

基于现有 `usePersistentStorage` 的使用场景，创建以下 Pinia stores：

- **TodoStore** (`src/stores/todo.ts`)：
  - 迁移 `src/views/Todo/logic.ts` 中的 todos 持久化逻辑
  - 存储 todos 列表数据
  - 使用 `ConfigFile.Settings` 或创建新的配置文件

- **EyeProtectionStore** (`src/stores/eyeProtection.ts`)：
  - 迁移 `src/views/EyeProtection/EyeProtection.vue` 中的状态持久化逻辑
  - 存储护眼模式状态（isOpen、closeEyesInterval、restInterval）
  - 使用 `ConfigFile.EyeProtection`

- **MusicPlayerStore** (`src/stores/musicPlayer.ts`)：
  - 整合 `src/views/MusicPlayer/hooks/usePlaylist.ts`、`usePlayMode.ts`、`useVolume.ts` 中的持久化逻辑
  - 统一管理播放器状态（playlist、volume、playMode、currentTrackId、sortOption、sortOrder）
  - 使用 `ConfigFile.MusicPlayer`

- **RouterStore** (`src/stores/router.ts`)：
  - 迁移 `src/components/Layout/Layout.vue` 中的路由路径持久化逻辑
  - 存储当前路由路径
  - 使用 `ConfigFile.Router`

- **AppSettingsStore** (`src/stores/appSettings.ts`)：
  - 迁移 `src/components/AppSettings/AppSettings.vue` 中的设置持久化逻辑
  - 存储应用设置（autostart、enableTrayIcon）
  - 使用 `ConfigFile.Settings`（与现有 settings store 整合或独立）

### 2. 迁移策略

采用渐进式迁移策略，确保不影响现有功能：

1. **创建新的 Pinia stores**，实现与现有 `usePersistentStorage` 相同的功能
2. **逐步替换使用场景**，一个模块一个模块地迁移
3. **保持向后兼容**，在迁移过程中确保数据格式兼容
4. **验证和测试**，确保每个模块迁移后功能正常

### 3. 技术实现细节

#### 3.1 Store 结构示例（参考 settings.ts）

```typescript
// src/stores/todo.ts
import { defineStore } from 'pinia'
import { ConfigFile } from '@/utils/storage'

export interface Todo {
  id: number
  text: string
  completed: boolean
  deadline?: number
}

export const useTodoStore = defineStore(
  'todo',
  () => {
    const todos = ref<Todo[]>([])

    function addTodo(todo: Todo) {
      todos.value.push(todo)
    }

    function removeTodo(id: number) {
      todos.value = todos.value.filter(t => t.id !== id)
    }

    // ... 其他方法

    return {
      todos,
      addTodo,
      removeTodo,
      // ...
    }
  },
  {
    persist: {
      fileName: ConfigFile.Settings,
      key: 'todos'
    }
  }
)
```

#### 3.2 迁移步骤

1. **Todo 模块**：
   - 创建 `TodoStore`
   - 修改 `src/views/Todo/logic.ts` 使用 store 替代 `usePersistentStorage`
   - 保持现有 API 接口不变，仅替换底层实现

2. **EyeProtection 模块**：
   - 创建 `EyeProtectionStore`
   - 修改 `src/views/EyeProtection/EyeProtection.vue` 使用 store
   - 确保状态同步和响应式更新正常

3. **MusicPlayer 模块**：
   - 创建 `MusicPlayerStore`，整合多个 hook 的状态
   - 修改相关 hooks 使用 store
   - 注意保持现有 hook 的 API 兼容性

4. **Router 模块**：
   - 创建 `RouterStore`
   - 修改 `src/components/Layout/Layout.vue` 使用 store

5. **AppSettings 模块**：
   - 创建或扩展 `AppSettingsStore`
   - 修改 `src/components/AppSettings/AppSettings.vue` 使用 store
   - 考虑与现有 `settings.ts` 的整合

### 4. 数据迁移

确保现有存储的数据能够正确加载到新的 Pinia stores：

- 使用相同的 `key` 和 `fileName` 配置，确保数据兼容
- 在 store 初始化时自动加载现有数据
- 验证数据格式和类型正确性

### 5. 清理工作

迁移完成后：

- 标记 `usePersistentStorage` 为废弃（添加 `@deprecated` 注释）
- 更新相关文档
- 考虑在未来版本中移除 `usePersistentStorage`（如果所有场景都已迁移）

## 影响

### 受影响规范

- 无（优化现有功能，不影响功能规范）

### 受影响代码

#### 新增文件

- `src/stores/todo.ts` - Todo 状态管理 store
- `src/stores/eyeProtection.ts` - 护眼模式状态管理 store
- `src/stores/musicPlayer.ts` - 音乐播放器状态管理 store
- `src/stores/router.ts` - 路由状态管理 store
- `src/stores/appSettings.ts` - 应用设置状态管理 store（或扩展现有 settings.ts）

#### 修改文件

- `src/views/Todo/logic.ts` - 使用 TodoStore 替代 `usePersistentStorage`
- `src/views/EyeProtection/EyeProtection.vue` - 使用 EyeProtectionStore
- `src/views/MusicPlayer/hooks/usePlaylist.ts` - 使用 MusicPlayerStore
- `src/views/MusicPlayer/hooks/usePlayMode.ts` - 使用 MusicPlayerStore
- `src/views/MusicPlayer/hooks/useVolume.ts` - 使用 MusicPlayerStore
- `src/components/Layout/Layout.vue` - 使用 RouterStore
- `src/components/AppSettings/AppSettings.vue` - 使用 AppSettingsStore

#### 废弃文件（未来）

- `src/hooks/usePersistentStorage.ts` - 标记为废弃，待所有场景迁移完成后移除

### 性能影响

- **正面影响**：
  - 统一的状态管理机制，减少重复代码
  - Pinia 提供更高效的状态共享
  - 更好的类型推断和编译时检查

- **潜在影响**：
  - 迁移过程中需要确保数据加载性能不受影响
  - Store 初始化需要验证性能表现

### 兼容性影响

- **数据兼容性**：使用相同的存储 key 和文件名，确保数据能够正确迁移
- **API 兼容性**：在迁移过程中保持组件和 hook 的对外 API 不变
- **向后兼容**：现有功能不受影响，迁移是渐进式的

### 开发体验影响

- **正面影响**：
  - 统一的状态管理方式，降低学习成本
  - 更好的类型支持和 IDE 提示
  - 更易于调试（Pinia DevTools）

- **注意事项**：
  - 开发人员需要了解 Pinia store 的使用方式
  - 需要更新相关文档和示例代码

