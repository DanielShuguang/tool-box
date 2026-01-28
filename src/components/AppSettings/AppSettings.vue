<script lang="ts" setup>
import { isDevelopment } from '@/utils/development'
import { useAppAutostart, useGenerateTrayIcon } from './logic'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useLyricsCache } from '@/views/MusicPlayer/hooks/useLyricsCache'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'
import { downloadDir } from '@tauri-apps/api/path'
import { load, save, ConfigFile } from '@/utils/storage'

const props = defineProps<{ open: boolean }>()

const appSettingsStore = useAppSettingsStore()
const message = useMessage()
const dialog = useDialog()

const { autostart, enableTrayIcon } = storeToRefs(appSettingsStore)

const {
  cacheInfo,
  lyricsCacheSize,
  getCachePath,
  updateCachePath,
  clearAll,
  refreshCacheInfo,
  setCacheSizeLimit,
  formatCacheSize
} = useLyricsCache()

const cacheSizeMB = ref(100)
const customCachePath = ref('')
const isRefreshing = ref(false)

// 下载设置
const downloadDefaultDir = ref('')
// 默认限速输入，单位 MB/s
const downloadDefaultSpeedLimitMB = ref<string>('')
const downloadMaxConcurrent = ref(3)
const downloadOpenAfterComplete = ref(false)

onMounted(async () => {
  if (isDevelopment) {
    appSettingsStore.autostart = false
    appSettingsStore.enableTrayIcon = false
  }

  // 加载下载设置
  await loadDownloadSettings()
})

watch(
  () => props.open,
  async isOpen => {
    if (isOpen) {
      await handleRefreshCacheInfo()
      cacheSizeMB.value = Math.round(lyricsCacheSize.value / (1024 * 1024))
      customCachePath.value = await getCachePath()
    }
  }
)

const { toggleTrayIcon } = useGenerateTrayIcon(enableTrayIcon)

const { toggleAutostart } = useAppAutostart(autostart, () => {
  appSettingsStore.enableTrayIcon = true
})

async function handleCacheSizeChange(value: number | null) {
  if (value === null) return
  await setCacheSizeLimit(value)
}

async function handleClearCache() {
  dialog.warning({
    title: '确认清除',
    content: '确定要清除所有歌词缓存吗？此操作不可恢复。',
    positiveText: '清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      isRefreshing.value = true
      try {
        const count = await clearAll()
        message.success(`已清除 ${count} 个缓存文件`)
      } catch (error) {
        message.error('清除缓存失败')
      } finally {
        isRefreshing.value = false
      }
    }
  })
}

async function handleOpenCacheFolder() {
  const path = await getCachePath()
  // 使用 Command 执行系统命令打开文件夹
  const command = Command.create('explorer', [path])
  await command.execute()
}

async function handleSelectCachePath() {
  try {
    const selected = await openFileDialog({
      title: '选择歌词缓存目录',
      directory: true,
      multiple: false
    })

    if (selected && typeof selected === 'string') {
      const success = await updateCachePath(selected)
      if (success) {
        customCachePath.value = selected
        message.success('缓存路径已更新')
      } else {
        message.error('设置缓存路径失败')
      }
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  }
}

async function handleRefreshCacheInfo() {
  isRefreshing.value = true
  try {
    await refreshCacheInfo()
  } finally {
    isRefreshing.value = false
  }
}

// 下载设置相关函数
async function loadDownloadSettings() {
  try {
    const settings = await load<{
      defaultDir: string
      defaultSpeedLimit: number | null
      maxConcurrent: number
      openAfterComplete: boolean
    }>(
      'download_settings',
      {
        defaultDir: '',
        defaultSpeedLimit: null,
        maxConcurrent: 3,
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

    <h2 class="text-[16px] font-medium mb-4">歌词设置</h2>

    <n-form label-placement="left" label-width="100">
      <n-form-item label="缓存大小">
        <div class="flex items-center gap-3">
          <n-input-number
            v-model:value="cacheSizeMB"
            :min="10"
            :max="500"
            :step="1"
            style="width: 200px"
            @update:value="handleCacheSizeChange" />
          <span class="text-[--textColor2]">MB</span>
        </div>
      </n-form-item>

      <n-form-item label="缓存路径">
        <div class="flex items-center gap-2 w-full">
          <n-input
            v-model:value="customCachePath"
            readonly
            placeholder="歌词缓存路径"
            class="flex-1" />
          <n-button @click="handleSelectCachePath">选择</n-button>
          <n-button @click="handleOpenCacheFolder">打开文件夹</n-button>
        </div>
      </n-form-item>

      <n-form-item label="缓存状态">
        <div class="flex items-center gap-4 w-full">
          <n-button size="small" :loading="isRefreshing" @click="handleRefreshCacheInfo">
            刷新
          </n-button>
          <span class="text-[--textColor2]">
            {{ cacheInfo.fileCount }} 个文件，
            {{ formatCacheSize(cacheInfo.totalSize) }}
          </span>
          <n-button
            size="small"
            type="warning"
            :disabled="cacheInfo.fileCount === 0"
            @click="handleClearCache">
            清除全部
          </n-button>
        </div>
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

      <n-form-item label="下载完成后打开">
        <n-switch
          :value="downloadOpenAfterComplete"
          @update:value="handleOpenAfterCompleteChange" />
        <span class="ml-[15px] text-[--textColor2]">下载完成后自动打开文件</span>
      </n-form-item>
    </n-form>
  </div>
</template>
