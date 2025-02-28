import { platform } from '@tauri-apps/plugin-os'
import { Command } from '@tauri-apps/plugin-shell'
import { RemovableRef } from '@vueuse/core'
import dayjs from 'dayjs'

const terminalScript = 'powershell'
const scriptRunner = 'cscript //nologo C:/Windows/System32/slmgr.vbs'
const activeCmds = ['/ipk NPPR9-FWDCX-D2C8J-H872K-2YT43', '/skms kms.0t.net.cn', '/ato']

export function useActivationInfo() {
  // 剩余不同时间有不同颜色
  const colors = ['text-[--errorColor]', 'text-[--warningColor]', 'text-[--successColor]']

  const activeState = useLocalStorage('windows-activation', 0)

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

  return { activeState, textColor }
}

export function useCheckCurrentActivation(activeState: RemovableRef<number>) {
  const message = useMessage()
  const isWindows = ref(false)

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

  onMounted(() => {
    isWindows.value = platform() === 'windows'
    checkWindowsActiveInfo()
  })

  return { isWindows, checkWindowsActiveInfo }
}

export function useActivateWindows(activeState: RemovableRef<number>) {
  const message = useMessage()
  const loading = ref(false)

  async function handleClick() {
    const isSucceed = await handleActive()
    if (!isSucceed) return

    activeState.value = dayjs().add(180, 'days').unix()
  }

  async function handleActive() {
    loading.value = true
    try {
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

      message.success('激活成功')
      return true
    } catch (error) {
      message.error(String(error))
    } finally {
      loading.value = false
    }
  }

  return { loading, handleClick }
}

export const activationPrograms = [
  {
    title: 'Microsoft Activation Scripts (MAS)',
    description:
      '开源 Windows 和 Office 激活程序，具有 HWID、Ohook、TSforge、KMS38 和在线 KMS 激活方法，以及高级故障排除功能。',
    link: 'https://github.com/massgravel/Microsoft-Activation-Scripts'
  },
  {
    title: '云萌',
    description: '一款使用CSharp编写的 Windows 10 和 Windows 11 数字权利激活工具。',
    link: 'https://cmwtat.cloudmoe.com/cn.html'
  }
]
