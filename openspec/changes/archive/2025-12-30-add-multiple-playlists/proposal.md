# 变更：音乐播放器支持多个播放列表

## 为什么

当前音乐播放器仅支持单个播放列表，用户无法创建和管理多个播放列表来组织不同类型的音乐。为了提升用户体验，需要支持多个播放列表功能，允许用户创建、切换和管理多个播放列表。

## 变更内容

### 1. 多播放列表数据结构
- 将当前单一播放列表改造为播放列表集合
- 每个播放列表包含唯一标识符、名称和音频文件列表
- 支持播放列表的创建、删除、重命名操作

### 2. 默认播放列表
- 系统必须提供一个默认播放列表
- 默认播放列表不可删除、不可重命名
- 默认播放列表作为初始播放列表

### 3. 播放列表切换
- 用户可以在多个播放列表之间切换
- 切换播放列表时，当前播放状态需要正确处理
- 每个播放列表独立维护其排序和搜索状态

### 4. UI 布局调整
- 在播放列表面板左侧添加播放列表列表
- 显示所有播放列表名称
- 当前激活的播放列表需要高亮显示
- 支持播放列表的创建、删除、重命名操作

### 5. 数据持久化
- 所有播放列表数据需要持久化存储
- 当前选中的播放列表需要保存
- 支持应用重启后恢复所有播放列表

## 影响

- **受影响规范**: `music-player` 功能
- **受影响代码**:
  - `src/stores/musicPlayer.ts` - 需要重构播放列表数据结构
  - `src/views/MusicPlayer/components/PlaylistPanel.vue` - 需要添加播放列表列表 UI
  - `src/views/MusicPlayer/hooks/usePlaylist.ts` - 需要支持多播放列表操作
  - `src/views/MusicPlayer/contexts/PlayerContext.ts` - 可能需要更新上下文接口

## 技术方案

### 数据结构设计
```typescript
interface Playlist {
  id: string
  name: string
  tracks: AudioFile[]
  sortOption: SortOption
  sortOrder: 'asc' | 'desc'
  isDefault: boolean
}

interface MusicPlayerState {
  playlists: Playlist[]
  currentPlaylistId: string
  // ... 其他状态
}
```

### 存储策略
- 使用 Pinia store 持久化所有播放列表数据
- 默认播放列表在初始化时自动创建
- 播放列表数据存储在 `ConfigFile.MusicPlayer` 配置文件中

### UI 布局
- 播放列表列表位于播放列表面板左侧
- 使用垂直列表展示所有播放列表
- 当前播放列表高亮显示
- 支持右键菜单进行播放列表操作

