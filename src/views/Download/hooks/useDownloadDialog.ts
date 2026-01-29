import type { CreateDownloadInput } from '../types'
import { useDownloadStore } from '@/stores/download'

export function useDownloadDialog() {
  const downloadStore = useDownloadStore()

  const showNewDownloadDialog = ref(false)
  const newDownloadUrl = ref('')
  const newDownloadDir = ref('')
  const newDownloadFileName = ref('')

  async function openNewDownloadDialog() {
    newDownloadUrl.value = ''
    newDownloadFileName.value = ''

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
      fileName: newDownloadFileName.value.trim() || undefined
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
    openNewDownloadDialog,
    handleCreateDownload,
    handleSelectDir
  }
}
