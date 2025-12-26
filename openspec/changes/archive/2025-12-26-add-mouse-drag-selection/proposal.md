# 变更：音乐播放器播放列表添加鼠标框选功能

## 为什么

用户在使用音乐播放器管理大量音频文件时，需要一种更高效的多选方式来批量操作歌曲。当前实现仅支持通过 Ctrl/Cmd+点击和 Shift+点击进行多选，对于需要选择连续区域内的多个歌曲时不够直观和高效。添加鼠标框选功能将提升用户体验，使用户能够更快速地选择多个歌曲进行批量操作。

## 技术栈

- Vue 3 (Composition API + TypeScript)
- VueUse (useMouse, useEventListener)
- UnoCSS (原子化 CSS)

## 变更内容

1. **在音乐播放器播放列表中添加鼠标框选功能**

   - 支持在播放列表区域按住鼠标左键并拖动来创建选择框
   - 选择框内的所有歌曲将在释放鼠标后被选中
   - 与现有的多选逻辑（Ctrl/Cmd+点击、Shift+点击）兼容
   - 支持在已有选择的基础上进行框选（按住 Ctrl/Cmd 键）

2. **UI 视觉反馈**

   - 显示半透明的选择框（蓝色，50% 透明度）
   - 选择框的大小和位置随鼠标拖动实时更新
   - 选择过程中实时高亮显示被框选的歌曲（临时高亮状态）
   - 释放鼠标后更新实际的选中状态

3. **交互体验优化**

   - 鼠标按下时开始创建选择框
   - 鼠标拖动时调整选择框大小和位置
   - 支持滚动场景：选择框位置会自动适应容器的滚动偏移，保持与鼠标轨迹一致
   - 鼠标释放时完成选择操作
   - 支持在框选过程中取消选择（按 Esc 键）
   - 框选结束后自动区分点击事件类型，避免背景点击清空选中数据

4. **代码结构优化**
   - 在现有的 `useListSelection` hook 中添加框选功能
   - 不破坏现有的选择逻辑
   - 保持代码的模块化和可维护性

## 技术方案

1. **核心实现思路**

   - 使用 `useMouse` 跟踪鼠标位置
   - 使用 `useEventListener` 监听鼠标事件（mousedown, mousemove, mouseup）
   - 在播放列表容器上创建一个绝对定位的选择框元素
   - 计算选择框的坐标和大小
   - 检测哪些歌曲项与选择框相交
   - **分离处理临时高亮和实际选中状态**：
     - 框选过程中只更新临时高亮状态（不修改实际选中状态）
     - 释放鼠标后根据临时高亮状态更新实际选中状态
     - 支持按住 Ctrl/Cmd 键将临时高亮项添加到现有选择中
   - 支持按 Esc 键取消框选，恢复框选开始前的选择状态

2. **实现细节**

   - 在 `PlaylistPanel.vue` 中添加选择框的 DOM 元素
   - 在 `useListSelection.ts` 中添加框选相关的状态和方法
   - 使用 `getBoundingClientRect()` 获取元素位置信息，并结合容器的滚动偏移量（scrollLeft/scrollTop）进行准确的坐标计算
   - 使用矩形相交算法检测选中的歌曲项
   - 与现有的选择逻辑集成，支持组合选择
   - 引入 `isDragSelection` 标志区分普通点击和框选操作，避免框选结束后触发背景点击事件导致选中数据被清空
   - 支持虚拟列表场景，通过 DOM 查询可见项而非遍历完整列表来优化性能

3. **关键代码结构**

   ```typescript
   // 在 useListSelection.ts 中添加
   interface SelectionBox {
     startX: number
     startY: number
     currentX: number
     currentY: number
     isActive: boolean
   }

   const selectionBox = ref<SelectionBox>({
     startX: 0,
     startY: 0,
     currentX: 0,
     currentY: 0,
     isActive: false
   })

   // 鼠标事件处理函数
   const handleMouseDown = (event: MouseEvent) => {
     /* ... */
   }
   const handleMouseMove = (event: MouseEvent) => {
     /* ... */
   }
   const handleMouseUp = () => {
     /* ... */
   }

   // 标志：是否正在进行拖拽选择（用于区分普通点击和框选操作）
   const isDragSelection = ref(false)

   // 处理鼠标按下事件 - 开始选择
   const handleMouseDown = (event: MouseEvent) => {
     // ...
     isDragSelection.value = true
     const containerRect = container.getBoundingClientRect()
     // 考虑容器的滚动偏移量
     selectionBox.value = {
       startX: event.clientX - containerRect.left + container.scrollLeft,
       startY: event.clientY - containerRect.top + container.scrollTop,
       currentX: event.clientX - containerRect.left + container.scrollLeft,
       currentY: event.clientY - containerRect.top + container.scrollTop,
       isActive: true
     }
   }

   // 处理鼠标移动事件 - 更新选择框
   const handleMouseMove = (event: MouseEvent) => {
     // ...
     const containerRect = container.getBoundingClientRect()
     // 考虑容器的滚动偏移量
     selectionBox.value.currentX = event.clientX - containerRect.left + container.scrollLeft
     selectionBox.value.currentY = event.clientY - containerRect.top + container.scrollTop
     updateTemporaryHighlight()
   }

   // 处理鼠标释放事件 - 完成选择
   const handleMouseUp = () => {
     // ...
     resetSelectionBox()
     // 延迟一小段时间再重置标志，确保click事件不会被误判
     setTimeout(() => {
       isDragSelection.value = false
     }, 100)
   }

   // 处理背景点击事件
   const handleBackgroundClick = () => {
     // 如果正在进行框选或刚完成框选（避免框选后触发click事件清空选择）
     if (isDragSelection.value) return
     // ...原有逻辑
   }

   // 更新临时高亮的项
   const updateTemporaryHighlight = () => {
     // ...
     // 通过DOM查询可见项而非遍历完整列表，优化虚拟列表场景性能
     const rowElements = effectiveContainerRef.value.querySelectorAll('[data-index]')
     rowElements.forEach(element => {
       // 检测是否在选择框内
     })
   }
   ```

## 影响

- **受影响规范**：

  - `openspec/changes/archive/2025-12-25-add-music-player/specs/music-player/spec.md`（扩展现有播放列表功能）

- **受影响代码**：

  - `src/views/MusicPlayer/hooks/useListSelection.ts`（添加框选功能）
  - `src/views/MusicPlayer/components/PlaylistPanel.vue`（添加选择框 UI）
  - 不影响其他功能模块

- **兼容性**：
  - 与现有的多选逻辑完全兼容
  - 不改变现有的快捷键行为
  - 支持所有主流浏览器

## 风险评估

- **性能风险**：当播放列表中包含大量歌曲时，实时检测选中项可能会影响性能

  - 应对措施：使用节流（throttle）优化鼠标移动事件处理

- **UI 风险**：选择框可能与其他 UI 元素冲突

  - 应对措施：确保选择框的 z-index 适当，不遮挡重要 UI 元素

- **交互风险**：用户可能误触框选功能
  - 应对措施：仅在播放列表区域内的空白处或歌曲项上触发框选，避免在按钮等交互元素上触发
