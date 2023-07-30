<script setup lang="ts">
import { zhCN } from 'naive-ui'
</script>

<template>
  <NConfigProvider class="container" :locale="zhCN">
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
#app,
.container {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}
</style>
