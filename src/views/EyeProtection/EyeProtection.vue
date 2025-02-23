<script lang="ts" setup>
const state = useLocalStorage('open-eye-protection', {
  isOpen: false,
  closeEyesInterval: 120,
  restInterval: 20
})

const { closeEyesInterval, isOpen, restInterval } = toRefs(state.value)
</script>

<template>
  <div>
    <n-alert type="info" class="mb-[20px]">
      本功能旨在帮助无法脱离屏幕的用户尽可能保护自己的眼睛，如非必要，请不要长时间注视或使用电子屏幕（包括手机），来自一个近视且经常眼睛累的苦逼程序员的忠告。
    </n-alert>

    <n-form label-placement="left">
      <n-form-item label="开启">
        <n-switch v-model:value="isOpen" />
      </n-form-item>
      <template v-if="isOpen">
        <n-form-item label="闭眼休息间隔">
          <n-input-number class="w-[300px]" v-model:value="closeEyesInterval" :show-button="false">
            <template #suffix>
              <span>分钟</span>
            </template>
          </n-input-number>
          <span class="ml-[15px]">长时间工作后闭眼休息能放松眼球</span>
        </n-form-item>
        <n-form-item label="小憩间隔">
          <n-input-number v-model:value="restInterval">
            <template #suffix>
              <span>分钟</span>
            </template>
          </n-input-number>
          <span class="ml-[15px]">每个一小段时间远眺一会儿有助眼睛的健康</span>
        </n-form-item>
      </template>
    </n-form>
  </div>
</template>
