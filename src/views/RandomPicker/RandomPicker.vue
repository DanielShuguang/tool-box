<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import OptionList from './components/OptionList.vue'
import PickArea from './components/PickArea.vue'
import PickHistory from './components/PickHistory.vue'
import TargetConfig from './components/TargetConfig.vue'
import ExportDialog from './components/ExportDialog.vue'
import { DownloadOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { mode } = storeToRefs(store)

const showExport = ref(false)

// 处理导出
const handleExport = () => {
  showExport.value = true
}
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">随机选择</h2>
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
      <!-- 左侧：候选项列表 -->
      <div class="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <OptionList />
      </div>

      <!-- 中间：选择区域 -->
      <div class="flex-1 border-r border-gray-200 overflow-hidden flex flex-col">
        <!-- 顺序选择模式时显示目标配置 -->
        <div v-if="mode === 'sequential'" class="border-b border-gray-200">
          <TargetConfig />
        </div>
        <!-- 选择区域 -->
        <div class="flex-1 overflow-hidden">
          <PickArea />
        </div>
      </div>

      <!-- 右侧：选择历史 -->
      <div class="w-1/4 overflow-hidden flex flex-col">
        <PickHistory />
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog v-model:show="showExport" />
  </div>
</template>
