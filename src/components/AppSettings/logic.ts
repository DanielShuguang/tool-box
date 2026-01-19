import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, MenuItem, MenuItemOptions } from '@tauri-apps/api/menu'
import { getAllWindows, getCurrentWindow } from '@tauri-apps/api/window'
import { useEmitter } from '@/utils/event'
import { isDevelopment } from '@/utils/development'
import { defaultWindowIcon } from '@tauri-apps/api/app'
import { BackendRespCode, Nullable } from '@/types/common'
import { isAutoStartEnabled, setAutoStart } from '@/backend-channel/autostart'
import { getMatches } from '@tauri-apps/plugin-cli'
import mitt from 'mitt'

type SettingEventMap = {
  'close-window': void
}

export const settingEmitter = mitt<SettingEventMap>()

export async function handleShowMainWindow() {
  const main = getCurrentWindow()
  const isVisible = await main.isVisible()
  if (!isVisible) {
    await main.show() // 显示窗口
  }
  main.center() // 居中
  main.setFocus() // 聚焦窗口
}

// 检查是否带有 --hidden 参数启动
async function checkHiddenFlag() {
  const matches = await getMatches()
  const args = matches.args
  return args?.hidden.value === true
}

export function useGenerateTrayIcon(enableTrayIcon: Ref<boolean>) {
  const message = useMessage()
  const systemTray = shallowRef<Nullable<TrayIcon>>(null)

  async function handleExitApp() {
    if (systemTray.value) {
      await TrayIcon.removeById(systemTray.value.id)
    }
    const wins = await getAllWindows()
    wins.forEach(el => el.close())
  }

  const menuItems: MenuItemOptions[] = [
    {
      text: '显示界面',
      action: handleShowMainWindow
    },
    {
      text: '退出应用',
      action: handleExitApp
    }
  ]

  async function getMenu() {
    const items: MenuItem[] = []
    await Promise.allSettled(
      menuItems.map(async item => {
        items.push(
          await MenuItem.new({
            text: item.text,
            action: item.action
          })
        )
      })
    )
    const menu = await Menu.new({ items })
    return menu
  }

  async function init() {
    if (systemTray.value) return

    try {
      const menu = await getMenu()
      systemTray.value = await TrayIcon.new({
        id: 'daniel:tool-box',
        showMenuOnLeftClick: false,
        tooltip: 'Tool-box 挂机中',
        menu,
        icon: (await defaultWindowIcon()) || 'icons/icon.png',
        action: event => event.type === 'DoubleClick' && handleShowMainWindow()
      })
      enableTrayIcon.value = true
    } catch (error) {
      message.error(error as any)
    }
  }

  async function close() {
    await systemTray.value?.close()
    systemTray.value = null
    enableTrayIcon.value = false
  }

  function toggleTrayIcon() {
    if (systemTray.value) {
      close()
    } else {
      init()
    }
  }

  // 监听 enableTrayIcon 变化，确保托盘图标状态与设置一致
  watch(enableTrayIcon, async newValue => {
    if (isDevelopment) return

    if (newValue && !systemTray.value) {
      await init()
    } else if (!newValue && systemTray.value) {
      await close()
    }
  })

  useEmitter(settingEmitter, {
    event: 'close-window',
    handler: () => {
      if (enableTrayIcon.value) {
        // 如果启用了托盘图标，则隐藏窗口
        const win = getCurrentWindow()
        win.hide()
      } else {
        // 否则直接关闭应用
        handleExitApp()
      }
    }
  })

  onMounted(async () => {
    if (isDevelopment) return

    // 如果是通过开机自启动（带 --hidden 参数）启动，自动启用托盘图标
    const isHidden = await checkHiddenFlag()
    if (isHidden) {
      enableTrayIcon.value = true
      await init()
      // 隐藏主窗口
      const win = getCurrentWindow()
      await win.hide()
    } else if (enableTrayIcon.value) {
      await init()
    }
  })

  onUnmounted(() => {
    systemTray.value?.close()
  })

  return { toggleTrayIcon }
}

export function useAppAutostart(autostart: Ref<boolean>, onEnable: () => void) {
  const message = useMessage()

  async function checkAndUpdateAutostartStatus() {
    const status = await isAutoStartEnabled()
    if (status.code === BackendRespCode.SUCCESS) {
      autostart.value = status.data?.enabled ?? false
    } else {
      message.error(status.message)
    }
  }

  async function toggleAutostart() {
    const result = await setAutoStart(!autostart.value)
    if (result.code === BackendRespCode.SUCCESS) {
      await checkAndUpdateAutostartStatus()
    } else {
      message.error(result.message)
    }
  }

  watch(autostart, () => {
    if (autostart.value) {
      onEnable()
    }
  })

  onMounted(() => {
    checkAndUpdateAutostartStatus()
  })

  return { toggleAutostart }
}
