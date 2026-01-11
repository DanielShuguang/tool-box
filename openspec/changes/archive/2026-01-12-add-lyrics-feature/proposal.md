# 变更：为音乐播放器增加歌词功能

## 为什么

用户在播放音乐时希望查看歌词，以获得更好的音乐体验。通过集成QQ音乐歌词API和本地缓存机制，提供快速、离线的歌词显示功能，满足用户的歌词需求。

## 变更内容

- **歌词获取**：集成QQ音乐歌词API，支持按歌曲ID或关键词搜索歌词
- **歌词格式**：支持LRC、QRC、KSCl三种主流歌词格式
- **歌词缓存**：将歌词缓存到本地JSON文件，支持LRU淘汰策略
- **歌词显示**：在播放器页面显示歌词区域，支持100ms精度的同步高亮
- **歌词编辑**：支持用户手动编辑和上传本地歌词文件
- **缓存配置**：在设置中添加缓存路径和容量配置
- **缓存清理**：支持手动清理和自动清理（达到容量上限时触发LRU淘汰）
- **扩展性**：预留桌面歌词显示接口，便于后续功能扩展

## 影响

- **受影响规范**：`music-player` 功能
- **受影响代码**：
  - 新增 `src/views/MusicPlayer/components/LyricsPanel.vue` - 歌词显示面板组件
  - 新增 `src/views/MusicPlayer/hooks/useLyrics.ts` - 歌词核心逻辑Hook
  - 新增 `src/views/MusicPlayer/hooks/useLyricsCache.ts` - 缓存管理Hook
  - 新增 `src/utils/lyricsParser.ts` - 歌词解析器
  - 新增 `src/services/lyricsService.ts` - 歌词API服务层
  - 新增 `src/backend-channel/lyrics.ts` - 前后端通信封装
  - 新增 `src/backend-channel/models/lyrics.ts` - 歌词相关类型定义
  - 新增 `src-tauri/src/lyrics.rs` - Rust后端歌词文件操作模块
  - 修改 `src/stores/appSettings.ts` - 添加缓存路径和容量配置
  - 修改 `src/stores/musicPlayer.ts` - 添加歌词相关状态
  - 修改 `src/components/AppSettings/AppSettings.vue` - 添加歌词设置UI
  - 修改 `src-tauri/capabilities/default.json` - 添加API白名单
