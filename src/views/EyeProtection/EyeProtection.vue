<script lang="ts" setup>
import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/plugin-notification'
import { handleShowMainWindow } from '@/components/AppSettings/logic'
import { TimeUnits } from '@/utils/time'
import { CountdownInst } from 'naive-ui'
import { Nullable } from '@/types/common'
import { usePersistentStorage } from '@/hooks/usePersistentStorage'
import { ConfigFile } from '@/utils/storage'

const message = useMessage()
const dialog = useDialog()

const closeEyesRef = useTemplateRef<CountdownInst>('closeEyes')
const restRef = useTemplateRef<CountdownInst>('rest')
const activeCountdown = ref(false)

const state = usePersistentStorage(
  'open-eye-protection',
  {
    isOpen: false,
    closeEyesInterval: 120 as Nullable<number>,
    restInterval: 20 as Nullable<number>
  },
  ConfigFile.EyeProtection
)

watch(
  () => state.value.isOpen,
  val => {
    if (val) {
      startTiming()
    } else {
      shutdownTiming()
    }
  },
  { immediate: true }
)

function shutdownTiming() {
  closeEyesRef.value?.reset()
  restRef.value?.reset()
  activeCountdown.value = false
}

function handleRestart() {
  shutdownTiming()
  startTiming()
}

let isAlertShowing = false

function restOver() {
  activeCountdown.value = true
  restRef.value?.reset()
}

function closeEyesOver() {
  isAlertShowing = false
  activeCountdown.value = true
  closeEyesRef.value?.reset()
  restOver()
}

async function closeEyesAlarm() {
  isAlertShowing = true
  activeCountdown.value = false
  await handleShowMainWindow()
  sendNotification({ title: '提醒', body: '请闭目休息眼睛' })
  dialog.warning({
    title: '提醒',
    content: '请闭目休息',
    positiveText: '确定',
    maskClosable: false,
    onAfterLeave: closeEyesOver
  })
}

async function restAlarm() {
  if (isAlertShowing) return

  activeCountdown.value = false
  await handleShowMainWindow()
  sendNotification({ title: '提醒', body: '请远眺一下' })
  dialog.info({
    title: '提醒',
    content: '请远眺一下',
    positiveText: '确定',
    onAfterLeave: restOver
  })
}

function startTiming() {
  activeCountdown.value = true
  closeEyesRef.value?.reset()
  restRef.value?.reset()
}

async function getNotifyPermission() {
  try {
    const isGranted = await isPermissionGranted()
    if (isGranted) return

    const grantedResult = await requestPermission()
    if (grantedResult !== 'granted') {
      throw new Error('无法获取通知权限')
    }
  } catch (error) {
    message.error(String(error))
  }
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
        <n-switch v-model:value="state.isOpen" />
      </n-form-item>
      <template v-if="state.isOpen">
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
          <n-input-number class="w-[300px]" v-model:value="state.restInterval" :show-button="false">
            <template #suffix>
              <span>分钟</span>
            </template>
          </n-input-number>
          <span class="ml-[15px]">每隔一小段时间远眺一会儿有助眼睛的健康</span>
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleRestart">重新开始</n-button>
        </n-form-item>

        <div class="flex gap-[20px]">
          <n-card title="距离下次闭眼休息剩余">
            <n-countdown
              ref="closeEyes"
              :active="activeCountdown && !!state.closeEyesInterval"
              :duration="(state.closeEyesInterval || 0) * TimeUnits.Minute"
              @finish="closeEyesAlarm"
            />
          </n-card>

          <n-card title="距离下次远眺小憩剩余">
            <n-countdown
              ref="rest"
              :active="activeCountdown && !!state.restInterval"
              :duration="(state.restInterval || 0) * TimeUnits.Minute"
              @finish="restAlarm"
            />
          </n-card>
        </div>
      </template>
    </n-form>
  </div>
</template>
