<script lang="ts" setup>
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { useSystemTheme, useUpdateThemeVariables } from './logic'
import { Sunny, Moon } from '@vicons/ionicons5'

const router = useRouter()

const activePath = ref('/')

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
</script>

<template>
  <div
    class="flex flex-col size-full box-border overflow-x-hidden overflow-y-auto"
    @contextmenu="disableContextmenu"
  >
    <header class="w-full h-[45px] p-[5px_5px_0] bg-[--bodyColor] flex items-center">
      <label class="flex items-center mr-[15px] text-[--textColorBase]">
        <span>当前页面功能：</span>
        <n-select
          class="inline-block w-[150px]"
          :options="options"
          v-model:value="activePath"
          @update:value="changeSelect"
        />
      </label>
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
    </header>
    <router-view
      class="w-full h-[calc(100%-45px)] p-[5px] box-border bg-[--actionColor]"
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
