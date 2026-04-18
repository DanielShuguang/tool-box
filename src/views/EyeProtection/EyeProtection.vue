<script lang="ts" setup>
import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/plugin-notification'
import { handleShowMainWindow } from '@/components/AppSettings/logic'
import { TimeUnits } from '@/utils/time'
import { useEyeProtectionStore } from '@/stores/eyeProtection'
import { TimeOutline, EyeOutline, SunnyOutline, RefreshOutline } from '@vicons/ionicons5'

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
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">护眼工具</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-blue-500">
              <TimeOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">闭眼间隔</div>
              <div class="text-xl font-bold">
                {{ eyeProtectionStore.closeEyesInterval || 20 }} 分钟
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <SunnyOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">远眺间隔</div>
              <div class="text-xl font-bold">{{ eyeProtectionStore.restInterval || 30 }} 分钟</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon
              size="20"
              :class="eyeProtectionStore.isOpen ? 'text-green-500' : 'text-gray-400'">
              <RefreshOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">当前状态</div>
              <div
                class="text-sm font-bold"
                :class="eyeProtectionStore.isOpen ? 'text-green-500' : 'text-gray-400'">
                {{ eyeProtectionStore.isOpen ? '运行中' : '已关闭' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能配置 -->
      <n-card :bordered="false" class="mb-4">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <n-icon size="18"><EyeOutline /></n-icon>
              <span class="text-base font-medium">功能配置</span>
            </div>
            <n-switch v-model:value="eyeProtectionStore.isOpen" />
          </div>
        </template>

        <div v-if="!eyeProtectionStore.isOpen" class="text-center py-6 text-gray-400">
          开启护眼提醒来保护您的眼睛
        </div>

        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">闭眼休息间隔</label>
              <n-input-number
                v-model:value="eyeProtectionStore.closeEyesInterval"
                :min="1"
                class="w-full">
                <template #suffix>分钟</template>
              </n-input-number>
              <span class="text-xs text-gray-400">长时间工作后闭眼休息能放松眼球</span>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">远眺小憩间隔</label>
              <n-input-number
                v-model:value="eyeProtectionStore.restInterval"
                :min="1"
                class="w-full">
                <template #suffix>分钟</template>
              </n-input-number>
              <span class="text-xs text-gray-400">每隔一小段时间远眺一会儿有助眼睛健康</span>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <n-button type="primary" @click="handleRestart">重新计时</n-button>
            <div class="flex gap-4">
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">闭眼倒计时</div>
                <div class="text-xl font-bold text-blue-500">
                  <n-countdown
                    ref="closeEyes"
                    :active="activeCountdown && !!eyeProtectionStore.closeEyesInterval"
                    :duration="(eyeProtectionStore.closeEyesInterval || 0) * TimeUnits.Minute"
                    @finish="closeEyesAlarm" />
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-500 mb-1">远眺倒计时</div>
                <div class="text-xl font-bold text-orange-500">
                  <n-countdown
                    ref="rest"
                    :active="activeCountdown && !!eyeProtectionStore.restInterval"
                    :duration="(eyeProtectionStore.restInterval || 0) * TimeUnits.Minute"
                    @finish="restAlarm" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </n-card>

      <!-- 提示信息 -->
      <div class="p-3 rounded-lg bg-orange-50 border border-orange-200">
        <div class="flex items-start gap-2">
          <n-icon size="18" class="text-orange-500 flex-shrink-0 mt-0.5">
            <EyeOutline />
          </n-icon>
          <div class="text-sm text-orange-700">
            本功能旨在帮助无法脱离屏幕的用户尽可能保护自己的眼睛，如非必要，请不要长时间注视或使用电子屏幕。
          </div>
        </div>
      </div>
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
