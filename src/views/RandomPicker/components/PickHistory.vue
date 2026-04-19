<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import { CloseOutline } from '@vicons/ionicons5'

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

// 关闭面板
const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="flex flex-col h-[600px]">
    <!-- 头部 -->
    <div class="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
      <div class="flex items-center gap-3">
        <span class="text-base font-semibold text-[var(--text-color1)]">选择历史</span>
        <n-tag v-if="history.length > 0" size="small" round type="info">
          {{ history.length }} 条记录
        </n-tag>
      </div>
      <n-button quaternary circle size="small" @click="handleClose">
        <template #icon>
          <n-icon><CloseOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <!-- 操作栏 -->
    <div v-if="history.length > 0" class="px-5 py-3 border-b border-[var(--border-color)] bg-gray-50/50">
      <div class="flex gap-2">
        <n-button size="small" @click="handleUndo" class="flex-1">
          <template #icon>
            <n-icon><UndoOutline /></n-icon>
          </template>
          撤销
        </n-button>
        <n-button size="small" type="error" @click="handleClear" ghost>
          清空全部
        </n-button>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="flex-1 overflow-auto">
      <div v-if="history.length > 0" class="p-4">
        <transition-group name="list" tag="div" class="flex flex-col gap-3">
          <div
            v-for="item in history"
            :key="item.id"
            class="p-4 rounded-xl bg-white border border-[var(--border-color)] hover:border-[var(--primary-color)] transition-all duration-200 hover:shadow-sm">
            <!-- 头部信息 -->
            <div class="flex items-center gap-2 mb-3">
              <n-tag size="small" type="info" round>
                {{ getModeName(item.mode) }}
              </n-tag>
              <n-tag v-if="item.target" size="small" round>
                {{ item.target.name }}
              </n-tag>
              <span class="text-xs text-[var(--text-color3)] ml-auto">
                {{ formatTime(item.timestamp) }}
              </span>
            </div>
            <!-- 选中的结果 -->
            <div class="flex flex-wrap gap-2">
              <n-tag
                v-for="selected in item.selected"
                :key="selected.id"
                type="success"
                size="medium"
                round
                class="font-medium">
                {{ selected.name }}
              </n-tag>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-[var(--text-color3)] p-8">
        <n-icon size="48" class="mb-3 opacity-40">
          <TimeOutline />
        </n-icon>
        <n-empty description="暂无选择记录" size="small" />
        <p class="text-xs text-[var(--text-color3)] mt-2">开始选择后将在此显示记录</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
