<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { zhCN, darkTheme, dateZhCN } from 'naive-ui'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { isDevelopment } from './utils/development'
import { useAppSettingsStore } from './stores/appSettings'

const appSettingsStore = useAppSettingsStore()
const { isDark } = storeToRefs(appSettingsStore)

// 判断是否为主窗口: 非主窗口不渲染 Layout（侧边栏/标题栏）
const currentWindow = getCurrentWindow()
const isMainWindow = currentWindow.label === 'main'

// 禁用 F5 和 Ctrl + R
if (!isDevelopment) {
  useEventListener('keydown', event => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
      event.preventDefault()
    }
  })
}
</script>

<template>
  <n-config-provider
    class="w-full h-full m-0 p-0"
    :locale="zhCN"
    :theme="isDark ? darkTheme : null"
    :date-locale="dateZhCN">
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <Layout v-if="isMainWindow" />
        <router-view v-else class="w-full h-full" />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
