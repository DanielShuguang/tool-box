<script lang="ts" setup>
import dayjs from 'dayjs'
import { Command } from '@tauri-apps/plugin-shell'

const message = useMessage()
const activeState = useLocalStorage('windows-activation', 0)

// 剩余不同时间有不同颜色
const colors = ['text-red-500', 'text-yellow-500', 'text-green-500']

const textColor = computed(() => {
  const diff = dayjs().diff(dayjs.unix(activeState.value), 'days')
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
  await handleActive()
  activeState.value = dayjs().add(180, 'days').unix()
}

const activeCmds = [
  'slmgr /ipk NPPR9-FWDCX-D2C8J-H872K-2YT43',
  'slmgr /skms kms.03k.org',
  'slmgr /ato'
]

async function handleActive() {
  for (const element of activeCmds) {
    await Command.create('cscript', ['C:\\Windows\\System32\\slmgr.vbs', ...element.split(' ')], {
      encoding: 'utf-8'
    }).execute()
  }
}

async function checkWindowsActiveInfo() {
  try {
    const { stdout } = await Command.create(
      'cscript',
      ['C:\\Windows\\System32\\slmgr.vbs', '/xpr'],
      { encoding: 'utf-8' }
    ).execute()
    const dateReg = /\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/
    const expireDate = dateReg.exec(stdout)
    if (expireDate?.[0]) {
      activeState.value = dayjs(expireDate[0]).unix()
    }
  } catch (error) {
    message.error(`激活失败: ${error}`)
  }
}

onMounted(() => {
  checkWindowsActiveInfo()
})
</script>

<template>
  <div>
    <n-space>
      <n-text>
        <span v-if="activeState">
          <span :class="textColor">
            {{ dayjs.unix(activeState).format('YYYY-MM-DD') }}
          </span>
          到期
        </span>
        <span v-else>未激活</span>
      </n-text>
    </n-space>
    <n-button type="primary" @click="handleClick">激活</n-button>
  </div>
</template>
