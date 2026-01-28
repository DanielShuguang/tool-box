import { ConfigFile } from '@/utils/storage'
import type {
  DownloadTask,
  DownloadStatus,
  DownloadSettings,
  CreateDownloadInput,
  DownloadProgress,
  DownloadTaskRecord
} from 'src/views/Download/types'
import { Command } from '@tauri-apps/plugin-shell'

/** 默认下载设置 */
const defaultDownloadSettings: DownloadSettings = {
  defaultDir: '',
  maxConcurrent: 3,
  defaultSpeedLimit: null,
  openAfterComplete: false,
  clipboardMonitor: false
}

function formatProgress(task: DownloadTaskRecord): DownloadProgress {
  const percentage =
    task.totalBytes > 0 ? Math.round((task.downloadedBytes / task.totalBytes) * 10000) / 100 : 0
  const speed = task.progress?.speed ?? 0
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

export const useDownloadStore = defineStore(
  'download',
  () => {
    // 设置
    const settings = ref<DownloadSettings>({ ...defaultDownloadSettings })
    const isSettingsLoaded = ref(false)

    // 所有任务
    const tasks = ref<DownloadTask[]>([])

    // 加载设置
    async function loadSettings() {
      try {
        // 延迟初始化，确保 store 持久化已完成
        await new Promise(resolve => setTimeout(resolve, 100))
        // 从持久化数据中恢复设置
        const saved = localStorage.getItem('download_settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          settings.value = { ...defaultDownloadSettings, ...parsed }
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
        localStorage.setItem('download_settings', JSON.stringify(settings.value))
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

    // 获取正在下载的任务
    const downloadingTasks = computed(() =>
      tasks.value.filter(t => ['pending', 'downloading', 'paused'].includes(t.status))
    )

    // 获取已完成的任务
    const completedTasks = computed(() =>
      tasks.value.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
    )

    // 根据ID获取任务
    function getTaskById(id: string): DownloadTask | undefined {
      return tasks.value.find(t => t.id === id)
    }

    // 创建下载任务
    async function createTask(input: CreateDownloadInput): Promise<DownloadTask> {
      const saveDir = input.saveDir || (await getDefaultDir())
      const id = crypto.randomUUID()
      const now = Date.now()

      const task: DownloadTask = {
        id,
        url: input.url,
        fileName: input.fileName || '',
        saveDir,
        savePath: '',
        status: 'pending',
        progress: {
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          percentage: 0,
          eta: 0
        },
        downloadedBytes: 0,
        totalBytes: 0,
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

      tasks.value.unshift(task)
      saveTasksToStorage()

      return task
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
    async function updateTask(id: string, updates: Partial<DownloadTask> & { speed?: number }) {
      const index = tasks.value.findIndex(t => t.id === id)
      if (index === -1) return

      const task = tasks.value[index]
      const updatedTask = { ...task, ...updates }

      // 重新计算进度
      if (updates.downloadedBytes !== undefined || updates.totalBytes !== undefined) {
        const record: DownloadTaskRecord = {
          id: updatedTask.id,
          url: updatedTask.url,
          fileName: updatedTask.fileName,
          saveDir: updatedTask.saveDir,
          savePath: updatedTask.savePath,
          status: updatedTask.status,
          progress: {
            downloadedBytes: updatedTask.downloadedBytes,
            totalBytes: updatedTask.totalBytes,
            speed: updatedTask.progress.speed,
            percentage: 0,
            eta: 0
          },
          downloadedBytes: updatedTask.downloadedBytes,
          totalBytes: updatedTask.totalBytes,
          createdAt: updatedTask.createdAt,
          startedAt: updatedTask.startedAt,
          completedAt: updatedTask.completedAt,
          errorMessage: updatedTask.errorMessage,
          speedLimit: updatedTask.speedLimit,
          retryCount: updatedTask.retryCount,
          responseCode: updatedTask.responseCode,
          etag: updatedTask.etag,
          lastModified: updatedTask.lastModified
        }
        updatedTask.progress = formatProgress(record)
      }

      // 如果更新中包含 speed，则更新进度中的 speed
      if (updates.speed !== undefined) {
        updatedTask.progress.speed = updates.speed
      }

      tasks.value[index] = updatedTask
      saveTasksToStorage()
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
      const index = tasks.value.findIndex(t => t.id === id)
      if (index === -1) return

      tasks.value.splice(index, 1)
      saveTasksToStorage()
    }

    // 清除已完成的任务
    async function clearCompleted() {
      tasks.value = tasks.value.filter(
        t => !['completed', 'failed', 'cancelled'].includes(t.status)
      )
      saveTasksToStorage()
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

    // 从本地存储加载任务
    function loadTasksFromStorage() {
      try {
        const saved = localStorage.getItem('download_tasks')
        if (saved) {
          const records: DownloadTaskRecord[] = JSON.parse(saved)
          tasks.value = records.map(formatTask).sort((a, b) => b.createdAt - a.createdAt)
        }
      } catch (error) {
        console.error('加载下载任务失败:', error)
        tasks.value = []
      }
    }

    // 保存任务到本地存储
    function saveTasksToStorage() {
      try {
        const records = tasks.value.map(task => ({
          id: task.id,
          url: task.url,
          fileName: task.fileName,
          saveDir: task.saveDir,
          savePath: task.savePath,
          status: task.status,
          progress: {
            downloadedBytes: task.downloadedBytes,
            totalBytes: task.totalBytes,
            speed: task.progress.speed,
            percentage: task.progress.percentage,
            eta: task.progress.eta
          },
          downloadedBytes: task.downloadedBytes,
          totalBytes: task.totalBytes,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          errorMessage: task.errorMessage,
          speedLimit: task.speedLimit,
          retryCount: task.retryCount,
          responseCode: task.responseCode,
          etag: task.etag,
          lastModified: task.lastModified
        }))
        localStorage.setItem('download_tasks', JSON.stringify(records))
      } catch (error) {
        console.error('保存下载任务失败:', error)
      }
    }

    return {
      // 设置
      settings,
      isSettingsLoaded,
      loadSettings,
      saveSettings,
      getDefaultDir,
      selectDownloadDir,

      // 任务
      allTasks: tasks,
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
      loadTasksFromStorage
    }
  },
  {
    persist: {
      fileName: ConfigFile.Download,
      key: 'downloadMissions'
    }
  }
)
