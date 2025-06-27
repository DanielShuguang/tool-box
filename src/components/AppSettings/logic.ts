import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, MenuItem, MenuItemOptions } from '@tauri-apps/api/menu'
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'
import { getAllWindows, getCurrentWindow } from '@tauri-apps/api/window'
import { useEmitter } from '@/utils/event'
import { isDevelopment } from '@/utils/development'
import { defaultWindowIcon } from '@tauri-apps/api/app'
import { Nullable } from '@/types/common'

export async function handleShowMainWindow() {
  const main = getCurrentWindow()
  const isVisible = await main.isVisible()
  if (!isVisible) {
    await main.show() // 显示窗口
  }
  main.center() // 居中
  main.setFocus() // 聚焦窗口
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

  useEmitter('close-window', () => {
    if (enableTrayIcon.value) {
      // 如果启用了托盘图标，则隐藏窗口
      const win = getCurrentWindow()
      win.hide()
    } else {
      // 否则直接关闭应用
      handleExitApp()
    }
  })

  onMounted(() => {
    if (isDevelopment) return

    if (enableTrayIcon.value) {
      init()
    }
  })

  onUnmounted(() => {
    systemTray.value?.close()
  })

  return { toggleTrayIcon }
}

export function useAppAutostart(autostart: Ref<boolean>) {
  const message = useMessage()

  async function toggleAutostart() {
    try {
      autostart.value ? await enable() : await disable()
      autostart.value = await isEnabled()
    } catch (error) {
      message.error(error as any)
    }
  }

  onMounted(async () => {
    autostart.value = await isEnabled()
  })

  return { toggleAutostart }
}
