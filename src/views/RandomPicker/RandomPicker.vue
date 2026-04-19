<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import PickArea from './components/PickArea.vue'
import PickHistory from './components/PickHistory.vue'
import ExportDialog from './components/ExportDialog.vue'
import OptionList from './components/OptionList.vue'
import { DownloadOutline, TimeOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { history, options } = storeToRefs(store)

const showExport = ref(false)
const showHistory = ref(false)

const handleExport = () => {
  showExport.value = true
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

// 计算统计信息
const stats = computed(() => {
  const total = options.value.length
  const available = options.value.filter(opt => !opt.disabled).length
  const disabled = total - available
  return { total, available, disabled }
})
</script>

<template>
  <div class="w-full h-full overflow-auto">
    <!-- 主内容区域 -->
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 页面标题区 -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-[var(--text-color1)] mb-2">随机选择器</h1>
        <p class="text-sm text-[var(--text-color3)]">快速、公平、随机 - 告别选择困难</p>
      </header>

      <!-- 统计卡片区 -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div
          class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div class="text-4xl font-bold mb-1">{{ stats.total }}</div>
          <div class="text-sm opacity-90">总候选项</div>
        </div>
        <div
          class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
          <div class="text-4xl font-bold mb-1">{{ stats.available }}</div>
          <div class="text-sm opacity-90">可用数量</div>
        </div>
        <div
          class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div class="text-4xl font-bold mb-1">{{ stats.disabled }}</div>
          <div class="text-sm opacity-90">已禁用</div>
        </div>
      </div>

      <!-- 主要功能区 -->
      <div class="grid grid-cols-12 gap-6">
        <!-- 候选项管理区 -->
        <div
          class="col-span-8 bg-white rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
          <OptionList />
        </div>

        <!-- 选择操作区 -->
        <div class="col-span-4 flex flex-col gap-6">
          <div
            class="bg-white rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            <PickArea />
          </div>

          <!-- 快捷操作卡片 -->
          <div class="bg-white rounded-2xl shadow-sm border border-[var(--border-color)] p-4">
            <div class="text-sm font-medium text-[var(--text-color2)] mb-3">快捷操作</div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <n-button block secondary @click="toggleHistory" class="flex-1">
                  <template #icon>
                    <n-icon><TimeOutline /></n-icon>
                  </template>
                  查看历史
                </n-button>
                <n-badge v-if="history.length > 0" :value="history.length" :max="99" class="mr-2" />
              </div>
              <n-button block secondary @click="handleExport">
                <template #icon>
                  <n-icon><DownloadOutline /></n-icon>
                </template>
                导出结果
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史记录面板 -->
      <transition name="slide-up">
        <div
          v-if="showHistory"
          class="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50">
          <PickHistory @close="toggleHistory" />
        </div>
      </transition>

      <!-- 导出对话框 -->
      <ExportDialog v-model:show="showExport" />
    </div>
  </div>
</template>

<style scoped>
/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
