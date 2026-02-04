## 1. 重构 CanvasContainer.vue 事件处理

- [x] 1.1 添加输入框保护逻辑，避免在输入框中触发平移模式
- [x] 1.2 修复 handleKeyDown：按下空格键时立即设置 isPanning.value = true 并更新光标
- [x] 1.3 修复 handleKeyUp：释放空格键时设置 isPanning.value = false 并恢复光标
- [x] 1.4 简化 handleDomMouseDown：移除 isSpacePressed 检查，依赖 isPanning.value
- [x] 1.5 确保 handlePanWithDelta 正确响应 isPanning 状态变化

## 2. 修复状态同步问题

- [x] 2.1 检查并统一 canvasCore.isPanning 和组件内部 isPanning.value 的使用
- [x] 2.2 确保 emit('pan-start') 和 emit('pan-end') 在正确的时机触发
- [x] 2.3 添加状态同步测试，验证光标与实际状态一致

## 3. 代码清理与验证

- [x] 3.1 移除未使用的状态变量（如 isSpacePressed 如果不再需要）
- [x] 3.2 运行 pnpm lint 自动修复代码格式
- [x] 3.3 运行 pnpm fmt 格式化代码
- [x] 3.4 运行 pnpm check 进行类型检查
- [x] 3.5 手动测试所有平移场景

## 4. 测试验证

- [x] 4.1 测试按下空格键时光标立即变为 grab
- [x] 4.2 测试按住空格键拖拽可以正确平移画布
- [x] 4.3 测试释放鼠标或空格键时停止平移
- [x] 4.4 测试输入框保护功能
- [x] 4.5 确保不影响其他画布操作（缩放、选择、绘制）
