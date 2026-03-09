<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import { TimeOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { history } = storeToRefs(store)

// 撤销最近选择
const handleUndo = () => {
  const result = store.undoLastPick()
  if (result) {
    // 可以显示提示
  }
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
    normal: '普通选择',
    sequential: '顺序选择',
    weighted: '权重选择'
  }
  return modeMap[mode] || mode
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 头部操作栏 -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-gray-600">选择历史 ({{ history.length }})</span>
      <div class="flex gap-2">
        <n-button v-if="history.length > 0" size="small" @click="handleUndo"> 撤销最近 </n-button>
        <n-button v-if="history.length > 0" size="small" type="error" @click="handleClear">
          清空
        </n-button>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="flex-1 overflow-auto">
      <n-list v-if="history.length > 0" size="small">
        <n-list-item v-for="item in history" :key="item.id">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <n-tag size="small" type="info">
                {{ getModeName(item.mode) }}
              </n-tag>
              <n-tag v-if="item.target" size="small">
                {{ item.target.name }}
              </n-tag>
              <span class="text-xs text-gray-400">
                {{ formatTime(item.timestamp) }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1">
              <n-tag
                v-for="selected in item.selected"
                :key="selected.id"
                type="success"
                size="small">
                {{ selected.name }}
              </n-tag>
            </div>
          </div>
        </n-list-item>
      </n-list>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
        <n-icon size="48" :depth="3">
          <TimeOutline />
        </n-icon>
        <span class="mt-2">暂无选择记录</span>
      </div>
    </div>
  </div>
</template>
