<script lang="ts" setup>
import { useDownloadDialog } from '../hooks/useDownloadDialog'
import { FolderOpenOutline } from '@vicons/ionicons5'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const {
  newDownloadUrl,
  newDownloadDir,
  newDownloadFileName,
  handleCreateDownload,
  handleSelectDir
} = useDownloadDialog()

watch(
  () => props.show,
  val => {
    if (!val) {
      newDownloadUrl.value = ''
      newDownloadFileName.value = ''
    }
  }
)

function handleConfirm() {
  handleCreateDownload()
  emit('confirm')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <n-modal
    :show="show"
    preset="dialog"
    title="新建下载任务"
    style="width: 600px"
    @close="handleClose"
    @mask-click="handleClose">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="下载链接" required>
        <n-input
          v-model:value="newDownloadUrl"
          placeholder="请输入下载链接（URL）"
          @keydown.enter="handleConfirm" />
      </n-form-item>

      <n-form-item label="保存目录">
        <n-input-group>
          <n-input v-model:value="newDownloadDir" placeholder="下载文件保存目录" readonly />
          <n-button @click="handleSelectDir">
            <template #icon>
              <n-icon>
                <FolderOpenOutline />
              </n-icon>
            </template>
            选择
          </n-button>
        </n-input-group>
      </n-form-item>

      <n-form-item label="文件名">
        <n-input v-model:value="newDownloadFileName" placeholder="留空则自动获取文件名" />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleConfirm" :disabled="!newDownloadUrl.trim()">
          确定
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
