<script lang="ts" setup>
import {
  useAppWindowOperation,
  useSystemTheme,
  useToggleSettingsView,
  useUpdateThemeVariables
} from './logic'
import {
  Sunny,
  Moon,
  SettingsOutline,
  Close,
  DocumentOutline,
  SearchOutline,
  CloudDownloadOutline,
  DesktopOutline,
  EyeOutline,
  GlobeOutline,
  ListOutline,
  MusicalNotesOutline,
  WalletOutline,
  ColorPaletteOutline,
  ShuffleOutline,
  ContrastOutline
} from '@vicons/ionicons5'
import { MinimizeRound } from '@vicons/material'
import { Maximize20Regular } from '@vicons/fluent'
import { getName } from '@tauri-apps/api/app'
import { isDevelopment } from '@/utils/development'
import { useRouterStore } from '@/stores/router'

const router = useRouter()
const appName = ref('')
const routerStore = useRouterStore()

onMounted(async () => {
  appName.value = await getName()
  if (isDevelopment) {
    appName.value += '（Dev）'
  }
  await routerStore.$ready?.waitForReady()
  router.push(routerStore.currentRoutePath)
})

const navItems = [
  { path: '/readFile', title: '文件读取', icon: DocumentOutline },
  { path: '/fileSearch', title: '文件搜索', icon: SearchOutline },
  { path: '/download', title: '下载管理', icon: CloudDownloadOutline },
  { path: '/windowsActivatiion', title: 'Windows 激活', icon: DesktopOutline },
  { path: '/eyeProtection', title: '护眼工具', icon: EyeOutline },
  { path: '/translator', title: '翻译工具', icon: GlobeOutline },
  { path: '/todo', title: '待办事项', icon: ListOutline },
  { path: '/musicPlayer', title: '音乐播放器', icon: MusicalNotesOutline },
  { path: '/accounting', title: '记账工具', icon: WalletOutline },
  { path: '/canvasBoard', title: '画板', icon: ColorPaletteOutline },
  { path: '/randomPicker', title: '随机选择', icon: ShuffleOutline }
]

watch(
  () => router.currentRoute.value.path,
  () => {
    routerStore.currentRoutePath = router.currentRoute.value.path
  }
)

function disableContextmenu(ev: MouseEvent) {
  if (!import.meta.env.DEV) {
    ev.preventDefault()
  }
}

const { isDark, themeAutoFollow, handleChangeTheme, handleChangeThemeState } = useSystemTheme()

useUpdateThemeVariables()

const { openSettings, toggleSettingsView } = useToggleSettingsView()
const { exitApp, handleMaximize, handleMinimize } = useAppWindowOperation()
</script>

<template>
  <div class="flex flex-col size-full overflow-hidden" @contextmenu="disableContextmenu">
    <!-- 标题栏 -->
    <header class="titlebar select-none shrink-0" data-tauri-drag-region>
      <div class="flex items-center gap-2 h-full pl-3" data-tauri-drag-region>
        <div class="titlebar-dot" data-tauri-drag-region></div>
        <span class="text-[13px] font-medium text-[--textColor2]" data-tauri-drag-region>
          {{ appName }}
        </span>
      </div>
      <div class="flex h-full">
        <button class="wc-btn" aria-label="最小化" @click="handleMinimize">
          <n-icon size="16"><MinimizeRound /></n-icon>
        </button>
        <button class="wc-btn" aria-label="最大化" @click="handleMaximize">
          <n-icon size="14"><Maximize20Regular /></n-icon>
        </button>
        <button class="wc-btn wc-close" aria-label="关闭" @click="exitApp">
          <n-icon size="16"><Close /></n-icon>
        </button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧导航栏 -->
      <nav class="sidebar shrink-0">
        <div class="nav-list">
          <n-tooltip
            v-for="item in navItems"
            :key="item.path"
            placement="right"
            :show-arrow="false">
            <template #trigger>
              <button
                class="nav-btn"
                :class="{ active: routerStore.currentRoutePath === item.path }"
                @click="router.push(item.path)">
                <n-icon size="18"><component :is="item.icon" /></n-icon>
              </button>
            </template>
            {{ item.title }}
          </n-tooltip>
        </div>

        <div class="sidebar-footer">
          <n-tooltip placement="right" :show-arrow="false">
            <template #trigger>
              <button
                class="nav-btn"
                :class="{ muted: themeAutoFollow }"
                :disabled="themeAutoFollow"
                @click="handleChangeTheme">
                <n-icon size="18"><Moon v-if="isDark" /><Sunny v-else /></n-icon>
              </button>
            </template>
            {{ themeAutoFollow ? '跟随系统（手动切换已禁用）' : isDark ? '深色模式' : '浅色模式' }}
          </n-tooltip>

          <n-tooltip placement="right" :show-arrow="false">
            <template #trigger>
              <button
                class="nav-btn"
                :class="{ active: themeAutoFollow }"
                @click="handleChangeThemeState">
                <n-icon size="18"><ContrastOutline /></n-icon>
              </button>
            </template>
            {{ themeAutoFollow ? '跟随系统（点击关闭）' : '跟随系统主题' }}
          </n-tooltip>

          <n-tooltip placement="right" :show-arrow="false">
            <template #trigger>
              <button class="nav-btn" :class="{ active: openSettings }" @click="toggleSettingsView">
                <n-icon size="18"><SettingsOutline /></n-icon>
              </button>
            </template>
            设置
          </n-tooltip>
        </div>
      </nav>

      <!-- 内容区域 -->
      <div class="flex-1 relative overflow-hidden bg-[--actionColor]">
        <div
          v-show="openSettings"
          class="absolute inset-0 z-10 overflow-auto p-4 bg-[--actionColor]">
          <app-settings :open="openSettings" />
        </div>
        <router-view
          v-show="!openSettings"
          class="w-full h-full p-[5px] box-border overflow-auto"
          v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" class="size-full" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.titlebar {
  height: 38px;
  border-bottom: 1px solid var(--borderColor);
  background-color: var(--bodyColor);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .titlebar-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--primaryColor);
    opacity: 0.85;
    flex-shrink: 0;
  }

  .wc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--textColor2);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      background-color: var(--hoverColor, rgba(128, 128, 128, 0.12));
    }
  }

  .wc-close:hover {
    background-color: #c42b1c;
    color: #fff;
  }
}

.sidebar {
  width: 56px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--borderColor);
  background-color: var(--bodyColor);
  overflow: hidden;

  .nav-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    gap: 2px;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    gap: 2px;
    border-top: 1px solid var(--borderColor);
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--textColor2);
    cursor: pointer;
    margin: 0 auto;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      background-color: var(--hoverColor, rgba(128, 128, 128, 0.12));
      color: var(--textColorBase);
    }

    &.active {
      background-color: var(--primaryColor);
      color: #fff;
    }

    &.muted {
      opacity: 0.38;
      cursor: not-allowed;

      &:hover {
        background-color: transparent;
        color: var(--textColor2);
        opacity: 0.38;
      }
    }
  }
}
</style>
