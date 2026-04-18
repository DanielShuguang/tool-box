<script lang="ts" setup>
import { TranslationFactory } from './logic'
import { SwapHorizontalOutline, CopyOutline, TrashOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

const message = useMessage()

const translationService = ref<'google' | 'deepl'>('google')
const sourceLanguage = ref('auto')
const targetLanguage = ref('ZH')
const inputText = ref('')
const outputText = ref('')
const errorMessage = ref('')
const loading = ref(false)

const supportedLanguages = [
  { code: 'auto', name: '自动检测' },
  { code: 'AR', name: '阿拉伯语' },
  { code: 'BG', name: '保加利亚语' },
  { code: 'CS', name: '捷克语' },
  { code: 'DA', name: '丹麦语' },
  { code: 'DE', name: '德语' },
  { code: 'EL', name: '希腊语' },
  { code: 'EN', name: '英语' },
  { code: 'ES', name: '西班牙语' },
  { code: 'ET', name: '爱沙尼亚语' },
  { code: 'FI', name: '芬兰语' },
  { code: 'FR', name: '法语' },
  { code: 'HU', name: '匈牙利语' },
  { code: 'ID', name: '印度尼西亚语' },
  { code: 'IT', name: '意大利语' },
  { code: 'JA', name: '日语' },
  { code: 'KO', name: '韩语' },
  { code: 'LT', name: '立陶宛语' },
  { code: 'LV', name: '拉脱维亚语' },
  { code: 'NB', name: '挪威语' },
  { code: 'NL', name: '荷兰语' },
  { code: 'PL', name: '波兰语' },
  { code: 'PT', name: '葡萄牙语' },
  { code: 'RO', name: '罗马尼亚语' },
  { code: 'RU', name: '俄语' },
  { code: 'SK', name: '斯洛伐克语' },
  { code: 'SL', name: '斯洛文尼亚语' },
  { code: 'SV', name: '瑞典语' },
  { code: 'TR', name: '土耳其语' },
  { code: 'UK', name: '乌克兰语' },
  { code: 'ZH', name: '中文' }
]

const targetLanguages = computed(() =>
  supportedLanguages.filter(item => item.code !== 'auto' && item.code !== sourceLanguage.value)
)

const sourceLanguageName = computed(
  () => supportedLanguages.find(l => l.code === sourceLanguage.value)?.name || '自动检测'
)
const targetLanguageName = computed(
  () => supportedLanguages.find(l => l.code === targetLanguage.value)?.name || '中文'
)

const exchangeLanguages = () => {
  if (sourceLanguage.value === 'auto') {
    message.warning('自动检测语言无法交换')
    return
  }
  const tempText = inputText.value
  inputText.value = outputText.value
  outputText.value = tempText
  ;[sourceLanguage.value, targetLanguage.value] = [targetLanguage.value, sourceLanguage.value]
}

const translate = async () => {
  if (!inputText.value.trim()) return
  errorMessage.value = ''
  try {
    loading.value = true
    const service = TranslationFactory.getService(translationService.value, message)
    outputText.value = await service.translate(
      inputText.value,
      sourceLanguage.value,
      targetLanguage.value
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '翻译服务异常，请稍后重试'
  } finally {
    loading.value = false
  }
}

const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
}

const swapAndTranslate = () => {
  if (!outputText.value.trim()) return
  inputText.value = outputText.value
  outputText.value = ''
  exchangeLanguages()
  translate()
}
</script>

<template>
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <!-- 顶部服务选择 -->
    <div class="config-card shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="section-title !mb-0">翻译服务</span>
          <n-radio-group v-model:value="translationService" size="small">
            <n-radio-button value="google">Google</n-radio-button>
            <n-radio-button value="deepl">DeepL</n-radio-button>
          </n-radio-group>
        </div>
        <div class="flex items-center gap-2">
          <n-button size="tiny" @click="clearAll" :disabled="!inputText && !outputText">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 语言选择 -->
    <div class="language-bar shrink-0">
      <div class="flex items-center gap-3">
        <!-- 源语言 -->
        <n-popover trigger="click" placement="bottom-start">
          <template #trigger>
            <button class="language-btn">
              <span class="language-label">源语言</span>
              <span class="language-name">{{ sourceLanguageName }}</span>
              <svg
                class="w-3 h-3 opacity-60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </template>
          <div class="language-dropdown">
            <button
              v-for="lang in supportedLanguages"
              :key="lang.code"
              class="language-option"
              :class="{ active: sourceLanguage === lang.code }"
              @click="sourceLanguage = lang.code">
              {{ lang.name }}
            </button>
          </div>
        </n-popover>

        <!-- 交换按钮 -->
        <n-button
          text
          size="small"
          @click="exchangeLanguages"
          :disabled="sourceLanguage === 'auto'"
          class="swap-btn">
          <template #icon>
            <n-icon size="18"><SwapHorizontalOutline /></n-icon>
          </template>
        </n-button>

        <!-- 目标语言 -->
        <n-popover trigger="click" placement="bottom-start">
          <template #trigger>
            <button class="language-btn">
              <span class="language-label">目标语言</span>
              <span class="language-name">{{ targetLanguageName }}</span>
              <svg
                class="w-3 h-3 opacity-60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </template>
          <div class="language-dropdown">
            <button
              v-for="lang in targetLanguages"
              :key="lang.code"
              class="language-option"
              :class="{ active: targetLanguage === lang.code }"
              @click="targetLanguage = lang.code">
              {{ lang.name }}
            </button>
          </div>
        </n-popover>
      </div>

      <!-- 翻译按钮 -->
      <n-button
        type="primary"
        size="small"
        @click="translate"
        :disabled="!inputText.trim()"
        :loading="loading">
        翻译
      </n-button>
    </div>

    <!-- 翻译区域 -->
    <div class="flex-1 min-h-0 grid grid-cols-2 gap-3">
      <!-- 输入面板 -->
      <div class="translate-panel">
        <div class="panel-header">
          <span class="text-[11px] font-semibold text-[--textColor3] uppercase tracking-wider"
            >原文</span
          >
          <span class="text-[11px] text-[--textColor3]">{{ inputText.length }} 字符</span>
        </div>
        <div class="panel-body">
          <textarea
            v-model="inputText"
            class="translate-input"
            placeholder="请输入要翻译的文本..."
            @keydown.meta.enter="translate"
            @keydown.ctrl.enter="translate" />
        </div>
      </div>

      <!-- 输出面板 -->
      <div class="translate-panel">
        <div class="panel-header">
          <span class="text-[11px] font-semibold text-[--textColor3] uppercase tracking-wider"
            >译文</span
          >
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-[--textColor3]">{{ outputText.length }} 字符</span>
            <n-button v-if="outputText" text size="tiny" @click="copyOutput" class="copy-btn">
              <template #icon>
                <n-icon size="14"><CopyOutline /></n-icon>
              </template>
            </n-button>
            <n-button
              v-if="outputText"
              text
              size="tiny"
              @click="swapAndTranslate"
              class="swap-translate-btn"
              title="交换并翻译">
              <template #icon>
                <n-icon size="14"><SwapHorizOutlined /></n-icon>
              </template>
            </n-button>
          </div>
        </div>
        <div class="panel-body">
          <textarea
            v-model="outputText"
            class="translate-output"
            placeholder="翻译结果..."
            readonly />
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-bar shrink-0">
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.config-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 10px 14px;
  background-color: var(--cardColor);
}

.language-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--cardColor);
  border: 1px solid var(--borderColor);
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--borderColor);
  border-radius: 6px;
  background: var(--cardColor);
  color: var(--textColorBase);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--primaryColor);
    color: var(--primaryColor);
  }

  .language-label {
    font-size: 10px;
    color: var(--textColor3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .language-name {
    font-weight: 500;
  }
}

.swap-btn {
  color: var(--textColor2);
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--primaryColor);
    transform: rotate(180deg);
  }

  &:disabled {
    opacity: 0.3;
  }
}

.language-dropdown {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.language-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--textColorBase);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: var(--actionColor);
  }

  &.active {
    background: var(--primaryColor);
    color: #fff;
  }
}

.translate-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  background-color: var(--cardColor);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--borderColor);
  background-color: var(--actionColor);
}

.panel-body {
  flex: 1;
  min-h: 0;
  display: flex;
}

.translate-input,
.translate-output {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--textColorBase);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;

  &::placeholder {
    color: var(--textColor3);
  }
}

.translate-output {
  background: var(--actionColor);
  cursor: default;
}

.copy-btn,
.swap-translate-btn {
  color: var(--textColor3);
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;

  .translate-panel:hover & {
    opacity: 1;
  }

  &:hover {
    color: var(--primaryColor);
  }
}

.error-bar {
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--errorColor);
  color: #fff;
  font-size: 12px;
}
</style>
