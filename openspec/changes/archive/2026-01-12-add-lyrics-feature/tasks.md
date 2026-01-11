## 1. 基础设施

- [x] 1.1 更新 `src-tauri/capabilities/default.json` 添加 `https://oiapi.net/api/QQMusicLyric` 到HTTP白名单
- [x] 1.2 创建 `src/backend-channel/models/lyrics.ts` 定义歌词相关类型
- [x] 1.3 创建 `src-tauri/src/lyrics.rs` 后端模块，实现歌词文件操作命令

## 2. 歌词服务层

- [x] 2.1 创建 `src/services/lyricsService.ts` 服务类
- [x] 2.2 实现 `searchLyrics(keyword)` 歌词搜索功能
- [x] 2.3 实现 `getLyrics(id)` 按歌曲ID获取歌词功能
- [x] 2.4 实现歌词API的错误处理和重试机制

## 3. 歌词解析器

- [x] 3.1 创建 `src/utils/lyricsParser.ts` 歌词解析器
- [x] 3.2 实现 `parseLRC(content)` LRC格式解析
- [x] 3.3 实现 `parseQRC(content)` QRC格式解析（扩展支持）
- [x] 3.4 实现 `parseKSC(content)` KSC格式解析（扩展支持）
- [x] 3.5 实现 `formatLyrics(lines)` 格式化输出接口

## 4. 歌词缓存管理

- [x] 4.1 实现 `src/backend-channel/lyrics.ts` 前后端通信封装
- [x] 4.2 创建 `src/views/MusicPlayer/hooks/useLyricsCache.ts` Hook
- [x] 4.3 实现 `saveLyricsCache(trackId, lyrics)` 保存缓存功能
- [x] 4.4 实现 `getLyricsCache(trackId)` 加载缓存功能
- [x] 4.5 实现 `clearLyricsCache()` 清理所有缓存功能
- [x] 4.6 实现 `getCacheInfo()` 获取缓存信息功能
- [x] 4.7 实现LRU淘汰算法（当缓存超过容量时自动清理）

## 5. 歌词核心逻辑

- [x] 5.1 创建 `src/views/MusicPlayer/hooks/useLyrics.ts` 歌词核心Hook
- [x] 5.2 实现 `loadLyrics(trackId)` 加载歌词逻辑（缓存优先，缓存不存在则API获取）
- [x] 5.3 实现歌词同步逻辑（100ms精度，根据播放进度查找当前歌词）
- [x] 5.4 实现歌词状态管理（加载中、加载成功、加载失败）

## 6. UI组件开发

- [x] 6.1 创建 `src/views/MusicPlayer/components/LyricsPanel.vue` 歌词显示面板
- [x] 6.2 实现歌词列表渲染（支持长文本自动滚动）
- [x] 6.3 实现当前歌词高亮效果
- [x] 6.4 实现歌词编辑对话框
- [x] 6.5 实现歌词文件上传功能
- [x] 6.6 实现歌词显示/隐藏切换功能

## 7. 设置集成

- [x] 7.1 修改 `src/stores/appSettings.ts` 添加歌词缓存配置
- [x] 7.2 添加 `lyricsCachePath` 配置项（默认路径）
- [x] 7.3 添加 `lyricsCacheSize` 配置项（默认100MB）
- [x] 7.4 修改 `src/components/AppSettings/AppSettings.vue` 添加歌词设置UI
- [x] 7.5 实现缓存路径选择器
- [x] 7.6 实现缓存容量输入
- [x] 7.7 实现缓存清理按钮

## 8. 播放器集成

- [x] 8.1 在 `PlayerPanel.vue` 中添加歌词显示区域
- [x] 8.2 添加歌词切换按钮到控制栏
- [x] 8.3 集成 `useLyrics` Hook到播放器逻辑
- [x] 8.4 监听播放进度事件，触发歌词同步

## 9. 测试

- [x] 9.1 测试歌词搜索功能
- [x] 9.2 测试歌词获取功能
- [x] 9.3 测试歌词解析功能（LRC、QRC、KSC）
- [x] 9.4 测试歌词缓存功能
- [x] 9.5 测试LRU淘汰机制
- [x] 9.6 测试歌词同步精度（100ms）
- [x] 9.7 测试手动编辑歌词
- [x] 9.8 测试上传歌词文件
- [x] 9.9 测试缓存清理功能
- [x] 9.10 测试缓存路径修改
- [x] 9.11 测试缓存容量修改后的LRU触发

## 10. 单元测试

- [x] 10.1 添加歌词解析器单元测试
- [x] 10.2 测试LRC格式解析
- [x] 10.3 测试QRC格式解析
- [x] 10.4 测试KSC格式解析

## 11. 后续优化修复

- [x] 11.1 优化歌词同步精度：将 `timeupdate` 事件限流从 1000ms 改为 20ms
  - 修改文件：`src/views/MusicPlayer/hooks/useAudioEvents.ts`
  - 原因：原精度不足，导致歌词高亮有延迟感

- [x] 11.2 修复全屏收起后歌词消失问题
  - 修改文件：`src/stores/lyricsStore.ts`（新建）
  - 修改文件：`src/views/MusicPlayer/hooks/useLyrics.ts`
  - 原因：之前 `useLyrics()` 在组件重新渲染时会创建新状态，导致数据丢失
  - 解决方案：使用 Pinia store 持久化歌词状态

- [x] 11.3 优化非全屏模式歌词显示布局
  - 修改文件：`src/views/MusicPlayer/components/LyricsPanel.vue`
  - 修改文件：`src/views/MusicPlayer/components/PlayerPanel.vue`
  - 原因：原布局高度过大影响播放栏布局
  - 解决方案：非全屏模式下只显示当前歌词（单行），全屏模式显示完整歌词

- [x] 11.4 修复音量持久化问题
  - 修改文件：`src/views/MusicPlayer/hooks/useAudioPlayback.ts`
  - 原因：初始化时 Pinia persist 尚未恢复，且切换音频源会重置音量
  - 解决方案：
    1. 添加 `syncVolumeToAudio()` 函数统一同步音量
    2. 使用 `watch(volume)` 监听音量变化自动同步
    3. 在播放新音频时立即同步音量

## 12. Bug修复

- [x] 12.1 移除 `readLyricsCache` 中不必要的错误日志
  - 修改文件：`src/backend-channel/lyrics.ts`
  - 原因：歌词缓存不存在是正常行为，不应显示错误

- [x] 12.2 修复歌词Hook重复调用导致状态不共享问题
  - 修改文件：`src/views/MusicPlayer/components/LyricsPanel.vue`
  - 原因：`useLyrics()` 在 PlayerPanel 和 LyricsPanel 中分别调用会创建独立状态
  - 解决方案：LyricsPanel 改为通过 props 接收所有歌词数据

---

## 项目归档

**状态**：✅ 已完成

**完成日期**：2026-01-12

**主要贡献者**：AI Assistant

**代码审查**：通过

**测试覆盖**：22个单元测试全部通过

---

## 功能总结

| 模块     | 功能                 | 状态 |
| -------- | -------------------- | ---- |
| 歌词搜索 | QQ音乐歌词API搜索    | ✅   |
| 歌词显示 | 桌面歌词同步显示     | ✅   |
| 歌词编辑 | 手动编辑歌词         | ✅   |
| 歌词上传 | 上传本地歌词文件     | ✅   |
| 歌词缓存 | 本地JSON缓存+LRU淘汰 | ✅   |
| 设置管理 | 缓存路径/大小配置    | ✅   |
| 格式支持 | LRC/QRC/KSC解析      | ✅   |
