import type { CreateDownloadInput } from '@/types/download'
import { useDownloadStore } from './store'

export function useDownloadDialog() {
  const downloadStore = useDownloadStore()

  const showNewDownloadDialog = ref(false)
  const newDownloadUrl = ref('')
  const newDownloadDir = ref('')
  const newDownloadFileName = ref('')
  const newDownloadSpeedLimit = ref<number | null>(null)

  async function openNewDownloadDialog() {
    newDownloadUrl.value = ''
    newDownloadFileName.value = ''
    newDownloadSpeedLimit.value = downloadStore.settings.defaultSpeedLimit

    // 设置默认目录
    newDownloadDir.value = await downloadStore.getDefaultDir()

    showNewDownloadDialog.value = true
  }

  async function handleCreateDownload() {
    if (!newDownloadUrl.value.trim()) {
      return
    }

    try {
      new URL(newDownloadUrl.value)
    } catch {
      return
    }

    const input: CreateDownloadInput = {
      url: newDownloadUrl.value.trim(),
      saveDir: newDownloadDir.value || undefined,
      fileName: newDownloadFileName.value.trim() || undefined,
      speedLimit: newDownloadSpeedLimit.value
    }

    await downloadStore.createTask(input)

    showNewDownloadDialog.value = false
  }

  async function handleSelectDir() {
    const selected = await downloadStore.selectDownloadDir()
    if (selected) {
      newDownloadDir.value = selected
    }
  }

  return {
    showNewDownloadDialog,
    newDownloadUrl,
    newDownloadDir,
    newDownloadFileName,
    newDownloadSpeedLimit,
    openNewDownloadDialog,
    handleCreateDownload,
    handleSelectDir
  }
}
