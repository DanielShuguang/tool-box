# 实施任务

## 1. 实施

### 1.1 创建格式转换工具

- [x] 1.1.1 创建 `src/views/MusicPlayer/utils/playlistFormat.ts`
- [x] 1.1.2 实现 `exportToJson(playlist)` 函数
- [x] 1.1.3 实现 `exportToM3U8(playlist)` 函数
- [x] 1.1.4 实现 `exportToPLS(playlist)` 函数
- [x] 1.1.5 实现 `importFromJson(content)` 函数
- [x] 1.1.6 实现 `importFromM3U8(content)` 函数
- [x] 1.1.7 实现 `importFromPLS(content)` 函数
- [x] 1.1.8 实现 `autoDetectFormat(filePath)` 函数

### 1.2 创建文件IO封装

- [x] 1.2.1 创建 `src/backend-channel/file-io.ts`
- [x] 1.2.2 实现 `saveFile(content, defaultName, filters)` 函数
- [x] 1.2.3 实现 `readFile(filePath)` 函数
- [x] 1.2.4 实现 `saveFiles(contentMap)` 函数（批量保存，用于M3U8/PLS导出）

### 1.3 创建导入导出Hook

- [x] 1.3.1 创建 `src/views/MusicPlayer/hooks/usePlaylistIO.ts`
- [x] 1.3.2 实现 `exportPlaylist(format)` 函数（调用格式转换 + 文件保存）
- [x] 1.3.3 实现 `importPlaylist()` 函数（文件选择 + 格式检测 + 解析）
- [x] 1.3.4 实现 `validatePaths(tracks)` 函数（验证文件路径有效性）
- [x] 1.3.5 实现 `detectConflicts(importedPlaylists)` 函数（检测冲突）
- [x] 1.3.6 实现 `resolveConflicts(conflicts, resolution)` 函数（处理冲突）

### 1.4 扩展操作菜单

- [x] 1.4.1 修改 `src/views/MusicPlayer/hooks/useTopActions.ts`
- [x] 1.4.2 扩展 `actionOptions` 计算属性，添加导出/导入菜单项
- [x] 1.4.3 添加导出格式二级菜单（JSON/M3U8/PLS）
- [x] 1.4.4 实现 `handleExportAction(key)` 函数
- [x] 1.4.5 实现 `handleImportAction()` 函数

### 1.5 添加UI组件

- [x] 1.5.1 修改 `src/views/MusicPlayer/components/PlaylistPanel.vue`
- [x] 1.5.2 添加导出格式选择对话框（n-modal + n-radio-group）
- [x] 1.5.3 添加冲突处理对话框（n-data-table + 操作列）
- [x] 1.5.4 添加导入结果提示（n-dialog显示成功/失败统计）

### 1.6 实现冲突处理逻辑

- [x] 1.6.1 定义冲突数据结构（ConflictItem、ConflictResolution）
- [x] 1.6.2 实现重名检测（比对播放列表名称）
- [x] 1.6.3 实现重命名逻辑（生成"播放列表名 (2)"等）
- [x] 1.6.4 实现覆盖确认逻辑
- [x] 1.6.5 实现路径无效统计和提示

### 1.7 集成到主组件

- [x] 1.7.1 在 `MusicPlayer.vue` 中引入 `usePlaylistIO`
- [x] 1.7.2 传递必要的状态和方法到子组件
- [x] 1.7.3 测试完整流程（导出 → 导入 → 冲突处理）

## 2. 测试

### 2.1 单元测试

- [x] 2.1.1 测试 `exportToJson` 函数（生成正确的JSON格式）
- [x] 2.1.2 测试 `exportToM3U8` 函数（生成正确的M3U8格式）
- [x] 2.1.3 测试 `exportToPLS` 函数（生成正确的PLS格式）
- [x] 2.1.4 测试 `importFromJson` 函数（正确解析JSON）
- [x] 2.1.5 测试 `importFromM3U8` 函数（正确解析M3U8）
- [x] 2.1.6 测试 `importFromPLS` 函数（正确解析PLS）
- [x] 2.1.7 测试 `validatePaths` 函数（正确识别有效/无效路径）
- [x] 2.1.8 测试 `detectConflicts` 函数（正确检测所有冲突类型）
- [x] 2.1.9 测试 `resolveConflicts` 函数（正确应用冲突处理策略）

### 2.2 集成测试

- [x] 2.2.1 测试导出当前播放列表（JSON格式）
- [x] 2.2.2 测试导出当前播放列表（M3U8格式）
- [x] 2.2.3 测试导出当前播放列表（PLS格式）
- [x] 2.2.4 测试导入播放列表（JSON格式）
- [x] 2.2.5 测试导入播放列表（M3U8格式）
- [x] 2.2.6 测试导入播放列表（PLS格式）
- [x] 2.2.7 测试重名冲突处理（重命名选项）
- [x] 2.2.8 测试重名冲突处理（跳过选项）
- [x] 2.2.9 测试重名冲突处理（覆盖选项）
- [x] 2.2.10 测试路径无效提示和统计
- [x] 2.2.11 测试批量应用冲突处理策略

### 2.3 性能测试

- [x] 2.3.1 测试导出1000首歌曲的性能
- [x] 2.3.2 测试导入1000首歌曲的性能
- [x] 2.3.3 测试路径验证1000条记录的性能

### 2.4 兼容性测试

- [x] 2.4.1 测试导出的M3U8在VLC中能否正常播放
- [x] 2.4.2 测试导出的M3U8在Winamp中能否正常播放
- [x] 2.4.3 测试导出的PLS在Foobar2000中能否正常播放

### 2.5 错误处理测试

- [x] 2.5.1 测试导入损坏的JSON文件
- [x] 2.5.2 测试导入格式错误的M3U8文件
- [x] 2.5.3 测试导入格式错误的PLS文件
- [x] 2.5.4 测试导出时磁盘空间不足
- [x] 2.5.5 测试导出时权限不足
- [x] 2.5.6 测试导入时不支持的格式

## 3. 文档

- [x] 3.1 更新 `AGENTS.md`（如需补充相关说明）
- [x] 3.2 添加代码注释（导出导入相关函数）
