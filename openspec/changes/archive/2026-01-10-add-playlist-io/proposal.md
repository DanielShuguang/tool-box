# 变更：播放列表导入导出功能

## 为什么

用户需要备份、分享和恢复播放列表数据，以支持跨设备迁移、数据备份和与其他音乐播放器软件的兼容性。

## 变更内容

### 新增功能

1. **导出播放列表**
   - 导出当前播放列表到本地文件
   - 支持三种格式：JSON（完整备份）、M3U8（标准格式）、PLS（INI格式）
   - 使用绝对路径存储，确保导入时文件可定位

2. **导入播放列表**
   - 从本地文件导入播放列表
   - 自动识别文件格式（根据扩展名）
   - 验证文件路径有效性
   - 处理导入冲突（播放列表重名、路径不存在）

3. **冲突处理机制**
   - 播放列表重名：跳过、重命名、覆盖
   - 路径不存在：提示用户并提供统计信息
   - 支持批量应用冲突处理策略

4. **UI交互**
   - 在工具栏操作下拉菜单中添加导出/导入选项
   - 导出格式选择对话框
   - 冲突处理对话框

## 影响

### 受影响规范

- music-player（新增导入导出相关需求）

### 受影响代码

- **新增文件**：
  - `src/views/MusicPlayer/hooks/usePlaylistIO.ts` - 导入导出核心逻辑
  - `src/views/MusicPlayer/utils/playlistFormat.ts` - 格式转换工具
  - `src/backend-channel/file-io.ts` - 文件读写封装

- **修改文件**：
  - `src/views/MusicPlayer/hooks/useTopActions.ts` - 扩展操作菜单
  - `src/views/MusicPlayer/components/PlaylistPanel.vue` - 添加UI组件
  - `src/stores/musicPlayer.ts` - 可能需要添加导入导出方法

### 非功能需求

- 性能：支持导出大量歌曲（>1000首）
- 兼容性：生成的M3U8/PLS格式应兼容主流播放器（Winamp、VLC、Foobar2000等）
- 用户体验：清晰的错误提示和进度反馈
