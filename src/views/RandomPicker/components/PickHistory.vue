<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import { TimeOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { history } = storeToRefs(store)

// 撤销最近选择
const handleUndo = () => {
  store.undoLastPick()
}

// 清空历史
const handleClear = () => {
  store.clearHistory()
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取模式名称
const getModeName = (mode: string): string => {
  const modeMap: Record<string, string> = {
    normal: '普通',
    sequential: '顺序',
    weighted: '权重'
  }
  return modeMap[mode] || mode
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 头部操作栏 -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-600">选择历史 ({{ history.length }})</span>
        <div v-if="history.length > 0" class="flex gap-1">
          <n-button size="tiny" @click="handleUndo">撤销</n-button>
          <n-button size="tiny" type="error" @click="handleClear">清空</n-button>
        </div>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="flex-1 overflow-auto">
      <div v-if="history.length > 0" class="p-2">
        <div
          v-for="item in history"
          :key="item.id"
          class="p-3 rounded-lg mb-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
          <!-- 时间戳和模式 -->
          <div class="flex items-center gap-2 mb-2">
            <n-tag size="small" type="info">
              {{ getModeName(item.mode) }}
            </n-tag>
            <n-tag v-if="item.target" size="small">
              {{ item.target.name }}
            </n-tag>
            <span class="text-xs text-gray-400 flex-1">
              {{ formatTime(item.timestamp) }}
            </span>
          </div>
          <!-- 选中的结果 -->
          <div class="flex flex-wrap gap-1">
            <n-tag v-for="selected in item.selected" :key="selected.id" type="success" size="small">
              {{ selected.name }}
            </n-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
        <n-icon size="48" :depth="3">
          <TimeOutline />
        </n-icon>
        <span class="mt-2 text-sm">暂无选择记录</span>
      </div>
    </div>
  </div>
</template>
