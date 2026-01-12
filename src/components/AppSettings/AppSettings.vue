<script lang="ts" setup>
import { isDevelopment } from '@/utils/development'
import { useAppAutostart, useGenerateTrayIcon } from './logic'
import { useAppSettingsStore } from '@/stores/appSettings'
import { useLyricsCache } from '@/views/MusicPlayer/hooks/useLyricsCache'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'

defineProps<{ open: boolean }>()

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

onMounted(async () => {
  if (isDevelopment) {
    appSettingsStore.autostart = false
    appSettingsStore.enableTrayIcon = false
  }

  cacheSizeMB.value = Math.round(lyricsCacheSize.value / (1024 * 1024))
  customCachePath.value = await getCachePath()
})

const { toggleTrayIcon } = useGenerateTrayIcon(enableTrayIcon)

const { toggleAutostart } = useAppAutostart(autostart, () => {
  appSettingsStore.enableTrayIcon = true
})

async function handleCacheSizeChange(value: number) {
  await setCacheSizeLimit(value)
  message.success('缓存大小已更新')
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
  const command = new Command('explorer', [path])
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
          <n-slider
            v-model:value="cacheSizeMB"
            :min="10"
            :max="500"
            :step="10"
            style="width: 200px"
            @update:value="handleCacheSizeChange" />
          <span class="text-[--textColor2] w-[50px]">{{ cacheSizeMB }} MB</span>
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
  </div>
</template>
