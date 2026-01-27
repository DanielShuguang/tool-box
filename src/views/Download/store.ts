import { defineStore } from 'pinia'
import { createStorageAdapter } from '@/utils/sql'
import { load, save, ConfigFile } from '@/utils/storage'
import type {
  DownloadTask,
  DownloadStatus,
  DownloadSettings,
  CreateDownloadInput,
  DownloadProgress
} from '@/types/download'
import { Command } from '@tauri-apps/plugin-shell'

/** 下载任务数据库记录 */
interface DownloadTaskRecord {
  id: string
  url: string
  fileName: string
  saveDir: string
  savePath: string
  status: string
  downloadedBytes: number
  totalBytes: number
  speed: number
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  errorMessage: string | null
  speedLimit: number | null
  retryCount: number
  responseCode: number | null
  etag: string | null
  lastModified: string | null
}

/** 默认下载设置 */
const defaultDownloadSettings: DownloadSettings = {
  defaultDir: '',
  maxConcurrent: 3,
  defaultSpeedLimit: null,
  openAfterComplete: false,
  clipboardMonitor: false
}

// 创建存储适配器
const storage = createStorageAdapter('download_tasks')

function formatProgress(task: DownloadTaskRecord): DownloadProgress {
  const percentage =
    task.totalBytes > 0 ? Math.round((task.downloadedBytes / task.totalBytes) * 10000) / 100 : 0
  const speed = task.speed || 0
  const eta =
    speed > 0 && task.downloadedBytes < task.totalBytes
      ? Math.ceil((task.totalBytes - task.downloadedBytes) / speed)
      : 0

  return {
    downloadedBytes: task.downloadedBytes,
    totalBytes: task.totalBytes,
    speed,
    percentage,
    eta
  }
}

function formatTask(record: DownloadTaskRecord): DownloadTask {
  return {
    id: record.id,
    url: record.url,
    fileName: record.fileName,
    saveDir: record.saveDir,
    savePath: record.savePath,
    status: record.status as DownloadStatus,
    progress: formatProgress(record),
    downloadedBytes: record.downloadedBytes,
    totalBytes: record.totalBytes,
    createdAt: record.createdAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    errorMessage: record.errorMessage,
    speedLimit: record.speedLimit,
    retryCount: record.retryCount,
    responseCode: record.responseCode,
    etag: record.etag,
    lastModified: record.lastModified
  }
}

export const useDownloadStore = defineStore('download', () => {
  // 设置
  const settings = ref<DownloadSettings>({ ...defaultDownloadSettings })
  const isSettingsLoaded = ref(false)

  // 所有任务
  const allTasks = ref<DownloadTask[]>([])

  // 初始化存储
  async function initStorage() {
    await storage.init()
  }

  // 加载设置
  async function loadSettings() {
    try {
      const saved = await load<Partial<DownloadSettings>>(
        'download_settings',
        {},
        ConfigFile.Settings
      )
      if (saved) {
        settings.value = { ...defaultDownloadSettings, ...saved }
      }
    } catch (error) {
      console.error('加载下载设置失败:', error)
    } finally {
      isSettingsLoaded.value = true
    }
  }

  // 保存设置
  async function saveSettings() {
    try {
      await save('download_settings', settings.value, ConfigFile.Settings)
    } catch (error) {
      console.error('保存下载设置失败:', error)
    }
  }

  // 获取默认下载目录
  async function getDefaultDir(): Promise<string> {
    if (!settings.value.defaultDir) {
      const { downloadDir } = await import('@tauri-apps/api/path')
      settings.value.defaultDir = await downloadDir()
      await saveSettings()
    }
    return settings.value.defaultDir
  }

  // 选择下载目录
  async function selectDownloadDir(): Promise<string | null> {
    const { open } = await import('@tauri-apps/plugin-dialog')
    try {
      const selected = await open({
        title: '选择下载目录',
        directory: true,
        multiple: false
      })
      if (selected && typeof selected === 'string') {
        return selected
      }
    } catch (error) {
      console.error('选择目录失败:', error)
    }
    return null
  }

  // 加载任务索引
  async function loadTasksIndex(): Promise<string[]> {
    try {
      const index = await storage.load<{ ids: string[] }>('download_tasks_index', { ids: [] })
      return index.ids
    } catch (error) {
      console.error('加载任务索引失败:', error)
      return []
    }
  }

  // 加载所有任务
  async function loadAllTasks() {
    const taskIds = await loadTasksIndex()

    const taskPromises = taskIds.map(id =>
      storage.load<DownloadTaskRecord | null>(`download_task_${id}`, null)
    )
    const results = await Promise.all(taskPromises)

    allTasks.value = results
      .filter((r): r is DownloadTaskRecord => r != null)
      .map(formatTask)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  // 获取正在下载的任务
  const downloadingTasks = computed(() =>
    allTasks.value.filter(t => ['pending', 'downloading', 'paused'].includes(t.status))
  )

  // 获取已完成的任务
  const completedTasks = computed(() =>
    allTasks.value.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
  )

  // 根据ID获取任务
  function getTaskById(id: string): DownloadTask | undefined {
    return allTasks.value.find(t => t.id === id)
  }

  // 创建下载任务
  async function createTask(input: CreateDownloadInput): Promise<DownloadTask> {
    const saveDir = input.saveDir || (await getDefaultDir())
    const id = crypto.randomUUID()
    const now = Date.now()

    const record: DownloadTaskRecord = {
      id,
      url: input.url,
      fileName: input.fileName || '',
      saveDir,
      savePath: '',
      status: 'pending',
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      speedLimit: input.speedLimit ?? settings.value.defaultSpeedLimit,
      retryCount: 0,
      responseCode: null,
      etag: null,
      lastModified: null
    }

    // 保存任务
    await storage.save(`download_task_${id}`, record)

    // 更新索引
    const index = await storage.load<{ ids: string[] }>('download_tasks_index', { ids: [] })
    index.ids.unshift(id)
    await storage.save('download_tasks_index', index)

    // 重新加载任务列表
    await loadAllTasks()

    return formatTask(record)
  }

  // 从剪贴板创建任务
  async function createFromClipboard() {
    // TODO: 实现剪贴板功能
  }

  // 开始下载任务
  async function startTask(id: string) {
    const task = getTaskById(id)
    if (!task) return

    await updateTask(id, {
      status: 'downloading',
      startedAt: task.startedAt || Date.now(),
      errorMessage: null
    })

    // 调用后端开始下载
    try {
      const { downloadFileWithConfig } = await import('@/backend-channel/download')
      await downloadFileWithConfig({
        url: task.url,
        dirPath: task.saveDir,
        pluginName: 'download',
        concurrent: 3,
        fileName: task.fileName || undefined,
        speedLimitMbps: task.speedLimit ? task.speedLimit / (1024 * 1024) : undefined
      })
    } catch (error) {
      console.error('启动下载失败:', error)
      await updateTask(id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '启动下载失败'
      })
    }
  }

  // 更新任务
  async function updateTask(id: string, updates: Partial<DownloadTaskRecord>) {
    const task = getTaskById(id)
    if (!task) return

    await storage.save(`download_task_${id}`, { ...task, ...updates } as DownloadTaskRecord)
    await loadAllTasks()
  }

  // 暂停下载任务
  async function pauseTask(id: string) {
    const task = getTaskById(id)
    if (!task || task.status !== 'downloading') return

    await updateTask(id, { status: 'paused' })

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('pause_download', { id })
    } catch (error) {
      console.error('暂停下载失败:', error)
    }
  }

  // 恢复下载任务
  async function resumeTask(id: string) {
    const task = getTaskById(id)
    if (!task || task.status !== 'paused') return

    await updateTask(id, { status: 'downloading' })
    await startTask(id)
  }

  // 取消下载任务
  async function cancelTask(id: string) {
    const task = getTaskById(id)
    if (!task) return

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('cancel_download', { id })
    } catch (error) {
      console.error('取消下载失败:', error)
    }

    await updateTask(id, {
      status: 'cancelled',
      completedAt: Date.now()
    })
  }

  // 删除下载任务
  async function deleteTask(id: string) {
    const task = getTaskById(id)
    if (!task) return

    await removeTaskFromStorage(id)
  }

  // 从存储中删除任务
  async function removeTaskFromStorage(id: string) {
    await storage.remove(`download_task_${id}`)

    const index = await storage.load<{ ids: string[] }>('download_tasks_index', { ids: [] })
    const idx = index.ids.indexOf(id)
    if (idx !== -1) {
      index.ids.splice(idx, 1)
      await storage.save('download_tasks_index', index)
    }

    await loadAllTasks()
  }

  // 清除已完成的任务
  async function clearCompleted() {
    const completedIds = completedTasks.value.map(t => t.id)
    if (completedIds.length === 0) return

    for (const id of completedIds) {
      await storage.remove(`download_task_${id}`)
    }

    const index = await storage.load<{ ids: string[] }>('download_tasks_index', { ids: [] })
    index.ids = index.ids.filter(taskId => !completedIds.includes(taskId))
    await storage.save('download_tasks_index', index)

    await loadAllTasks()
  }

  // 设置限速
  async function setSpeedLimit(id: string, limit: number | null) {
    await updateTask(id, { speedLimit: limit })

    const task = getTaskById(id)
    if (task?.status === 'downloading') {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('set_download_speed_limit', { id, limit })
      } catch (error) {
        console.error('设置限速失败:', error)
      }
    }
  }

  // 打开下载文件
  async function openFile(id: string) {
    const task = getTaskById(id)
    if (!task || task.status !== 'completed') return

    try {
      const command = Command.create('explorer', [task.savePath])
      await command.execute()
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  // 打开文件所在目录
  async function openFileDirectory(id: string) {
    const task = getTaskById(id)
    if (!task) return

    try {
      const command = Command.create('explorer', [task.saveDir])
      await command.execute()
    } catch (error) {
      console.error('打开目录失败:', error)
    }
  }

  // 重试下载任务
  async function retryTask(id: string) {
    const task = getTaskById(id)
    if (!task) return

    await updateTask(id, {
      status: 'pending',
      downloadedBytes: 0,
      retryCount: task.retryCount + 1,
      errorMessage: null,
      startedAt: null,
      completedAt: null
    })

    await startTask(id)
  }

  return {
    // 设置
    settings,
    isSettingsLoaded,
    initStorage,
    loadSettings,
    saveSettings,
    getDefaultDir,
    selectDownloadDir,

    // 任务
    allTasks,
    downloadingTasks,
    completedTasks,
    getTaskById,
    createTask,
    createFromClipboard,
    startTask,
    pauseTask,
    resumeTask,
    cancelTask,
    deleteTask,
    clearCompleted,
    setSpeedLimit,
    openFile,
    openFileDirectory,
    retryTask,
    loadAllTasks
  }
})
