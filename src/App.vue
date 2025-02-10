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
    class="w-[100vw] h-[100vh] m-0 p-0"
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

<style lang="scss">
body,
html,
#app {
  margin: 0;
  padding: 0;
}
</style>
