<script setup lang="ts">
import { zhCN } from 'naive-ui'
</script>

<template>
  <NConfigProvider class="w-[100vw] h-[100vh] m-0 p-0" :locale="zhCN">
    <NMessageProvider>
      <NDialogProvider>
        <Layout />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style lang="scss">
body,
html,
#app {
  margin: 0;
  padding: 0;
}
</style>
