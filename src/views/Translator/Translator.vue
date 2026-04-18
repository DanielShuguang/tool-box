<script lang="ts" setup>
import { TranslationFactory } from './logic'
import {
  SwapHorizontalOutline,
  CopyOutline,
  TrashOutline,
  LanguageOutline
} from '@vicons/ionicons5'
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

// 统计数据
const inputLength = computed(() => inputText.value.length)
const outputLength = computed(() => outputText.value.length)
const isTranslated = computed(() => outputText.value.length > 0)

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
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">翻译工具</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-green-500">
              <LanguageOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">原文字符</div>
              <div class="text-xl font-bold">{{ inputLength }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <LanguageOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">译文字符</div>
              <div class="text-xl font-bold">{{ outputLength }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-purple-500">
              <LanguageOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">翻译服务</div>
              <div class="text-sm font-bold">
                {{ translationService === 'google' ? 'Google' : 'DeepL' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 服务选择 -->
      <n-card class="mb-4" :bordered="false">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium">翻译服务</span>
            <n-radio-group v-model:value="translationService" size="small">
              <n-radio-button value="google">Google</n-radio-button>
              <n-radio-button value="deepl">DeepL</n-radio-button>
            </n-radio-group>
          </div>
          <n-button size="tiny" @click="clearAll" :disabled="!inputText && !outputText">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </n-card>

      <!-- 语言选择 -->
      <n-card class="mb-4" :bordered="false">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <!-- 源语言 -->
            <n-select
              v-model:value="sourceLanguage"
              :options="supportedLanguages.map(l => ({ label: l.name, value: l.code }))"
              placeholder="源语言"
              size="small"
              class="w-28" />

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
            <n-select
              v-model:value="targetLanguage"
              :options="targetLanguages.map(l => ({ label: l.name, value: l.code }))"
              placeholder="目标语言"
              size="small"
              class="w-28" />
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
      </n-card>

      <!-- 翻译区域 -->
      <n-card :bordered="false">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-base font-medium">翻译内容</span>
          </div>
        </template>

        <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 输入面板 -->
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">原文</span>
              <span class="text-xs text-gray-400">{{ inputLength }} 字符</span>
            </div>
            <n-input
              v-model:value="inputText"
              type="textarea"
              placeholder="请输入要翻译的文本..."
              :rows="6"
              @keydown.meta.enter="translate"
              @keydown.ctrl.enter="translate" />
          </div>

          <!-- 输出面板 -->
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">译文</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">{{ outputLength }} 字符</span>
                <n-button v-if="outputText" text size="tiny" @click="copyOutput">
                  <template #icon>
                    <n-icon size="14"><CopyOutline /></n-icon>
                  </template>
                </n-button>
                <n-button
                  v-if="outputText"
                  text
                  size="tiny"
                  @click="swapAndTranslate"
                  title="交换并翻译">
                  <template #icon>
                    <n-icon size="14"><SwapHorizontalOutline /></n-icon>
                  </template>
                </n-button>
              </div>
            </div>
            <n-input
              v-model:value="outputText"
              type="textarea"
              placeholder="翻译结果..."
              :rows="6"
              readonly />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!isTranslated" class="text-center py-8">
          <n-empty description="输入文本后点击翻译" size="small" />
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="mt-3 p-2 rounded bg-red-50 text-red-600 text-sm">
          {{ errorMessage }}
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.n-card {
  background-color: var(--cardColor);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bg-white {
  background-color: var(--cardColor);
}
</style>
