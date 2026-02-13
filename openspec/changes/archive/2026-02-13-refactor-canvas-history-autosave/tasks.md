## 1. 创建新模块文件

- [x] 1.1 创建 `useHistoryStack.ts` - 历史栈内存管理模块，包含 undo/redo 逻辑
- [x] 1.2 创建 `useAutoSave.ts` - 自动保存定时器逻辑模块
- [x] 1.3 创建 `useCanvasStorage.ts` - Tauri store 持久化存储模块

## 2. 重构 useHistory.ts

- [x] 2.1 重构 `useHistory.ts` - 组合三个新模块，对外提供统一 API
- [x] 2.2 更新类型定义 - 在 `types.ts` 中添加存储相关类型（如 CanvasAutoSaveData）

## 3. 测试验证

- [x] 3.1 验证撤销/恢复功能正常 - 多次撤销和恢复操作
- [x] 3.2 验证自动保存功能 - 等待自动保存触发，检查存储数据
- [x] 3.3 验证页面刷新后恢复 - 刷新页面，验证自动保存数据正确恢复
- [x] 3.4 运行 lint 和 typecheck - 执行增量检查命令

## 4. 清理

- [x] 4.1 删除旧的 localStorage 相关代码（如有残留）
- [x] 4.2 更新 hooks/index.ts 导出 - 确保新模块正确导出
