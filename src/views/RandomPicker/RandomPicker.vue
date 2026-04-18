<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import PickArea from './components/PickArea.vue'
import PickHistory from './components/PickHistory.vue'
import ExportDialog from './components/ExportDialog.vue'
import OptionList from './components/OptionList.vue'
import { DownloadOutline, TimeOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { history } = storeToRefs(store)

const showExport = ref(false)
const showHistory = ref(false)

const handleExport = () => {
  showExport.value = true
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div
      class="px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0 flex items-center justify-between">
      <h2 class="text-lg font-semibold">随机选择</h2>
      <div class="flex items-center gap-2">
        <n-button quaternary size="small" @click="toggleHistory">
          <template #icon>
            <n-icon><TimeOutline /></n-icon>
          </template>
          历史
          <n-badge v-if="history.length > 0" :value="history.length" :max="99" class="ml-1" />
        </n-button>
        <n-button quaternary size="small" @click="handleExport">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          导出
        </n-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧：候选项管理 + 选择区域 -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- 候选项列表 -->
        <div class="flex-1 overflow-hidden border-r border-[var(--border-color)]">
          <OptionList />
        </div>

        <!-- 选择区域 -->
        <div class="border-t border-[var(--border-color)]">
          <PickArea />
        </div>
      </div>

      <!-- 右侧：历史记录（可折叠） -->
      <div
        class="transition-all duration-300 overflow-hidden flex flex-col"
        :class="showHistory ? 'w-80' : 'w-0'">
        <PickHistory v-if="showHistory" />
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog v-model:show="showExport" />
  </div>
</template>
