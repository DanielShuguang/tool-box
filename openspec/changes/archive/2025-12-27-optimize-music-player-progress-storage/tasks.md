## 1. 实施

### 1.1 存储结构改造
- [x] 1.1.1 修改 `src/stores/musicPlayer.ts` 中的 `usePlaybackProgressStore` 状态定义
- [x] 1.1.2 将 `playbackProgress: Record<string, number>` 改为 `currentTrackId`、`currentTime`、`isPlaying`
- [x] 1.1.3 更新 `saveProgress` 方法，仅保存当前播放音乐的进度
- [x] 1.1.4 更新 `getProgress` 方法，返回当前播放音乐的进度
- [x] 1.1.5 更新 `pauseProgress` 方法，更新 `isPlaying` 状态
- [x] 1.1.6 更新 `clearProgress` 方法，清空所有状态
- [x] 1.1.7 移除 `clearAllProgress` 方法（不再需要）
- [x] 1.1.8 更新 Pinia persist 配置，仅持久化 `currentTrackId`、`currentTime`、`isPlaying`

### 1.2 Hook 简化
- [x] 1.2.1 修改 `src/views/MusicPlayer/hooks/usePlaybackProgress.ts`
- [x] 1.2.2 移除不必要的 trackId 参数
- [x] 1.2.3 直接使用 store 中的 `currentTrackId` 和 `currentTime`
- [x] 1.2.4 更新 `setCurrentTrack` 方法，在切换音乐时更新 store 状态
- [x] 1.2.5 更新返回值，确保与新的 API 一致

### 1.3 预加载机制实现
- [x] 1.3.1 在 `src/views/MusicPlayer/hooks/useAudioCore.ts` 中添加 `preloadTrack` 方法
- [x] 1.3.2 添加 `preloadedTrack` 状态，用于跟踪已预加载的音乐
- [x] 1.3.3 实现 `preloadTrack` 方法，使用 HTML5 Audio API 预加载音轨
- [x] 1.3.4 添加 `applyPreloadedTrack` 方法，检查是否可以使用预加载的音轨
- [x] 1.3.5 在预加载失败时进行错误处理和日志记录
- [x] 1.3.6 确保预加载完成后正确释放旧音轨资源

### 1.4 初始化加载逻辑
- [x] 1.4.1 在 `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts` 中添加 `initializeProgress` 方法
- [x] 1.4.2 在 `initializeProgress` 中检查 `playbackProgressStore` 中是否有保存的播放进度
- [x] 1.4.3 如果有保存的进度，获取对应的音乐信息
- [x] 1.4.4 调用 `audioCore.preloadTrack()` 预加载该音乐音轨
- [x] 1.4.5 预加载完成后，设置播放时间到保存的进度位置
- [x] 1.4.6 在组件初始化时调用 `initializeProgress`

### 1.5 播放器协调器更新
- [x] 1.5.1 更新 `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts` 中的 `playTrack` 方法
- [x] 1.5.2 在播放音乐时，先检查是否已预加载该音乐
- [x] 1.5.3 如果已预加载，直接使用预加载的音轨
- [x] 1.5.4 如果未预加载，则加载新音轨
- [x] 1.5.5 确保切换音乐时正确更新 `playbackProgressStore` 的状态

### 1.6 组件初始化更新
- [x] 1.6.1 更新 `src/views/MusicPlayer/MusicPlayer.vue` 组件
- [x] 1.6.2 在组件初始化时调用进度初始化逻辑
- [x] 1.6.3 确保初始化过程不阻塞用户界面
- [x] 1.6.4 添加加载状态提示，提升用户体验

### 1.7 数据迁移
- [x] 1.7.1 在应用启动时检查数据格式
- [x] 1.7.2 如果检测到旧版本数据，进行数据迁移
- [x] 1.7.3 迁移时保留当前播放音乐的进度
- [x] 1.7.4 忽略其他音乐的进度（不再需要）
- [x] 1.7.5 确保迁移过程不会丢失重要数据

### 1.8 代码质量检查
- [x] 1.8.1 运行 `pnpm lint` 检查代码规范
- [x] 1.8.2 运行 `pnpm fmt` 格式化代码
- [x] 1.8.3 运行 `pnpm check` 进行类型检查
- [x] 1.8.4 修复所有 lint 错误和类型错误

## 2. 测试

### 2.1 单元测试
- [ ] 2.1.1 编写 `usePlaybackProgressStore` 的单元测试
- [ ] 2.1.2 测试 `saveProgress` 方法是否正确保存当前播放音乐的进度
- [ ] 2.1.3 测试 `getProgress` 方法是否正确返回当前播放音乐的进度
- [ ] 2.1.4 测试 `pauseProgress` 方法是否正确更新 `isPlaying` 状态
- [ ] 2.1.5 测试 `clearProgress` 方法是否正确清空所有状态
- [ ] 2.1.6 测试 `setCurrentTrack` 方法是否正确切换音乐
- [ ] 2.1.7 编写 `preloadTrack` 方法的单元测试
- [ ] 2.1.8 测试预加载功能是否正常工作
- [ ] 2.1.9 测试预加载失败时的错误处理

### 2.2 集成测试
- [ ] 2.2.1 测试初始化加载进度功能
- [ ] 2.2.2 测试预加载机制是否正常工作
- [ ] 2.2.3 测试切换音乐时进度是否正确更新
- [ ] 2.2.4 测试播放、暂停、停止等操作对进度的影响
- [ ] 2.2.5 测试数据迁移功能是否正常工作
- [ ] 2.2.6 测试预加载音轨后能否立即播放

### 2.3 功能测试
- [ ] 2.3.1 测试单音乐进度存储功能是否正常工作
- [ ] 2.3.2 测试音乐切换时进度是否正确更新
- [ ] 2.3.3 测试初始化加载进度后能否立即响应播放操作
- [ ] 2.3.4 测试预加载机制是否无播放延迟
- [ ] 2.3.5 测试应用关闭后重新打开，进度是否正确恢复
- [ ] 2.3.6 测试播放状态（播放中/暂停）是否正确保存和恢复

### 2.4 性能测试
- [ ] 2.4.1 对比改造前后的初始化时间
- [ ] 2.4.2 对比改造前后的内存占用
- [ ] 2.4.3 测试预加载机制对应用启动速度的影响
- [ ] 2.4.4 测试长时间使用后的内存占用情况
- [ ] 2.4.5 测试大文件预加载的性能表现

### 2.5 兼容性测试
- [ ] 2.5.1 测试旧版本数据能否正确迁移
- [ ] 2.5.2 测试新版本数据能否正确加载
- [ ] 2.5.3 测试不同操作系统的兼容性
- [ ] 2.5.4 测试不同音频格式的兼容性

### 2.6 边界情况测试
- [ ] 2.6.1 测试没有保存进度时的初始化行为
- [ ] 2.6.2 测试保存的进度对应的音乐不存在时的行为
- [ ] 2.6.3 测试预加载失败时的行为
- [ ] 2.6.4 测试快速切换音乐时的行为
- [ ] 2.6.5 测试播放进度超出音乐长度时的行为

## 3. 文档

### 3.1 代码注释
- [ ] 3.1.1 为 `usePlaybackProgressStore` 添加详细的代码注释
- [ ] 3.1.2 为 `preloadTrack` 方法添加详细的代码注释
- [ ] 3.1.3 为 `initializeProgress` 方法添加详细的代码注释
- [ ] 3.1.4 为其他修改的方法添加必要的代码注释

### 3.2 API 文档
- [ ] 3.2.1 更新 `usePlaybackProgressStore` 的 API 文档
- [ ] 3.2.2 更新 `usePlaybackProgress` Hook 的 API 文档
- [ ] 3.2.3 添加 `preloadTrack` 方法的 API 文档
- [ ] 3.2.4 添加 `initializeProgress` 方法的 API 文档

### 3.3 用户文档
- [ ] 3.3.1 更新音乐播放器功能说明
- [ ] 3.3.2 说明新的播放进度存储机制
- [ ] 3.3.3 说明预加载机制带来的体验改进
- [ ] 3.3.4 添加常见问题解答（FAQ）

### 3.4 开发者文档
- [ ] 3.4.1 添加数据迁移指南
- [ ] 3.4.2 添加预加载机制的设计说明
- [ ] 3.4.3 添加存储结构的设计说明
- [ ] 3.4.4 添加 API 变更说明
