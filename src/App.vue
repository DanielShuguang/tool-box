<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { zhCN, darkTheme, dateZhCN } from 'naive-ui'
import { isDevelopment } from './utils/development'
import { useAppSettingsStore } from './stores/appSettings'

const appSettingsStore = useAppSettingsStore()
const { isDark } = storeToRefs(appSettingsStore)

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
        <Layout />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
