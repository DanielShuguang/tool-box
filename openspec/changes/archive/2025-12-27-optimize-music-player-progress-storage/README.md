# 2025-12-27-optimize-music-player-progress-storage 归档记录

## 归档时间
2025-12-27

## 提案概述
优化音乐播放器进度存储，从多音轨存储模式改为单音轨存储模式。

## 主要变更
- 将 `Record<string, number>` 多音轨存储改为单音轨存储结构
- 新结构：`currentTrackId`, `currentTime`, `isPlaying`
- 添加数据迁移逻辑
- 移除不稳定的 setTimeout，使用音频事件驱动
- 添加预加载时的 loading 状态
- 实现正确的 store 初始化

## 影响文件
- `src/stores/musicPlayer.ts`
- `src/views/MusicPlayer/hooks/usePlaybackProgress.ts`
- `src/views/MusicPlayer/hooks/useAudioCore.ts`
- `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts`
- `src/views/MusicPlayer/MusicPlayer.vue`
- `src/views/MusicPlayer/contexts/PlayerContext.ts`

## 状态
✅ 已完成并归档

## 技术改进
- 存储结构优化
- 事件驱动的音频加载
- 完善的初始化流程
- 类型安全性提升
- 用户体验改善（loading状态）