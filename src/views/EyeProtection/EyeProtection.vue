<script lang="ts" setup>
import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/plugin-notification'
import { handleShowMainWindow } from '@/components/AppSettings/logic'
import { sleep } from '@/utils/promise'
import { TimeUnits } from '@/utils/time'

const message = useMessage()
const dialog = useDialog()

const isOpen = ref(false)
const permissionGranted = ref<NotificationPermission>('default')

const state = useLocalStorage('open-eye-protection', {
  closeEyesInterval: 120 as number | null,
  restInterval: 20 as number | null
})

watch(isOpen, val => {
  if (val) {
    startTiming()
  } else {
    shutdownTiming()
  }
})

const closeEyesTimer = ref(0)
const restTimer = ref(0)

function shutdownTiming() {
  clearTimeout(closeEyesTimer.value)
  clearTimeout(restTimer.value)
}

function startTiming() {
  if (!restTimer.value) {
    restTimer.value = setTimeout(async () => {
      sendNotification({ title: '提醒', body: '请远眺一下' })
      await sleep(5 * TimeUnits.Minute)
    }, (state.value.restInterval || 0) * TimeUnits.Minute)
  }

  if (!closeEyesTimer.value) {
    closeEyesTimer.value = setTimeout(() => {
      showNotification()
    }, (state.value.closeEyesInterval || 0) * TimeUnits.Minute)
  }
}

async function getNotifyPermission() {
  try {
    const isGranted = await isPermissionGranted()
    if (isGranted) {
      permissionGranted.value = 'granted'
    } else {
      permissionGranted.value = await requestPermission()
      if (permissionGranted.value !== 'granted') {
        throw new Error('无法获取通知权限')
      }
    }
  } catch (error) {
    message.error(String(error))
  }
}

function rest() {
  clearTimeout(closeEyesTimer.value)
  closeEyesTimer.value = 0
  startTiming()
}

async function showNotification() {
  await handleShowMainWindow()
  dialog.info({
    title: '提醒',
    content: '请闭目休息眼睛',
    positiveText: '确定',
    onPositiveClick: rest,
    onClose: rest
  })
}

onMounted(() => {
  getNotifyPermission()
})
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
          <n-input-number
            class="w-[300px]"
            v-model:value="state.closeEyesInterval"
            :show-button="false"
          >
            <template #suffix>
              <span>分钟</span>
            </template>
          </n-input-number>
          <span class="ml-[15px]">长时间工作后闭眼休息能放松眼球</span>
        </n-form-item>
        <n-form-item label="小憩间隔">
          <n-input-number v-model:value="state.restInterval">
            <template #suffix>
              <span>分钟</span>
            </template>
          </n-input-number>
          <span class="ml-[15px]">每个一小段时间远眺一会儿有助眼睛的健康</span>
        </n-form-item>
      </template>
    </n-form>

    <n-countdown :duration="(state.closeEyesInterval || 0) * TimeUnits.Minute" />
  </div>
</template>
