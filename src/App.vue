<script setup lang="ts">
import { zhCN, darkTheme } from 'naive-ui'
import { useEmitter } from './utils/event'

const isDark = ref(false)

useEmitter('theme-change', val => {
  isDark.value = val
})
</script>

<template>
  <n-config-provider
    class="w-full h-full m-0 p-0"
    :locale="zhCN"
    :theme="isDark ? darkTheme : null"
  >
    <n-global-style />
    <n-message-provider>
      <n-dialog-provider>
        <Layout />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
