## 上下文

### 当前状态

`src/views/CanvasBoard/hooks/useHistory.ts` 当前约 212 行代码，混合了三个核心功能：

1. **历史记录管理**：撤销/恢复的内存栈 (`historyStack`, `historyIndex`)
2. **自动保存**：定时器 (`setInterval`) 每 5 秒执行一次
3. **持久化存储**：使用 `localStorage` 保存自动保存数据

### 约束条件

- 现有 `CanvasBoard.vue` 调用 `useHistory` 的方式需保持兼容
- 使用 Tauri store 替代 localStorage（项目已安装 `@tauri-apps/plugin-store`）
- 单个文件不超过 300 行
- 函数参数不超过 3 个

### 利益相关者

- 画板用户：希望撤销/恢复功能正常工作，自动保存不丢失数据
- 开发者：希望代码易于维护和扩展

## 目标 / 非目标

**目标：**

- 拆分 `useHistory.ts` 为职责清晰的独立模块
- 使用 Tauri store 替代 localStorage，支持更大容量
- 保持对外 API 兼容，无破坏性变更
- 增强错误处理和边界情况处理

**非目标：**

- 不实现云端同步功能
- 不改变现有的撤销/恢复核心逻辑
- 不添加多版本历史记录（当前仅保存最近一次自动保存）

## 决策

### 1. 模块拆分策略

| 模块               | 职责                        | 文件                  |
| ------------------ | --------------------------- | --------------------- |
| `useHistory`       | 组合入口，对外提供统一 API  | `useHistory.ts`       |
| `useHistoryStack`  | 历史栈内存管理（undo/redo） | `useHistoryStack.ts`  |
| `useAutoSave`      | 自动保存定时器逻辑          | `useAutoSave.ts`      |
| `useCanvasStorage` | Tauri store 持久化          | `useCanvasStorage.ts` |

**决策理由**：将历史栈、自动保存、存储三者解耦，每个模块职责单一，便于单独测试和维护。

### 2. 存储键命名

采用前缀 + 功能命名：

- `canvas_autosave` → `canvas.autoSave`（自动保存数据）
- `canvas_version` → `canvas.version`（版本号，用于格式迁移）

**备选方案**：使用枚举统一管理存储键。**采用理由**：简单直观，与现有 localStorage 键名保持一定兼容性。

### 3. 历史栈是否持久化

**决策**：仅持久化自动保存数据，不持久化历史栈。

**备选方案 1**：持久化整个历史栈

- 优点：用户关闭页面后可以继续之前的撤销/恢复操作
- 缺点：数据量可能较大，增加存储开销

**备选方案 2**：仅持久化当前状态（当前方案）

- 优点：实现简单，聚焦核心功能
- 缺点：关闭页面后历史记录丢失

**采用理由**：当前产品需求聚焦于"不丢失画布内容"，而非"保留完整历史"。后续可迭代扩展。

### 4. 存储数据格式

```typescript
interface CanvasAutoSaveData {
  state: HistoryState; // 画布 JSON 状态
  timestamp: number; // 保存时间戳
  version: number; // 数据版本号（当前为 1）
}
```

**备选方案**：仅保存 state 和 timestamp。**采用理由**：添加 version 字段便于未来格式迁移，是最佳实践。

### 5. Tauri Store 使用方式

直接使用 `src/utils/storage.ts` 中的 `load` / `save` 函数，指定 `ConfigFile.Canvas`。

```typescript
import { load, save, ConfigFile } from "@/utils/storage";
```

**备选方案**：封装专用 CanvasStorageAdapter。**采用理由**：`storage.ts` 已封装良好，直接复用更简洁。

## 风险 / 权衡

1. **Tauri Store 异步特性** → 现有 `useHistory` 为同步 API，需将相关方法改为 async
   - 缓解：自动保存在后台执行，不阻塞用户操作；`loadFromLocalStorage` 在页面加载时调用，可接受异步等待

2. **首次加载性能** → Tauri Store 需要异步初始化
   - 缓解：使用 Vue 的 `onMounted` 异步加载，不影响首屏渲染

3. **数据迁移** → 未来数据结构变更需考虑兼容
   - 缓解：存储数据包含 version 字段，可据此做版本兼容处理

4. **API 兼容性** → 拆分后 CanvasBoard.vue 调用方式可能需要调整
   - 缓解：通过 `useHistory` 组合入口统一暴露，保持调用方不变

## 迁移计划

1. **第一阶段**：创建新模块文件
   - 创建 `useHistoryStack.ts`
   - 创建 `useAutoSave.ts`
   - 创建 `useCanvasStorage.ts`

2. **第二阶段**：重构 `useHistory.ts`
   - 组合新模块
   - 将 localStorage 调用替换为 Tauri store

3. **第三阶段**：测试验证
   - 撤销/恢复功能正常
   - 自动保存正常工作
   - 页面刷新后数据恢复

4. **第四阶段**：清理
   - 删除旧的 localStorage 逻辑（如有）
   - 运行 lint、typecheck

## 待定事项

1. 是否需要在 ConfigFile 枚举中添加 Canvas 专属配置？
2. 自动保存间隔（当前 5 秒）是否需要作为配置项暴露给用户？
