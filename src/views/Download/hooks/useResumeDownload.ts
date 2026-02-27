import { ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { scanUnfinishedDownloads, checkServerRangeSupport } from '@/backend-channel/download'
import { useDownloadStore } from '@/stores/download'
import type { ResumeDownloadInfo, RangeSupportResult } from '../types'
import { BackendRespCode } from '@/types/common'

export interface ScannedTask extends ResumeDownloadInfo {
  rangeSupport?: RangeSupportResult
  rangeCheckError?: string
  selected: boolean
}

export function useResumeDownload() {
  const downloadStore = useDownloadStore()

  const showScanDialog = ref(false)
  const scannedTasks = ref<ScannedTask[]>([])
  const isScanning = ref(false)
  const isCheckingRange = ref(false)

  async function openScanDialog() {
    showScanDialog.value = true
    scannedTasks.value = []
  }

  function closeScanDialog() {
    showScanDialog.value = false
    scannedTasks.value = []
  }

  async function selectAndScanFiles() {
    try {
      const selected = await open({
        title: '选择未完成的下载文件',
        multiple: true,
        filters: [
          {
            name: '临时下载文件',
            extensions: ['download']
          }
        ]
      })

      if (!selected) return

      isScanning.value = true
      const paths = Array.isArray(selected) ? selected : [selected]

      const results: ScannedTask[] = []

      for (const filePath of paths) {
        const result = await scanUnfinishedDownloads(filePath)

        if (result.code === BackendRespCode.SUCCESS && result.data) {
          for (const info of result.data) {
            results.push({
              ...info,
              selected: true
            })
          }
        } else {
          console.warn(`扫描文件失败: ${filePath}, 原因: ${result.message}`)
        }
      }

      scannedTasks.value = results
    } catch (error) {
      console.error('选择文件失败:', error)
    } finally {
      isScanning.value = false
    }
  }

  async function checkRangeSupportForTask(task: ScannedTask) {
    try {
      isCheckingRange.value = true
      const result = await checkServerRangeSupport(task.url)

      if (result.code === BackendRespCode.SUCCESS && result.data) {
        task.rangeSupport = result.data
      } else {
        task.rangeCheckError = result.message || '无法检查服务器支持情况'
      }
    } catch (error) {
      task.rangeCheckError = error instanceof Error ? error.message : '网络错误'
    } finally {
      isCheckingRange.value = false
    }
  }

  async function checkAllRangeSupport() {
    for (const task of scannedTasks.value) {
      await checkRangeSupportForTask(task)
    }
  }

  function toggleTaskSelection(task: ScannedTask) {
    task.selected = !task.selected
  }

  function selectAllTasks(selected: boolean) {
    scannedTasks.value.forEach(task => {
      task.selected = selected
    })
  }

  async function resumeSelectedTasks() {
    const selectedTasks = scannedTasks.value.filter(t => t.selected)

    for (const task of selectedTasks) {
      if (task.rangeSupport && !task.rangeSupport.supportsRange) {
        continue
      }

      await downloadStore.createTask({
        url: task.url,
        saveDir: task.filePath.substring(
          0,
          task.filePath.lastIndexOf('\\') || task.filePath.lastIndexOf('/')
        ),
        fileName: task.fileName
      })
    }

    closeScanDialog()
  }

  async function restartFromBeginning(task: ScannedTask) {
    await downloadStore.createTask({
      url: task.url,
      saveDir: task.filePath.substring(
        0,
        task.filePath.lastIndexOf('\\') || task.filePath.lastIndexOf('/')
      ),
      fileName: task.fileName
    })
  }

  return {
    showScanDialog,
    scannedTasks,
    isScanning,
    isCheckingRange,
    openScanDialog,
    closeScanDialog,
    selectAndScanFiles,
    checkRangeSupportForTask,
    checkAllRangeSupport,
    toggleTaskSelection,
    selectAllTasks,
    resumeSelectedTasks,
    restartFromBeginning
  }
}
