<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { PickMode } from '@/views/RandomPicker/types/picker'
import { ShuffleOutline, RefreshOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { mode, pickCount, config, availableCount, canPick, selectedCount, options } =
  storeToRefs(store)

// 选择模式选项
const modeOptions: { label: string; value: PickMode }[] = [
  { label: '普通', value: 'normal' },
  { label: '顺序', value: 'sequential' },
  { label: '权重', value: 'weighted' }
]

// 正在选择中
const isPicking = ref(false)
// 当前选中的结果
const pickResult = ref<typeof options.value>([])
// 显示结果
const showResult = ref(false)

// 执行选择
const handlePick = async () => {
  if (!canPick.value) return

  isPicking.value = true
  pickResult.value = []

  // 模拟滚动动画
  const available = store.getAvailableOptions()
  const animationDuration = 1200
  const intervalTime = 80
  const iterations = animationDuration / intervalTime

  for (let i = 0; i < iterations; i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    pickResult.value = [available[randomIndex]]
    await new Promise(resolve => setTimeout(resolve, intervalTime))
  }

  // 执行实际选择
  pickResult.value = store.performPick()
  isPicking.value = false
  showResult.value = true
}

// 关闭结果
const closeResult = () => {
  showResult.value = false
}

// 重置选择
const handleReset = () => {
  store.resetSelected()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 模式选择和配置 -->
    <div class="px-4 py-3 flex items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="text-sm text-[var(--text-color2)]">选择模式</span>
        <n-radio-group v-model:value="mode" size="small">
          <n-radio-button v-for="item in modeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio-button>
        </n-radio-group>
      </div>

      <!-- 普通选择和权重选择时显示数量配置 -->
      <div v-if="mode !== 'sequential'" class="flex items-center gap-2">
        <span class="text-sm text-[var(--text-color2)]">数量</span>
        <n-input-number
          v-model:value="pickCount"
          :min="1"
          :max="availableCount"
          size="small"
          class="w-20" />
      </div>

      <!-- 剔除配置 -->
      <div class="flex items-center gap-2">
        <n-switch v-model:value="config.removeSelected" size="small" />
        <span class="text-sm text-[var(--text-color2)]">选中后移除</span>
      </div>

      <div class="flex-1" />

      <!-- 重置按钮 -->
      <n-button
        v-if="selectedCount > 0"
        quaternary
        type="warning"
        size="small"
        @click="handleReset">
        <template #icon>
          <n-icon size="14"><RefreshOutline /></n-icon>
        </template>
        重置
      </n-button>
    </div>

    <!-- 选择区域 -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 pb-4">
      <!-- 可选取数量提示 -->
      <div class="mb-4 text-center">
        <div class="text-4xl font-bold text-[var(--primary-color)] mb-1">
          {{ availableCount }}
        </div>
        <div class="text-sm text-[var(--text-color2)]">可选取</div>
      </div>

      <!-- 选择按钮 -->
      <div
        class="relative flex flex-col items-center justify-center w-28 h-28 rounded-full cursor-pointer transition-all duration-300 select-none"
        :class="[
          canPick && !isPicking
            ? 'bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] hover:scale-105 active:scale-95 shadow-lg shadow-[var(--primary-color)]/30'
            : 'bg-[var(--border-color)] cursor-not-allowed'
        ]"
        role="button"
        @click="handlePick">
        <n-icon v-if="!isPicking" size="36" class="text-gray-700">
          <ShuffleOutline />
        </n-icon>
        <n-spin v-else class="text-gray-700" />
        <span class="mt-1 text-xs font-medium text-gray-700">
          {{ isPicking ? '选择中...' : '开始选择' }}
        </span>
      </div>
    </div>

    <!-- 结果展示 -->
    <n-modal
      v-model:show="showResult"
      preset="card"
      title="选择结果"
      :style="{ width: '360px' }"
      @close="closeResult">
      <div class="flex flex-col gap-2">
        <n-tag
          v-for="item in pickResult"
          :key="item.id"
          type="success"
          size="large"
          round
          class="justify-center py-2 text-base">
          {{ item.name }}
        </n-tag>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="closeResult">关闭</n-button>
          <n-button type="primary" @click="handlePick">再选一次</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
