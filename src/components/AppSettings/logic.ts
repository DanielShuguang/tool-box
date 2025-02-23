import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export function useGenerateTrayIcon(enableTrayIcon: Ref<boolean>) {
  const systemTray = shallowRef<TrayIcon | null>(null)

  const menuItems = [
    {
      text: '显示界面',
      action: async () => {
        const main = await WebviewWindow.getByLabel('main')
        main?.show()
      }
    },
    {
      text: '退出应用',
      action: async () => {
        if (systemTray.value) {
          await TrayIcon.removeById(systemTray.value?.id)
        }
        const wins = await WebviewWindow.getAll()
        wins.forEach(el => el.close())
      }
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
    const menu = await getMenu()
    systemTray.value = await TrayIcon.new({ tooltip: 'Tool-box 挂机中', menu })
    enableTrayIcon.value = true
  }

  async function toggleTrayIcon() {
    if (systemTray.value) {
      await TrayIcon.removeById(systemTray.value.id)
      systemTray.value = null
      enableTrayIcon.value = false
    } else {
      init()
    }
  }

  onMounted(() => {
    if (enableTrayIcon.value) {
      init()
    }
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
