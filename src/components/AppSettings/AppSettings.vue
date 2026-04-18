<script lang="ts" setup>
import { isDevelopment } from '@/utils/development'
import { useAppAutostart, useGenerateTrayIcon } from './logic'
import { useAppSettingsStore } from '@/stores/appSettings'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'
import { downloadDir } from '@tauri-apps/api/path'
import { load, save, ConfigFile } from '@/utils/storage'

const props = defineProps<{ open: boolean }>()

const appSettingsStore = useAppSettingsStore()
const message = useMessage()

const { autostart, enableTrayIcon } = storeToRefs(appSettingsStore)

// 下载设置
const downloadDefaultDir = ref('')
// 默认限速输入，单位 MB/s
const downloadDefaultSpeedLimitMB = ref<string>('')
const downloadMaxConcurrent = ref(3)
const downloadThreads = ref(5)
const downloadOpenAfterComplete = ref(false)

onMounted(async () => {
  if (isDevelopment) {
    appSettingsStore.autostart = false
    appSettingsStore.enableTrayIcon = false
  }

  // 加载下载设置
  await loadDownloadSettings()
})

const { toggleTrayIcon } = useGenerateTrayIcon(enableTrayIcon)

const { toggleAutostart } = useAppAutostart(autostart, () => {
  appSettingsStore.enableTrayIcon = true
})

// 下载设置相关函数
async function loadDownloadSettings() {
  try {
    const settings = await load<{
      defaultDir: string
      defaultSpeedLimit: number | null
      maxConcurrent: number
      downloadThreads: number
      openAfterComplete: boolean
    }>(
      'download_settings',
      {
        defaultDir: '',
        defaultSpeedLimit: null,
        maxConcurrent: 3,
        downloadThreads: 5,
        openAfterComplete: false
      },
      ConfigFile.Settings
    )

    downloadDefaultDir.value = settings.defaultDir
    // 将字节转换为 MB/s
    downloadDefaultSpeedLimitMB.value = settings.defaultSpeedLimit
      ? (settings.defaultSpeedLimit / (1024 * 1024)).toFixed(2)
      : ''
    downloadMaxConcurrent.value = settings.maxConcurrent
    downloadThreads.value = settings.downloadThreads ?? 5
    downloadOpenAfterComplete.value = settings.openAfterComplete
  } catch (error) {
    console.error('加载下载设置失败:', error)
  }
}

async function handleSelectDownloadDir() {
  try {
    const selected = await openFileDialog({
      title: '选择默认下载目录',
      directory: true,
      multiple: false
    })

    if (selected && typeof selected === 'string') {
      downloadDefaultDir.value = selected
      await saveDownloadSettings()
      message.success('默认下载目录已更新')
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  }
}

async function handleOpenDownloadDir() {
  const dir = downloadDefaultDir.value || (await downloadDir())
  const command = Command.create('explorer', [dir])
  await command.execute()
}

async function handleSpeedLimitChange() {
  // 将 MB/s 转换为字节，0 或空值表示不限速
  const speedLimitBytes = (() => {
    const val = parseFloat(downloadDefaultSpeedLimitMB.value)
    if (!val || val <= 0) return null
    return Math.round(val * 1024 * 1024)
  })()
  await saveDownloadSettings(speedLimitBytes)
}

async function handleMaxConcurrentChange(value: number | null) {
  if (value !== null) {
    downloadMaxConcurrent.value = value
    await saveDownloadSettings()
  }
}

async function handleDownloadThreadsChange(value: number | null) {
  if (value !== null) {
    downloadThreads.value = value
    await saveDownloadSettings()
  }
}

async function handleOpenAfterCompleteChange(value: boolean) {
  downloadOpenAfterComplete.value = value
  await saveDownloadSettings()
}

async function saveDownloadSettings(speedLimit?: number | null) {
  try {
    await save(
      'download_settings',
      {
        defaultDir: downloadDefaultDir.value,
        defaultSpeedLimit: speedLimit ?? null,
        maxConcurrent: downloadMaxConcurrent.value,
        downloadThreads: downloadThreads.value,
        openAfterComplete: downloadOpenAfterComplete.value
      },
      ConfigFile.Settings
    )
  } catch (error) {
    console.error('保存下载设置失败:', error)
  }
}
</script>

<template>
  <div v-if="open">
    <h1>应用设置</h1>

    <n-form label-placement="left">
      <n-form-item label="开机启动">
        <n-switch :value="appSettingsStore.autostart" @update:value="toggleAutostart" />
        <span class="ml-[15px]">该功能暂时仅支持 Windows 系统</span>
      </n-form-item>
      <n-form-item label="托盘图标">
        <n-switch
          :disabled="appSettingsStore.autostart"
          :value="appSettingsStore.enableTrayIcon"
          @update:value="toggleTrayIcon" />
        <span class="ml-[15px]">开启后点击关闭不会彻底退出应用</span>
      </n-form-item>
    </n-form>

    <n-divider />

    <h2 class="text-[16px] font-medium mb-4">下载设置</h2>

    <n-form label-placement="left" label-width="120">
      <n-form-item label="默认下载目录">
        <div class="flex items-center gap-2 w-full">
          <n-input
            v-model:value="downloadDefaultDir"
            readonly
            placeholder="默认下载保存目录"
            class="flex-1" />
          <n-button @click="handleSelectDownloadDir">选择</n-button>
          <n-button @click="handleOpenDownloadDir">打开</n-button>
        </div>
      </n-form-item>

      <n-form-item label="默认限速">
        <div class="flex items-center gap-2">
          <n-input
            v-model:value="downloadDefaultSpeedLimitMB"
            placeholder="0 或留空表示不限速"
            style="width: 150px"
            @blur="handleSpeedLimitChange" />
          <span class="text-[--textColor2]">MB/s</span>
        </div>
      </n-form-item>

      <n-form-item label="最大并发数">
        <n-input-number
          v-model:value="downloadMaxConcurrent"
          :min="1"
          :max="10"
          :step="1"
          style="width: 150px"
          @update:value="handleMaxConcurrentChange" />
        <span class="ml-[10px] text-[--textColor2]">个任务同时下载</span>
      </n-form-item>

      <n-form-item label="分片下载线程">
        <n-input-number
          v-model:value="downloadThreads"
          :min="1"
          :max="16"
          :step="1"
          style="width: 150px"
          @update:value="handleDownloadThreadsChange" />
        <span class="ml-[10px] text-[--textColor2]">每个任务的下载线程数</span>
      </n-form-item>

      <n-form-item label="下载完成后打开">
        <n-switch
          :value="downloadOpenAfterComplete"
          @update:value="handleOpenAfterCompleteChange" />
        <span class="ml-[15px] text-[--textColor2]">下载完成后自动打开文件</span>
      </n-form-item>
    </n-form>
  </div>
</template>
