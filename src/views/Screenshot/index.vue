<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { useMessage } from 'naive-ui'

const screenshotMode = ref<'fullscreen' | 'region' | 'window'>('fullscreen')
const message = useMessage()

const handleCapture = async () => {
  try {
    if (screenshotMode.value === 'fullscreen') {
      const data = await invoke<number[]>('capture_screen')
      await invoke('create_preview_window', { imageData: Array.from(data) })
    } else if (screenshotMode.value === 'region') {
      await invoke('create_capture_window')
    } else if (screenshotMode.value === 'window') {
      const data = await invoke<number[]>('capture_screen')
      await invoke('create_preview_window', { imageData: Array.from(data) })
    }
  } catch (e) {
    message.error(`截图失败: ${e}`)
  }
}
</script>

<template>
  <div class="screenshot-page">
    <n-card title="截图工具">
      <n-space vertical>
        <n-radio-group data-testid="screenshot-mode-group" v-model:value="screenshotMode">
          <n-radio-button data-testid="mode-fullscreen" value="fullscreen">全屏截图</n-radio-button>
          <n-radio-button data-testid="mode-region" value="region">区域截图</n-radio-button>
          <n-radio-button data-testid="mode-window" value="window">窗口截图</n-radio-button>
        </n-radio-group>

        <n-button data-testid="btn-capture" type="primary" @click="handleCapture"> 开始截图 </n-button>

        <n-divider />

        <n-space>
          <n-button data-testid="btn-open-editor" @click="$router.push('/screenshot/editor')"> 打开编辑器 </n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.screenshot-page {
  padding: 20px;
}
</style>
