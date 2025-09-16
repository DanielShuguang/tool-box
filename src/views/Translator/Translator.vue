<script lang="ts" setup>
import { TranslationFactory } from './logic'
import { SwapHorizOutlined } from '@vicons/material'
import { useMessage } from 'naive-ui'

// 翻译服务类型
const translationService = ref<'google' | 'deepl'>('google')

const message = useMessage()

// 源语言和目标语言
const sourceLanguage = ref('auto')
const targetLanguage = ref('ZH')

// 输入和输出文本
const inputText = ref('')
const outputText = ref('')

// 错误信息
const errorMessage = ref('')

// 支持的语言列表
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

// 翻译函数
// 交换语言
const exchangeLanguages = () => {
  if (sourceLanguage.value === 'auto') return
  ;[sourceLanguage.value, targetLanguage.value] = [targetLanguage.value, sourceLanguage.value]
}

// 翻译函数
const translate = async () => {
  if (!inputText.value.trim()) return

  errorMessage.value = ''
  try {
    const service = TranslationFactory.getService(translationService.value, message)
    outputText.value = await service.translate(
      inputText.value,
      sourceLanguage.value,
      targetLanguage.value
    )
  } catch (error) {
    console.error('翻译出错:', error)
    errorMessage.value = error instanceof Error ? error.message : '翻译服务异常，请稍后重试'
  }
}
</script>

<template>
  <div class="max-w-1200px mx-auto p-4">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <n-select
          class="w-150px"
          v-model:value="sourceLanguage"
          :options="supportedLanguages"
          label-field="name"
          value-field="code"
          size="small"
        />
        <div class="flex items-center">
          <n-button text @click="exchangeLanguages">
            <template #icon>
              <n-icon><SwapHorizOutlined /></n-icon>
            </template>
          </n-button>
        </div>
        <n-select
          class="w-150px"
          v-model:value="targetLanguage"
          :options="targetLanguages"
          label-field="name"
          value-field="code"
          size="small"
        />
      </div>

      <div class="translation-service">
        <n-radio-group v-model:value="translationService" size="small">
          <n-radio-button value="google">Google翻译</n-radio-button>
          <n-radio-button value="deepl">DeepL翻译</n-radio-button>
        </n-radio-group>
      </div>
    </div>

    <div class="translation-area grid grid-cols-2 gap-4">
      <div class="input-area">
        <n-input-group>
          <n-input
            v-model:value="inputText"
            type="textarea"
            placeholder="请输入要翻译的文本"
            :autosize="{ minRows: 10, maxRows: 15 }"
          />
        </n-input-group>
      </div>

      <div class="output-area">
        <n-input-group>
          <n-input
            v-model:value="outputText"
            type="textarea"
            placeholder="翻译结果"
            readonly
            :autosize="{ minRows: 10, maxRows: 15 }"
          />
        </n-input-group>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-red-500">{{ errorMessage }}</div>
      <n-button type="primary" @click="translate" :disabled="!inputText.trim()">翻译</n-button>
    </div>
  </div>
</template>
