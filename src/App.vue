<script setup lang="ts">
import { zhCN } from 'naive-ui'
</script>

<template>
  <n-config-provider class="w-[100vw] h-[100vh] m-0 p-0" :locale="zhCN">
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
