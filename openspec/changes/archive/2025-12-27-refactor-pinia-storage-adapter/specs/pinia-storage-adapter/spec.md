# pinia-storage-adapter Specification

## Purpose

提供 Pinia store 的持久化存储适配器，支持自动保存和恢复 store 状态。

## 需求

### 需求：持久化存储

系统必须提供 Pinia store 的持久化存储功能，允许开发者配置 store 的持久化选项，包括存储键名、文件名、需要持久化的字段等。

#### 场景：启用持久化选项

- **给定** 一个 Pinia store
- **当** 在 store 定义中配置 `persist` 选项
- **那么** 系统必须自动保存该 store 的状态到本地存储
- **并且** 系统必须在 store 初始化时从本地存储恢复状态

#### 场景：指定存储键名

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 配置 `key` 选项指定存储键名
- **那么** 系统必须使用指定的键名存储和恢复数据

#### 场景：指定存储文件名

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 配置 `fileName` 选项指定存储文件名
- **那么** 系统必须使用指定的文件名存储和恢复数据

#### 场景：持久化指定字段

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 配置 `keys` 选项指定需要持久化的字段
- **那么** 系统必须只持久化指定的字段
- **并且** 其他字段不会被持久化

### 需求：数据保存

系统必须在 store 状态发生变化时自动保存数据到本地存储，支持防抖机制避免频繁保存。

#### 场景：状态变化时自动保存

- **给定** 一个启用了持久化选项的 Pinia store
- **当** store 的状态发生变化
- **那么** 系统必须自动保存变化后的状态到本地存储

#### 场景：防抖保存

- **给定** 一个启用了持久化选项的 Pinia store
- **当** store 的状态频繁变化
- **那么** 系统必须使用防抖机制延迟保存
- **并且** 防抖时间由 `debounce` 选项控制

#### 场景：指定字段保存

- **给定** 一个启用了持久化选项的 Pinia store，配置了 `keys` 选项
- **当** store 的状态发生变化
- **那么** 系统必须只保存指定的字段到本地存储

### 需求：数据恢复

系统必须在 store 初始化时从本地存储恢复数据，支持异步加载和错误处理。

#### 场景：初始化时恢复数据

- **给定** 一个启用了持久化选项的 Pinia store
- **当** store 被初始化
- **那么** 系统必须从本地存储加载保存的数据
- **并且** 必须使用 `$patch` 方法更新 store 的状态

#### 场景：数据不存在时保持默认值

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 本地存储中不存在该 store 的数据
- **那么** 系统必须保持 store 的默认状态
- **并且** 不执行任何状态更新

#### 场景：加载失败时输出错误

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 从本地存储加载数据失败
- **那么** 系统必须在控制台输出错误信息
- **并且** store 必须保持默认状态

## 新增需求

### 需求：Store Ready 状态管理

系统必须为每个启用了持久化选项的 Pinia store 提供独立的 ready 状态管理，包括 `isReady` 响应式状态和 `waitForReady()` 方法，并在 store 初始化时自动创建。

#### 场景：Store 初始化时创建独立的 Ready 状态

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 该 store 被初始化时
- **那么** 系统必须为该 store 创建独立的 ready 状态
- **并且** 该 ready 状态必须包含 `isReady` 响应式状态和 `waitForReady()` 方法
- **并且** 初始时 `isReady` 必须为 `false`

#### 场景：Store 持久化数据加载完成后标记 Ready

- **给定** 一个启用了持久化选项的 Pinia store，其 `isReady` 状态为 `false`
- **当** 该 store 的持久化数据加载完成（无论成功或失败）
- **那么** 系统必须将该 store 的 `isReady` 状态设置为 `true`
- **并且** 必须调用 `waitForReady()` 返回的 Promise 的 resolve 方法
- **并且** 所有等待该 store ready 的代码必须继续执行

#### 场景：Store 实例上添加 $ready 属性

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 该 store 被初始化时
- **那么** 系统必须在该 store 实例上添加 `$ready` 属性
- **并且** `$ready` 属性必须是一个对象，包含 `isReady` 和 `waitForReady()`
- **并且** `$ready` 属性必须不可枚举（`enumerable: false`）
- **并且** `$ready` 属性必须不可配置（`configurable: false`）

### 需求：等待 Store Ready 功能

系统必须提供 `waitForReady()` 方法，允许代码等待特定 store 的持久化数据加载完成，支持在 store 已经 ready 时立即返回。

#### 场景：使用 waitForReady() 等待 Store 加载完成

- **给定** 一个启用了持久化选项的 Pinia store，其 `isReady` 状态为 `false`
- **当** 代码调用 `store.$ready.waitForReady()` 方法
- **并且** 该 store 的持久化数据加载完成
- **那么** `waitForReady()` 返回的 Promise 必须 resolve
- **并且** 调用代码必须继续执行

#### 场景：Store 已经 Ready 时立即返回

- **给定** 一个启用了持久化选项的 Pinia store，其 `isReady` 状态为 `true`
- **当** 代码调用 `store.$ready.waitForReady()` 方法
- **那么** `waitForReady()` 返回的 Promise 必须 resolve
- **并且** 必须立即 resolve（不等待）

#### 场景：多个 Store 的 Ready 状态独立管理

- **给定** 两个启用了持久化选项的 Pinia store：storeA 和 storeB
- **当** storeA 的持久化数据加载完成
- **那么** storeA 的 `isReady` 状态必须为 `true`
- **并且** storeB 的 `isReady` 状态必须保持不变（如果尚未加载完成）
- **并且** 等待 storeA 的代码必须继续执行
- **并且** 等待 storeB 的代码必须继续等待

### 需求：路由 Store 等待功能

Layout 组件必须能够等待 router store 的持久化数据加载完成，然后再进行路由跳转，确保路由路径正确恢复。

#### 场景：Layout 组件等待 Router Store 加载完成

- **给定** 应用启动，Layout 组件被挂载
- **当** Layout 组件的 `onMounted` 钩子执行
- **并且** 调用 `routerStore.$ready.waitForReady()` 等待 router store 加载
- **并且** router store 的持久化数据加载完成
- **那么** 系统必须恢复上一次的路由路径
- **并且** 必须使用 `router.push()` 跳转到该路径

#### 场景：Router Store 加载延迟不影响其他功能

- **给定** 应用启动，有多个启用了持久化的 store
- **当** router store 的持久化数据加载较慢
- **那么** 其他 store 的加载和功能必须不受影响
- **并且** Layout 组件必须等待 router store 加载完成后才进行路由跳转

### 需求：错误处理

系统必须在持久化数据加载失败或数据为 null 时仍然标记 store 为 ready，确保应用能够正常启动。

#### 场景：持久化数据加载失败时仍然标记 Ready

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 该 store 的持久化数据加载失败（如文件不存在、格式错误等）
- **那么** 系统必须捕获该错误
- **并且** 必须将该 store 的 `isReady` 状态设置为 `true`
- **并且** 必须调用 `waitForReady()` 返回的 Promise 的 resolve 方法
- **并且** 必须在控制台输出错误信息

#### 场景：持久化数据为 null 时正确处理

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 该 store 的持久化数据加载结果为 `null`
- **那么** 系统必须不修改 store 的状态
- **并且** 必须将该 store 的 `isReady` 状态设置为 `true`
- **并且** 必须调用 `waitForReady()` 返回的 Promise 的 resolve 方法

### 需求：TypeScript 类型支持

系统必须提供完整的 TypeScript 类型定义，确保 `$ready` 属性在 TypeScript 代码中能够被正确识别和使用。

#### 场景：Store 实例类型包含 $ready 属性

- **给定** 一个启用了持久化选项的 Pinia store
- **当** 在 TypeScript 代码中访问该 store 实例
- **那么** TypeScript 必须识别 `$ready` 属性
- **并且** `$ready` 属性的类型必须为 `StoreReadyState`
- **并且** `StoreReadyState` 必须包含 `isReady: Ref<boolean>` 和 `waitForReady: () => Promise<void>`

#### 场景：IDE 提示正常工作

- **给定** 在 IDE 中编写代码
- **当** 输入 `store.$ready.`
- **那么** IDE 必须提示 `isReady` 和 `waitForReady` 方法
- **并且** 必须显示正确的类型信息
