## 修改需求

### 需求：统一数据持久化方案

系统必须使用 Pinia Store 和 `pinia-storage-adapter` 插件作为统一的数据持久化方案，逐步替换 `usePersistentStorage` hook。

#### 场景：Todo 数据持久化迁移

- **当** 系统需要持久化 Todo 列表数据时
- **那么** 系统必须使用 `TodoStore`（`src/stores/todo.ts`）进行状态管理
- **并且** Store 必须使用 `pinia-storage-adapter` 插件进行持久化
- **并且** 持久化配置必须使用 `ConfigFile.Settings` 和 key `'todos'`
- **并且** `src/views/Todo/logic.ts` 必须使用 `TodoStore` 替代 `usePersistentStorage`
- **并且** 必须保持现有的 API 接口不变，仅替换底层实现

#### 场景：EyeProtection 数据持久化迁移

- **当** 系统需要持久化护眼模式状态时
- **那么** 系统必须使用 `EyeProtectionStore`（`src/stores/eyeProtection.ts`）进行状态管理
- **并且** Store 必须使用 `pinia-storage-adapter` 插件进行持久化
- **并且** 持久化配置必须使用 `ConfigFile.EyeProtection` 和 key `'open-eye-protection'`
- **并且** Store 必须存储 `isOpen`、`closeEyesInterval`、`restInterval` 状态
- **并且** `src/views/EyeProtection/EyeProtection.vue` 必须使用 `EyeProtectionStore` 替代 `usePersistentStorage`
- **并且** 必须确保状态变更能够正确触发响应式更新

#### 场景：MusicPlayer 数据持久化迁移

- **当** 系统需要持久化音乐播放器状态时
- **那么** 系统必须使用 `MusicPlayerStore`（`src/stores/musicPlayer.ts`）进行状态管理
- **并且** Store 必须使用 `pinia-storage-adapter` 插件进行持久化
- **并且** 持久化配置必须使用 `ConfigFile.MusicPlayer` 和 key `'player-state'`
- **并且** Store 必须统一管理 `playlist`、`volume`、`playMode`、`currentTrackId`、`sortOption`、`sortOrder` 状态
- **并且** `src/views/MusicPlayer/hooks/usePlaylist.ts` 必须使用 `MusicPlayerStore` 替代 `usePersistentStorage`
- **并且** `src/views/MusicPlayer/hooks/usePlayMode.ts` 必须使用 `MusicPlayerStore` 替代 `usePersistentStorage`
- **并且** `src/views/MusicPlayer/hooks/useVolume.ts` 必须使用 `MusicPlayerStore` 替代 `usePersistentStorage`
- **并且** 必须保持现有 hooks 的 API 接口不变，仅替换底层状态管理实现

#### 场景：Router 数据持久化迁移

- **当** 系统需要持久化当前路由路径时
- **那么** 系统必须使用 `RouterStore`（`src/stores/router.ts`）进行状态管理
- **并且** Store 必须使用 `pinia-storage-adapter` 插件进行持久化
- **并且** 持久化配置必须使用 `ConfigFile.Router` 和 key `'current-route-path'`
- **并且** `src/components/Layout/Layout.vue` 必须使用 `RouterStore` 替代 `usePersistentStorage`
- **并且** 必须确保路由变更时能够正确保存和恢复路径

#### 场景：AppSettings 数据持久化迁移

- **当** 系统需要持久化应用设置时
- **那么** 系统必须使用 `AppSettingsStore`（`src/stores/appSettings.ts`）或扩展现有 `settings.ts` 进行状态管理
- **并且** Store 必须使用 `pinia-storage-adapter` 插件进行持久化
- **并且** 持久化配置必须使用 `ConfigFile.Settings` 和 key `'app-settings'`
- **并且** Store 必须存储 `autostart`、`enableTrayIcon` 状态
- **并且** `src/components/AppSettings/AppSettings.vue` 必须使用 `AppSettingsStore` 替代 `usePersistentStorage`
- **并且** 必须确保设置变更能够正确保存和生效

## 新增需求

### 需求：Pinia Stores 实现

系统必须为每个使用 `usePersistentStorage` 的场景创建对应的 Pinia Store。

#### 场景：TodoStore 实现

- **当** 系统创建 `TodoStore` 时
- **那么** Store 必须定义在 `src/stores/todo.ts`
- **并且** Store 必须使用 `defineStore` API 定义
- **并且** Store 必须包含 `todos` 状态（类型为 `Ref<Todo[]>`）
- **并且** Store 必须提供 `addTodo`、`removeTodo`、`toggleTodo`、`clearCompleted` 等方法
- **并且** Store 必须配置 `persist` 选项，使用 `ConfigFile.Settings` 和 key `'todos'`
- **并且** Store 必须支持数据自动加载和保存

#### 场景：EyeProtectionStore 实现

- **当** 系统创建 `EyeProtectionStore` 时
- **那么** Store 必须定义在 `src/stores/eyeProtection.ts`
- **并且** Store 必须使用 `defineStore` API 定义
- **并且** Store 必须包含 `isOpen`、`closeEyesInterval`、`restInterval` 状态
- **并且** Store 必须配置 `persist` 选项，使用 `ConfigFile.EyeProtection` 和 key `'open-eye-protection'`
- **并且** Store 必须支持数据自动加载和保存

#### 场景：MusicPlayerStore 实现

- **当** 系统创建 `MusicPlayerStore` 时
- **那么** Store 必须定义在 `src/stores/musicPlayer.ts`
- **并且** Store 必须使用 `defineStore` API 定义
- **并且** Store 必须包含 `playlist`、`volume`、`playMode`、`currentTrackId`、`sortOption`、`sortOrder` 状态
- **并且** Store 必须提供播放列表管理方法（`addToPlaylist`、`removeFromPlaylist`、`clearPlaylist` 等）
- **并且** Store 必须提供音量控制方法（`setVolume`）
- **并且** Store 必须提供播放模式控制方法（`setPlayMode`、`togglePlayMode`）
- **并且** Store 必须配置 `persist` 选项，使用 `ConfigFile.MusicPlayer` 和 key `'player-state'`
- **并且** Store 必须支持数据自动加载和保存

#### 场景：RouterStore 实现

- **当** 系统创建 `RouterStore` 时
- **那么** Store 必须定义在 `src/stores/router.ts`
- **并且** Store 必须使用 `defineStore` API 定义
- **并且** Store 必须包含 `currentRoutePath` 状态（类型为 `Ref<string>`）
- **并且** Store 必须提供 `setCurrentRoutePath` 方法
- **并且** Store 必须配置 `persist` 选项，使用 `ConfigFile.Router` 和 key `'current-route-path'`
- **并且** Store 必须支持数据自动加载和保存

#### 场景：AppSettingsStore 实现

- **当** 系统创建或扩展 `AppSettingsStore` 时
- **那么** Store 必须定义在 `src/stores/appSettings.ts` 或扩展现有 `settings.ts`
- **并且** Store 必须使用 `defineStore` API 定义
- **并且** Store 必须包含 `autostart`、`enableTrayIcon` 状态
- **并且** Store 必须提供 `toggleAutostart`、`toggleTrayIcon` 等方法
- **并且** Store 必须配置 `persist` 选项，使用 `ConfigFile.Settings` 和 key `'app-settings'`
- **并且** Store 必须支持数据自动加载和保存

### 需求：数据兼容性保证

系统必须确保迁移过程中现有数据能够正确加载到新的 Pinia Stores。

#### 场景：数据格式兼容

- **当** 系统从旧存储加载数据到新的 Pinia Store 时
- **那么** 系统必须使用相同的 `key` 和 `fileName` 配置
- **并且** 系统必须能够正确解析现有数据格式
- **并且** 系统必须处理数据缺失的情况，使用默认值
- **并且** 系统必须验证数据类型正确性

#### 场景：数据迁移验证

- **当** 系统完成数据迁移后
- **那么** 系统必须验证所有模块的数据能够正确加载
- **并且** 系统必须验证数据格式兼容性
- **并且** 系统必须验证迁移后功能正常
- **并且** 系统必须确保没有数据丢失

### 需求：向后兼容性

系统必须确保迁移过程中现有功能不受影响。

#### 场景：API 接口保持不变

- **当** 系统迁移到 Pinia Store 时
- **那么** 组件和 hooks 的对外 API 必须保持不变
- **并且** 现有组件调用方式必须不受影响
- **并且** 响应式更新行为必须保持一致

#### 场景：功能无回归

- **当** 系统完成迁移后
- **那么** Todo 功能必须正常工作
- **并且** EyeProtection 功能必须正常工作
- **并且** MusicPlayer 功能必须正常工作
- **并且** Router 功能必须正常工作
- **并且** AppSettings 功能必须正常工作

## 移除需求

### 需求：废弃 usePersistentStorage

系统必须标记 `usePersistentStorage` hook 为废弃状态，为未来移除做准备。

#### 场景：标记为废弃

- **当** 所有使用场景都已迁移到 Pinia Store 后
- **那么** 系统必须在 `src/hooks/usePersistentStorage.ts` 文件顶部添加 `@deprecated` 注释
- **并且** 注释必须说明应使用 Pinia Store 替代
- **并且** 注释必须提供迁移指南

#### 场景：未来移除计划

- **当** 系统在未来版本中移除 `usePersistentStorage` 时
- **那么** 系统必须确保所有使用场景都已迁移
- **并且** 系统必须更新相关文档
- **并且** 系统必须提供迁移指南

