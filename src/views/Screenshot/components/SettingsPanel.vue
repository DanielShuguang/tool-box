<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/appSettings'

const appSettings = useAppSettingsStore()
const { screenshot } = storeToRefs(appSettings)

const handleResetShortcuts = () => {
  screenshot.value.shortcuts = {
    captureFullScreen: 'Ctrl+Shift+S',
    captureRegion: 'Ctrl+Shift+A',
    captureWindow: 'Ctrl+Shift+W'
  }
}
</script>

<template>
  <div class="settings-panel">
    <n-card title="截图设置">
      <n-space vertical>
        <n-card title="快捷键设置" size="small">
          <n-space vertical>
            <n-form-item label="全屏截图">
              <n-input v-model:value="screenshot.shortcuts.captureFullScreen" />
            </n-form-item>
            <n-form-item label="区域截图">
              <n-input v-model:value="screenshot.shortcuts.captureRegion" />
            </n-form-item>
            <n-form-item label="窗口截图">
              <n-input v-model:value="screenshot.shortcuts.captureWindow" />
            </n-form-item>
            <n-button @click="handleResetShortcuts">重置为默认</n-button>
          </n-space>
        </n-card>

        <n-card title="保存设置" size="small">
          <n-space vertical>
            <n-form-item label="默认格式">
              <n-radio-group v-model:value="screenshot.save.defaultFormat">
                <n-radio-button value="png">PNG</n-radio-button>
                <n-radio-button value="jpg">JPG</n-radio-button>
              </n-radio-group>
            </n-form-item>
            <n-form-item label="自动复制到剪贴板">
              <n-switch v-model:value="screenshot.save.autoCopyToClipboard" />
            </n-form-item>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.settings-panel {
  padding: 16px;
}
</style>
