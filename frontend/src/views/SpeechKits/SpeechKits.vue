<script lang="ts" setup>
import { useInitSpeechEngine } from './logic'

const { voice, voices, speechText, speech, handleChangeVoice } = useInitSpeechEngine()
const { isSupported } = speech
</script>

<template>
  <div class="speech-kits">
    <div class="is-support">当前环境{{ isSupported ? '支持' : '不支持' }}本功能</div>
    <div v-if="speech.isSupported">
      <NForm label-placement="left">
        <NFormItem label="选择语言音色">
          <NSelect
            :value="voice?.name"
            value-field="name"
            label-field="name"
            style="width: 500px"
            :options="voices"
            @update:value="handleChangeVoice"
          />
        </NFormItem>
      </NForm>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
