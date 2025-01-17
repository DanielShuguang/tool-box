<script lang="ts" setup>
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'

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
</script>

<template>
  <div
    class="flex flex-col size-full box-border overflow-x-hidden overflow-y-auto"
    @contextmenu="disableContextmenu"
  >
    <header class="w-full h-[45px] p-[5px_5px_0] bg-[#fff]">
      <label class="flex items-center">
        <span>当前页面功能：</span>
        <n-select
          class="inline-block w-[150px]"
          :options="options"
          v-model:value="activePath"
          @update:value="changeSelect"
        />
      </label>
    </header>
    <router-view
      class="w-full h-[calc(100%-45px)] p-[5px] bg-[rgb(241,242,243)] box-border"
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
