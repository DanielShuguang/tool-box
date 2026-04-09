<script lang="ts" setup>
import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/plugin-notification'
import { handleShowMainWindow } from '@/components/AppSettings/logic'
import { TimeUnits } from '@/utils/time'
import { useEyeProtectionStore } from '@/stores/eyeProtection'

const message = useMessage()
const dialog = useDialog()

const closeEyesRef = useTemplateRef('closeEyes')
const restRef = useTemplateRef('rest')
const activeCountdown = ref(false)

const eyeProtectionStore = useEyeProtectionStore()

watch(
  () => eyeProtectionStore.isOpen,
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

const currentRoute = useRoute()

async function ensureOnEyeProtectionPage() {
  if (currentRoute.path !== '/eyeProtection') {
    const router = useRouter()
    await router.push('/eyeProtection')
    await nextTick()
  }
}

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
  await ensureOnEyeProtectionPage()

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
  await ensureOnEyeProtectionPage()

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
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <!-- 提示信息 -->
    <div class="tip-bar shrink-0">
      本功能旨在帮助无法脱离屏幕的用户尽可能保护自己的眼睛，如非必要，请不要长时间注视或使用电子屏幕。
    </div>

    <!-- 功能配置 -->
    <div class="config-card">
      <p class="section-title">功能配置</p>
      <div class="flex items-center justify-between mb-3">
        <span class="text-[13px] text-[--textColorBase]">启用护眼提醒</span>
        <n-switch v-model:value="eyeProtectionStore.isOpen" />
      </div>

      <template v-if="eyeProtectionStore.isOpen">
        <n-divider class="!my-3" />
        <n-form label-placement="top" :show-feedback="false" :show-require-mark="false">
          <div class="grid grid-cols-2 gap-4">
            <n-form-item label="闭眼休息间隔">
              <n-input-number
                v-model:value="eyeProtectionStore.closeEyesInterval"
                :show-button="false"
                class="w-full">
                <template #suffix>分钟</template>
              </n-input-number>
              <span class="field-hint">长时间工作后闭眼休息能放松眼球</span>
            </n-form-item>
            <n-form-item label="远眺小憩间隔">
              <n-input-number
                v-model:value="eyeProtectionStore.restInterval"
                :show-button="false"
                class="w-full">
                <template #suffix>分钟</template>
              </n-input-number>
              <span class="field-hint">每隔一小段时间远眺一会儿有助眼睛健康</span>
            </n-form-item>
          </div>
        </n-form>
        <div class="mt-3">
          <n-button type="primary" size="small" @click="handleRestart">重新计时</n-button>
        </div>
      </template>
    </div>

    <!-- 倒计时面板 -->
    <div v-if="eyeProtectionStore.isOpen" class="grid grid-cols-2 gap-3">
      <div class="countdown-card">
        <p class="section-title">闭眼休息倒计时</p>
        <div class="countdown-value">
          <n-countdown
            ref="closeEyes"
            :active="activeCountdown && !!eyeProtectionStore.closeEyesInterval"
            :duration="(eyeProtectionStore.closeEyesInterval || 0) * TimeUnits.Minute"
            @finish="closeEyesAlarm" />
        </div>
        <span class="countdown-label">到时间将弹窗提醒闭眼休息</span>
      </div>

      <div class="countdown-card">
        <p class="section-title">远眺小憩倒计时</p>
        <div class="countdown-value">
          <n-countdown
            ref="rest"
            :active="activeCountdown && !!eyeProtectionStore.restInterval"
            :duration="(eyeProtectionStore.restInterval || 0) * TimeUnits.Minute"
            @finish="restAlarm" />
        </div>
        <span class="countdown-label">到时间将弹窗提醒远眺休息</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tip-bar {
  font-size: 12px;
  color: var(--textColor3);
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--actionColor);
  border: 1px solid var(--borderColor);
  line-height: 1.5;
}

.config-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 14px 16px;
  background-color: var(--cardColor);
  flex-shrink: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--textColor3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 10px;
}

.field-hint {
  display: block;
  font-size: 11px;
  color: var(--textColor3);
  margin-top: 4px;
}

.countdown-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 14px 16px;
  background-color: var(--cardColor);
  text-align: center;
}

.countdown-value {
  font-size: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--primaryColor);
  margin: 12px 0 8px;
}

.countdown-label {
  font-size: 11px;
  color: var(--textColor3);
}
</style>
