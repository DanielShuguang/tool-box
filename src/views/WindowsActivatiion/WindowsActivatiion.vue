<script lang="ts" setup>
import dayjs from 'dayjs'
import { Command } from '@tauri-apps/plugin-shell'
import { getOS } from '@/utils/system'

const message = useMessage()
const activeState = useLocalStorage('windows-activation', 0)

// 剩余不同时间有不同颜色
const colors = ['text-red-500', 'text-yellow-500', 'text-green-500']

const textColor = computed(() => {
  const diff = dayjs.unix(activeState.value).diff(dayjs(), 'days')
  // 剩余时间小于 60 天，则显示红色，小于 120 天，则显示黄色，否则显示绿色
  if (diff < 60) {
    return colors[0]
  } else if (diff < 120) {
    return colors[1]
  } else {
    return colors[2]
  }
})

async function handleClick() {
  const isSucceed = await handleActive()
  if (!isSucceed) return

  activeState.value = dayjs().add(180, 'days').unix()
}

const terminalScript = 'powershell'
const scriptRunner = 'cscript //nologo C:/Windows/System32/slmgr.vbs'
const activeCmds = ['/ipk NPPR9-FWDCX-D2C8J-H872K-2YT43', '/skms kms.0t.net.cn', '/ato']

async function handleActive() {
  for (const element of activeCmds) {
    const script = `${scriptRunner} ${element}`
    const { stdout } = await Command.create(terminalScript, script, {
      encoding: 'gbk'
    }).execute()

    const errors = ['错误', 'error']
    if (errors.some(error => stdout.includes(error))) {
      message.error(`[激活失败] ${stdout}`)
      return false
    }
  }

  return true
}

async function checkWindowsActiveInfo() {
  try {
    const { stdout } = await Command.create(terminalScript, `${scriptRunner} /xpr`, {
      encoding: 'gbk'
    }).execute()
    const errors = ['找不到产品密钥', 'error', 'not found']
    if (errors.some(error => stdout.includes(error))) {
      activeState.value = 0
      return
    }
    const dateReg = /\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/
    const expireDate = dateReg.exec(stdout)
    if (expireDate?.[0]) {
      activeState.value = dayjs(expireDate[0]).unix()
    } else {
      activeState.value = 1
    }
  } catch (error) {
    message.error(String(error))
  }
}

const isWindows = ref(false)

onMounted(() => {
  isWindows.value = getOS() === 'Windows'
  checkWindowsActiveInfo()
})
</script>

<template>
  <div>
    <n-alert v-if="!isWindows" type="warning">请在 Windows 下使用本功能</n-alert>
    <template v-else>
      <n-card>
        <n-alert class="mb-[15px]" type="info">请确认本应用使用管理员权限打开</n-alert>
        <n-text>
          <span v-if="activeState > 1">
            <span :class="textColor">
              {{ dayjs.unix(activeState).format('YYYY-MM-DD') }}
            </span>
            到期
          </span>
          <span v-else-if="activeState === 1" class="text-green-500">已永久激活</span>
          <span v-else class="text-red-500">未激活</span>
        </n-text>
      </n-card>
      <n-button class="mt-[15px]" type="primary" @click="handleClick">激活</n-button>
    </template>
  </div>
</template>
