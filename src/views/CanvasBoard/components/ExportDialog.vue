<script lang="ts" setup>
import { DownloadOutline, SaveOutline } from '@vicons/ionicons5'
import type { ExportFormat, ExportMode } from '../types'

interface Props {
  show: boolean
  format: ExportFormat
  mode: ExportMode
  loading: boolean
  exportFormats: readonly { label: string; value: ExportFormat }[]
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:format', value: ExportFormat): void
  (e: 'update:mode', value: ExportMode): void
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
    style="width: 450px"
    :mask-closable="!loading"
    @update:show="(v: boolean) => emit('update:show', v)">
    <div class="export-dialog-content py-4">
      <div class="mb-4">
        <div class="text-sm mb-2 font-medium">导出类型：</div>
        <n-radio-group
          :value="mode"
          class="w-full"
          @update:value="(v: ExportMode) => emit('update:mode', v)">
          <n-space vertical>
            <n-radio value="image">
              <div class="flex items-center gap-2">
                <n-icon :component="DownloadOutline" />
                <span>图片格式</span>
                <span class="text-xs text-[--text-color-tertiary]">（PNG/JPG/SVG）</span>
              </div>
            </n-radio>
            <n-radio value="draw">
              <div class="flex items-center gap-2">
                <n-icon :component="SaveOutline" />
                <span>画稿格式</span>
                <span class="text-xs text-[--text-color-tertiary]">（.draw，可再次编辑）</span>
              </div>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <div v-if="mode === 'image'" class="mb-4">
        <div class="text-sm mb-2 font-medium">选择图片格式：</div>
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
        <template v-if="mode === 'image'">
          <div class="flex items-center gap-2 mb-1">
            <n-icon :component="DownloadOutline" />
            <span>点击确认后将弹出目录选择对话框</span>
          </div>
          <div class="text-[--text-color-tertiary]">
            导出文件将以 canvas_export_时间戳.格式 命名
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-2 mb-1">
            <n-icon :component="SaveOutline" />
            <span>画稿格式包含完整的画布数据和图片资源</span>
          </div>
          <div class="text-[--text-color-tertiary]">保存后可通过"导入画稿"功能继续编辑</div>
        </template>
      </div>
    </div>

    <template #action>
      <n-button :disabled="loading" @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="loading" :disabled="loading" @click="handleConfirm">
        <template #icon>
          <n-icon :component="mode === 'image' ? DownloadOutline : SaveOutline" />
        </template>
        {{ mode === 'image' ? '确认导出' : '保存画稿' }}
      </n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.export-dialog-content {
  min-height: 180px;
}
</style>
