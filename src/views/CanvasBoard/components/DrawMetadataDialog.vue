<script lang="ts" setup>
import { SaveOutline } from '@vicons/ionicons5'

interface Props {
  show: boolean
  loading: boolean
  defaultTitle?: string
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm', title: string): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()
const props = defineProps<Props>()

const title = ref(props.defaultTitle || '')

watch(
  () => props.show,
  newVal => {
    if (newVal) {
      title.value = props.defaultTitle || ''
    }
  }
)

const handleConfirm = () => {
  emit('confirm', title.value.trim() || `画稿_${Date.now()}`)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <n-modal
    :show="show"
    title="保存画稿"
    preset="dialog"
    :show-icon="false"
    style="width: 400px"
    :mask-closable="!loading"
    @update:show="(v: boolean) => emit('update:show', v)">
    <div class="save-dialog-content py-4">
      <div class="mb-4">
        <div class="text-sm mb-2 font-medium">画稿标题：</div>
        <n-input
          v-model:value="title"
          placeholder="请输入画稿标题（可选）"
          :disabled="loading"
          @keyup.enter="handleConfirm" />
      </div>

      <div class="text-xs text-[--text-color-secondary] bg-[--bodyColor] p-3 rounded">
        <div class="flex items-center gap-2 mb-1">
          <n-icon :component="SaveOutline" />
          <span>点击确认后将弹出文件保存对话框</span>
        </div>
        <div class="text-[--text-color-tertiary]">
          画稿将以 .draw 格式保存，包含完整的画布数据和图片资源
        </div>
      </div>
    </div>

    <template #action>
      <n-button :disabled="loading" @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="loading" :disabled="loading" @click="handleConfirm">
        <template #icon>
          <n-icon :component="SaveOutline" />
        </template>
        确认保存
      </n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.save-dialog-content {
  min-height: 120px;
}
</style>
