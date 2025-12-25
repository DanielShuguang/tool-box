# 变更：添加本地音乐播放器页面

## 为什么

用户需要一个便捷的本地音乐播放器工具，用于播放和管理本地音频文件，提升工具箱应用的实用性和用户体验。

## 变更内容

- 添加新的音乐播放器页面，支持常见音频格式（mp3, wav, flac, m4a, ogg）
- 实现播放控制功能（播放、暂停、上一首、下一首、进度条、音量控制）
- 支持播放列表管理（添加、删除、排序）
- 支持文件夹导入和拖拽导入音频文件
- 显示当前播放歌曲信息（标题、艺术家、专辑、时长）
- 支持循环播放和随机播放模式
- 持久化播放列表和播放状态
- 采用左右布局设计，左侧为播放器控制区，右侧为播放列表
- 实现长歌名自动滚动动画效果（使用 motion-v）
- 支持响应式设计，在小屏幕上自动切换为垂直布局
- 使用 UnoCSS 实现响应式样式
- 将业务逻辑拆分为多个 hooks（useAudioCore、usePlaylist、usePlayMode、useVolume、useFileLoader、useAudioDrop）
- 后端调用封装到 src/backend-channel/music-player.ts

## 影响

- 受影响规范：无（新增功能）
- 受影响代码：
  - 新增 `src/views/MusicPlayer/` 目录及组件
  - 新增 `src/views/MusicPlayer/useAudioCore.ts` - 音频播放核心功能
  - 新增 `src/views/MusicPlayer/usePlaylist.ts` - 播放列表管理
  - 新增 `src/views/MusicPlayer/usePlayMode.ts` - 播放模式处理
  - 新增 `src/views/MusicPlayer/useVolume.ts` - 音量控制
  - 新增 `src/views/MusicPlayer/useFileLoader.ts` - 文件选择和加载
  - 新增 `src/views/MusicPlayer/useAudioDrop.ts` - 拖放功能
  - 修改 `src/router/index.ts` 添加路由
  - 新增 `src/backend-channel/music-player.ts` 前后端通信模块
  - 新增 `src/backend-channel/models/music-player.ts` 后端通信模型
  - 新增 `src-tauri/src/music_player.rs` Rust 后端模块
