<script lang="ts" setup>
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import {
  useAppWindowOperation,
  useSystemTheme,
  useToggleSettingsView,
  useUpdateThemeVariables
} from './logic'
import { Sunny, Moon, SettingsOutline, Close } from '@vicons/ionicons5'
import { MinimizeRound } from '@vicons/material'
import { Maximize20Regular } from '@vicons/fluent'
import { getName } from '@tauri-apps/api/app'
import { Motion, AnimatePresence } from 'motion-v'

const router = useRouter()
const appName = ref('')
const activePath = ref('/')

onMounted(async () => {
  appName.value = await getName()
})

const options = computed(() =>
  router
    .getRoutes()
    .map<SelectMixedOption>(r => ({
      value: r.path,
      label: r.meta.title as string
    }))
    .filter(r => r.label)
)

function changeSelect(v: string) {
  router.push(v)
}

watchEffect(() => {
  activePath.value = router.currentRoute.value.path
})

function disableContextmenu(ev: MouseEvent) {
  if (!import.meta.env.DEV) {
    ev.preventDefault()
  }
}

const { isDark, isAuto, handleChangeTheme, handleChangeThemeState } = useSystemTheme()

useUpdateThemeVariables(isDark)

const { openSettings, toggleSettingsView } = useToggleSettingsView()

const { exitApp, handleMaximize, handleMinimize } = useAppWindowOperation()
</script>

<template>
  <div
    class="flex flex-col size-full box-border overflow-x-hidden overflow-y-auto relative"
    @contextmenu="disableContextmenu"
  >
    <header
      class="w-full flex justify-between border-b-(1px solid #eee) select-none"
      data-tauri-drag-region
    >
      <div class="flex items-center justify-center px-[10px]" data-tauri-drag-region>
        <div data-tauri-drag-region>{{ appName }}</div>
      </div>
      <div class="flex justify-end items-center">
        <n-button @click="handleMinimize">
          <n-icon size="18">
            <MinimizeRound />
          </n-icon>
        </n-button>
        <n-button @click="handleMaximize">
          <n-icon size="18">
            <Maximize20Regular />
          </n-icon>
        </n-button>
        <n-button type="error" @click="exitApp">
          <n-icon size="18">
            <Close />
          </n-icon>
        </n-button>
      </div>
    </header>
    <div class="w-full h-[50px] px-[5px] bg-[--bodyColor] box-border flex items-center relative">
      <AnimatePresence>
        <Motion
          as="label"
          v-show="!openSettings"
          class="flex items-center mr-[15px] text-[--textColorBase] overflow-hidden"
          :transition="{ duration: 0.3 }"
          :animate="{ width: 'auto', opacity: 1 }"
          :exit="{ width: 0, opacity: 0 }"
        >
          <span class="text-nowrap">当前页面功能：</span>
          <n-select
            class="inline-block w-[150px]"
            :options="options"
            v-model:value="activePath"
            @update:value="changeSelect"
          />
        </Motion>
      </AnimatePresence>
      <n-tooltip>
        <template #trigger>
          <n-button :disabled="isAuto" @click="handleChangeTheme">
            <n-icon size="14">
              <Moon v-if="isDark" />
              <Sunny v-else />
            </n-icon>
          </n-button>
        </template>
        <span v-if="isAuto">跟随系统</span>
        <span v-else>
          {{ isDark ? '深色' : '浅色' }}
        </span>
      </n-tooltip>
      <n-button :type="isAuto ? 'success' : 'default'" @click="handleChangeThemeState">
        跟随系统
      </n-button>

      <n-tooltip>
        <template #trigger>
          <n-icon
            size="17"
            class="absolute right-[20px] cursor-pointer"
            @click="toggleSettingsView"
          >
            <SettingsOutline />
          </n-icon>
        </template>
        打开/关闭设置
      </n-tooltip>
    </div>
    <transition name="fade" mode="out-in">
      <app-settings
        :open="openSettings"
        class="w-full h-[calc(100%-95px)] p-[5px] box-border bg-[--actionColor] absolute top-[95px] left-0 z-10"
      />
    </transition>
    <router-view
      v-if="!openSettings"
      class="w-full h-[calc(100%-95px)] p-[5px] box-border bg-[--actionColor] overflow-auto"
      v-slot="{ Component }"
    >
      <transition name="fade" mode="out-in">
        <keep-alive>
          <component :is="Component" class="size-full"></component>
        </keep-alive>
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
