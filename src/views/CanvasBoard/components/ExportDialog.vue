<script lang="ts" setup>
import { DownloadOutline } from '@vicons/ionicons5'
import type { ExportFormat } from '../types'

interface Props {
  show: boolean
  format: ExportFormat
  loading: boolean
  exportFormats: readonly { label: string; value: ExportFormat }[]
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:format', value: ExportFormat): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()
defineProps<Props>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <n-modal
    :show="show"
    title="导出画布"
    preset="dialog"
    :show-icon="false"
    style="width: 400px"
    :mask-closable="!loading"
    @update:show="(v: boolean) => emit('update:show', v)">
    <div class="export-dialog-content py-4">
      <div class="mb-4">
        <div class="text-sm mb-2 font-medium">选择导出格式：</div>
        <n-radio-group
          :value="format"
          class="w-full"
          @update:value="(v: ExportFormat) => emit('update:format', v)">
          <n-space vertical>
            <n-radio v-for="fmt in exportFormats" :key="fmt.value" :value="fmt.value">
              {{ fmt.label }} 格式
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <div class="text-xs text-[--text-color-secondary] bg-[--bodyColor] p-3 rounded">
        <div class="flex items-center gap-2 mb-1">
          <n-icon :component="DownloadOutline" />
          <span>点击确认后将弹出目录选择对话框</span>
        </div>
        <div class="text-[--text-color-tertiary]">导出文件将以 canvas_export_时间戳.格式 命名</div>
      </div>
    </div>

    <template #action>
      <n-button :disabled="loading" @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="loading" :disabled="loading" @click="handleConfirm">
        <template #icon>
          <n-icon :component="DownloadOutline" />
        </template>
        确认导出
      </n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.export-dialog-content {
  min-height: 150px;
}
</style>
