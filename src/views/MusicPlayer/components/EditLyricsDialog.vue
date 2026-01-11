<script setup lang="ts">
import { ref, watch, computed } from 'vue'

export interface LyricsLine {
  time: number
  text: string
}

const props = defineProps<{
  show: boolean
  lyrics: LyricsLine[]
  songName: string
  artist: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [lyrics: LyricsLine[]]
}>()

const editedLyrics = ref<string>('')
const errorMsg = ref<string>('')
const isSaving = ref(false)

watch(
  () => props.show,
  show => {
    if (show && props.lyrics.length > 0) {
      editedLyrics.value = props.lyrics
        .map(l => {
          const minutes = Math.floor(l.time / 60)
          const seconds = Math.floor(l.time % 60)
          const ms = Math.floor((l.time % 1) * 100)
          return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]${l.text}`
        })
        .join('\n')
      errorMsg.value = ''
    }
  }
)

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

function validateAndParse(): LyricsLine[] {
  const content = editedLyrics.value.trim()

  if (!content) {
    errorMsg.value = '歌词内容不能为空'
    return []
  }

  const lines = parseLRC(content)

  if (lines.length === 0) {
    errorMsg.value = '未能解析有效的歌词行，请确保格式正确（如 [00:00.00]歌词内容）'
    return []
  }

  return lines
}

function handleSave() {
  errorMsg.value = ''
  const parsed = validateAndParse()

  if (parsed.length > 0) {
    isSaving.value = true
    setTimeout(() => {
      emit('save', parsed)
      isSaving.value = false
      emit('update:show', false)
    }, 300)
  }
}

function handleCancel() {
  emit('update:show', false)
}

const canSave = computed(() => {
  return editedLyrics.value.trim().length > 0 && !isSaving.value
})

const lineCount = computed(() => {
  return editedLyrics.value.split('\n').filter(l => l.trim()).length
})

const timeTagCount = computed(() => {
  const matches = editedLyrics.value.match(/\[\d{2}:\d{2}\.\d{2,3}\]/g)
  return matches ? matches.length : 0
})
</script>

<template>
  <n-modal
    :show="show"
    preset="dialog"
    :title="`编辑歌词 - ${songName}`"
    :subtitle="`艺术家: ${artist}`"
    :show-icon="false"
    :mask-closable="false"
    :close-on-esc="true"
    style="width: 700px; max-width: 90vw"
    @update:show="emit('update:show', $event)">
    <div class="lyrics-editor-container">
      <n-alert type="info" class="mb-3" :bordered="false">
        <template #header>
          <span class="text-[12px]">歌词格式说明</span>
        </template>
        <span class="text-[11px] text-[--textColor3]">
          支持 LRC 格式，每行以时间标签开头，如：
          <code class="mx-1">[00:00.00]歌曲名</code>
          <code class="mx-1">[00:15.50]第一句歌词</code>
        </span>
      </n-alert>

      <n-input
        v-model:value="editedLyrics"
        type="textarea"
        placeholder="在此粘贴或编辑歌词...
示例:
[00:00.00]歌曲名称
[00:05.50]第一句歌词
[00:10.25]第二句歌词"
        :rows="12"
        :maxlength="-1"
        show-count
        class="lyrics-textarea" />

      <div v-if="errorMsg" class="mt-2">
        <n-alert type="error" :bordered="false" class="text-[12px]">
          {{ errorMsg }}
        </n-alert>
      </div>

      <div class="mt-2 flex justify-between text-[11px] text-[--textColor3]">
        <span>歌词行数: {{ lineCount }}</span>
        <span>时间标签: {{ timeTagCount }}个</span>
      </div>
    </div>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="isSaving"> 取消 </n-button>
        <n-button type="primary" :loading="isSaving" :disabled="!canSave" @click="handleSave">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.lyrics-editor-container {
  padding: 4px 0;
}

.lyrics-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
