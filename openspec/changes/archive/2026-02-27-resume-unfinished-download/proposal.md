## 为什么

用户在使用下载功能时，可能会因为网络中断、程序关闭等原因导致下载中断。目前系统缺少识别和恢复未完成下载的能力，用户需要手动重新下载整个文件，浪费时间和带宽。断点续传功能将允许用户选择本地未完成的下载文件，从中断处继续下载。

## 变更内容

1. **新增临时文件格式**
   - 下载进行时创建 `{文件名}.download` 临时文件
   - 同时创建 `{文件名}.download.json` 进度文件存储元信息（URL、已下载字节数、ETag、Last-Modified 等）

2. **新增文件扫描功能**
   - 提供文件选择器让用户选择 `.download` 临时文件
   - 自动解析关联的进度文件获取下载信息

3. **新增断点续传恢复功能**
   - 根据进度信息恢复下载
   - 使用 HTTP Range 请求从断点处继续下载
   - 严格检查服务器是否支持断点续传，不支持时给出明确提示

4. **新增 UI 对话框**
   - 扫描/选择未完成下载文件的对话框组件

## 功能 (Capabilities)

### 新增功能

- **resume-download**: 断点续传功能
  - 识别本地 `.download` 临时文件格式
  - 解析 `.download.json` 进度文件获取下载元信息
  - 与服务器建立 Range 请求连接
  - 处理服务器不支持断点续传的情况

### 修改功能

- (无)

## 影响

- **前端 (Vue/TypeScript)**
  - 新增 `src/views/Download/components/ScanResumeDialog.vue` - 扫描恢复下载对话框
  - 新增 `src/views/Download/hooks/useResumeDownload.ts` - 断点续传逻辑 Hook
  - 修改 `src/views/Download/Download.vue` - 添加"恢复下载"按钮入口
  - 修改 `src/stores/download.ts` - 添加恢复下载任务方法

- **后端 (Rust/Tauri)**
  - 新增 `scan_unfinished_downloads` 命令 - 扫描目录查找未完成下载
  - 新增 `resume_download` 命令 - 根据临时文件信息恢复下载

- **存储**
  - 使用本地文件系统存储临时文件和进度文件
  - 无需新增数据库依赖
