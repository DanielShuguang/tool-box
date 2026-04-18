<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'

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
  const date = new Date(timestamp)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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
  <div class="flex flex-col h-full w-80 border-l border-[var(--border-color)]">
    <!-- 头部操作栏 -->
    <div class="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">选择历史</span>
        <n-tag v-if="history.length > 0" size="small" round>{{ history.length }}</n-tag>
      </div>
      <div v-if="history.length > 0" class="flex gap-1">
        <n-button size="tiny" quaternary type="warning" @click="handleUndo">撤销</n-button>
        <n-button size="tiny" quaternary type="error" @click="handleClear">清空</n-button>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="flex-1 overflow-auto">
      <div v-if="history.length > 0" class="p-3">
        <div
          v-for="item in history"
          :key="item.id"
          class="p-3 rounded-lg mb-2 bg-[var(--hover-color)]">
          <!-- 时间戳和模式 -->
          <div class="flex items-center gap-2 mb-2">
            <n-tag size="small" type="info">
              {{ getModeName(item.mode) }}
            </n-tag>
            <n-tag v-if="item.target" size="small">
              {{ item.target.name }}
            </n-tag>
            <span class="text-xs text-[var(--text-color3)] flex-1">
              {{ formatTime(item.timestamp) }}
            </span>
          </div>
          <!-- 选中的结果 -->
          <div class="flex flex-wrap gap-1">
            <n-tag
              v-for="selected in item.selected"
              :key="selected.id"
              type="success"
              size="small"
              round>
              {{ selected.name }}
            </n-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-[var(--text-color3)]">
        <n-empty description="暂无选择记录" size="small" />
      </div>
    </div>
  </div>
</template>
