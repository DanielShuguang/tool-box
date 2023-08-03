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
  <div class="layout" @contextmenu="disableContextmenu">
    <header class="layout-header">
      <label class="select-label">
        <span>当前页面功能：</span>
        <NSelect
          class="select-page"
          :options="options"
          v-model:value="activePath"
          @update:value="changeSelect"
        />
      </label>
    </header>
    <RouterView class="page-content" v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <keep-alive>
          <component :is="Component"></component>
        </keep-alive>
      </transition>
    </RouterView>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden auto;
}

.layout-header {
  width: 100%;
  height: 45px;
  padding: 5px 5px 0;
  background: #fff;
}

.select-label {
  display: flex;
  align-items: center;
}

.select-page {
  display: inline-block;
  width: 150px;
}

.page-content {
  flex: 1;
  width: 100%;
  padding: 5px;
  background: rgb(241, 242, 243);
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
