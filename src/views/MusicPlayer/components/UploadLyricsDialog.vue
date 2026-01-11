<script setup lang="ts">
import { ref, computed } from 'vue'
import { CloudUploadOutline, DocumentTextOutline } from '@vicons/ionicons5'

interface LyricsLine {
  time: number
  text: string
}

defineProps<{
  show: boolean
  songName: string
  artist: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [lyrics: LyricsLine[], source: 'Upload']
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const errorMsg = ref<string>('')
const isSaving = ref(false)
const uploadMethod = ref<'paste' | 'file'>('paste')

function parseLRC(content: string): LyricsLine[] {
  const lines: LyricsLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10)
    const text = match[4].trim()

    if (text) {
      lines.push({
        time: minutes * 60 + seconds + ms / 100,
        text
      })
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    selectedFile.value = file
    errorMsg.value = ''

    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      if (content) {
        const parsed = parseLRC(content)
        if (parsed.length > 0) {
          errorMsg.value = ''
        } else {
          errorMsg.value = '文件中未找到有效的LRC格式歌词'
        }
      }
    }
    reader.onerror = () => {
      errorMsg.value = '读取文件失败'
    }
    reader.readAsText(file)
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]

  if (file) {
    const validTypes = ['.lrc', '.txt', '.text']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()

    if (validTypes.includes(ext)) {
      selectedFile.value = file
      errorMsg.value = ''

      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target?.result as string
        if (content) {
          const parsed = parseLRC(content)
          if (parsed.length > 0) {
            errorMsg.value = ''
          } else {
            errorMsg.value = '文件中未找到有效的LRC格式歌词'
          }
        }
      }
      reader.onerror = () => {
        errorMsg.value = '读取文件失败'
      }
      reader.readAsText(file)
    } else {
      errorMsg.value = '仅支持 .lrc 和 .txt 格式的歌词文件'
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleSave() {
  errorMsg.value = ''

  if (uploadMethod.value === 'file' && selectedFile.value) {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      if (content) {
        const parsed = parseLRC(content)
        if (parsed.length > 0) {
          isSaving.value = true
          setTimeout(() => {
            emit('save', parsed, 'Upload')
            isSaving.value = false
            emit('update:show', false)
            resetState()
          }, 300)
        } else {
          errorMsg.value = '未能解析有效的歌词行'
        }
      }
    }
    reader.readAsText(selectedFile.value)
  }
}

function handleCancel() {
  resetState()
  emit('update:show', false)
}

function resetState() {
  selectedFile.value = null
  errorMsg.value = ''
  isSaving.value = false
  uploadMethod.value = 'paste'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleUpdateShow(value: boolean) {
  if (!value) {
    resetState()
  }
  emit('update:show', value)
}

const canSave = computed(() => {
  if (uploadMethod.value === 'file' && selectedFile.value) {
    return errorMsg.value === ''
  }
  return false
})

const supportedFormats = ['.lrc', '.txt']
</script>

<template>
  <n-modal
    :show="show"
    preset="dialog"
    :title="`上传歌词 - ${songName}`"
    :subtitle="`艺术家: ${artist}`"
    :show-icon="false"
    :mask-closable="false"
    :close-on-esc="true"
    style="width: 550px; max-width: 90vw"
    @update:show="handleUpdateShow">
    <div class="upload-container">
      <n-tabs v-model:value="uploadMethod" type="segment" animated>
        <n-tab-pane name="paste" tab="粘贴歌词">
          <div class="mt-4">
            <n-input
              type="textarea"
              placeholder="在此粘贴LRC格式歌词...
示例:
[00:00.00]歌曲名称
[00:05.50]第一句歌词"
              :rows="8"
              class="lyrics-textarea" />
          </div>
        </n-tab-pane>

        <n-tab-pane name="file" tab="上传文件">
          <div
            class="mt-4 border-2 border-dashed border-[--borderColor] rounded-lg p-6 text-center cursor-pointer hover:border-[--primaryColor] hover:bg-[--bgColorHover] transition-colors"
            @click="fileInput?.click()"
            @drop="handleDrop"
            @dragover="handleDragOver">
            <input
              ref="fileInput"
              type="file"
              accept=".lrc,.txt"
              class="hidden"
              @change="handleFileSelect" />

            <div v-if="!selectedFile" class="py-4">
              <n-icon size="32" :depth="2" class="mb-2">
                <CloudUploadOutline />
              </n-icon>
              <p class="text-[14px] text-[--textColor2]">点击或拖拽歌词文件到此处</p>
              <p class="text-[12px] text-[--textColor3] mt-1">
                支持 {{ supportedFormats.join('、') }} 格式
              </p>
            </div>

            <div v-else class="py-4">
              <n-icon size="24" class="mb-2 text-[--primaryColor]">
                <DocumentTextOutline />
              </n-icon>
              <p class="text-[14px] text-[--textColor1]">
                {{ selectedFile.name }}
              </p>
              <p class="text-[12px] text-[--textColor3] mt-1">
                {{ (selectedFile.size / 1024).toFixed(2) }} KB
              </p>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>

      <div v-if="errorMsg" class="mt-4">
        <n-alert type="error" :bordered="false" class="text-[12px]">
          {{ errorMsg }}
        </n-alert>
      </div>
    </div>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="isSaving"> 取消 </n-button>
        <n-button type="primary" :loading="isSaving" :disabled="!canSave" @click="handleSave">
          确认上传
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.upload-container {
  padding: 4px 0;
}

.lyrics-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}
</style>
