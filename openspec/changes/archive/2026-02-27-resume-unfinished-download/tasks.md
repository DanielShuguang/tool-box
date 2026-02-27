## 1. 后端实现

- [x] 1.1 在 `src-tauri/src/download/` 中新增进度文件读写模块 `progress.rs`
- [x] 1.2 实现 `scan_unfinished_downloads` Tauri 命令，扫描指定目录查找 `.download` 文件
- [x] 1.3 实现 `read_download_progress` 函数，读取并解析 `.download.json` 进度文件
- [x] 1.4 实现 `resume_download` Tauri 命令，恢复断点续传下载
- [x] 1.5 在 `src-tauri/src/lib.rs` 中注册新命令

## 2. 前端类型定义

- [x] 2.1 在 `src/views/Download/types.ts` 中新增 `ResumeDownloadInfo` 类型
- [x] 2.2 在 `src/views/Download/types.ts` 中新增 `DownloadProgressFile` 类型

## 3. 前端 API 封装

- [x] 3.1 在 `src/backend-channel/` 中创建 `resume-download.ts` 文件
- [x] 3.2 实现 `scanUnfinishedDownloads` 函数调用后端命令
- [x] 3.3 实现 `resumeDownload` 函数调用后端命令

## 4. 前端 Hook 实现

- [x] 4.1 创建 `src/views/Download/hooks/useResumeDownload.ts` Hook
- [x] 4.2 实现 `scanFiles` 方法，打开文件选择器并解析进度文件
- [x] 4.3 实现 `resumeTasks` 方法，恢复选中的下载任务
- [x] 4.4 实现服务器不支持 Range 时的用户确认对话框逻辑

## 5. 前端 UI 组件

- [x] 5.1 创建 `src/views/Download/components/ScanResumeDialog.vue` 组件
- [x] 5.2 实现文件选择器功能
- [x] 5.3 实现任务列表展示
- [x] 5.4 实现批量选择和恢复功能

## 6. 集成到下载页面

- [x] 6.1 修改 `src/views/Download/Download.vue`，添加"恢复下载"按钮
- [x] 6.2 集成 `useResumeDownload` Hook
- [x] 6.3 处理对话框的打开/关闭逻辑

## 7. 修改现有下载逻辑

- [x] 7.1 修改下载核心逻辑，使用新的 `.download` 格式
- [x] 7.2 在下载过程中定期更新进度文件
- [x] 7.3 下载完成时处理临时文件和进度文件的清理
- [x] 7.4 新增 `resumeTask` 方法到 store 中

## 8. 测试与验证

- [x] 8.1 测试文件选择器功能
- [x] 8.2 测试进度文件解析
- [x] 8.3 测试断点续传功能
- [x] 8.4 测试错误处理（服务器不支持 Range、文件损坏等）
- [x] 8.5 运行代码检查（lint、typecheck）
