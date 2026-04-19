<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { PickMode } from '@/views/RandomPicker/types/picker'
import { ShuffleOutline, RefreshOutline, SparklesOutline } from '@vicons/ionicons5'

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
  const animationDuration = 1500
  const intervalTime = 60
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
    <div class="px-6 py-5 border-b border-[var(--border-color)]">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-color1)]">选择配置</h3>
      </div>

      <div class="space-y-4">
        <!-- 选择模式 -->
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-[var(--text-color2)] w-16">选择模式</span>
          <n-radio-group v-model:value="mode" size="medium">
            <n-radio-button v-for="item in modeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </n-radio-button>
          </n-radio-group>
        </div>

        <!-- 数量配置 -->
        <div v-if="mode !== 'sequential'" class="flex items-center gap-3">
          <span class="text-sm font-medium text-[var(--text-color2)] w-16">选择数量</span>
          <n-input-number
            v-model:value="pickCount"
            :min="1"
            :max="availableCount"
            size="medium"
            class="w-32" />
          <span class="text-sm text-[var(--text-color3)]">个</span>
        </div>

        <!-- 剔除配置 -->
        <div class="flex items-center gap-3">
          <n-switch v-model:value="config.removeSelected" size="medium" />
          <span class="text-sm font-medium text-[var(--text-color2)]">选中后自动移除</span>
        </div>
      </div>
    </div>

    <!-- 选择区域 -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <!-- 可选取数量提示 -->
      <div class="mb-6 text-center">
        <div
          class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          {{ availableCount }}
        </div>
        <div class="text-sm text-[var(--text-color3)]">可选取数量</div>
      </div>

      <!-- 选择按钮 -->
      <div
        class="relative group"
        :class="{ 'animate-pulse': isPicking }"
        @mouseenter="() => {}"
        @mouseleave="() => {}">
        <!-- 外圈光环 -->
        <div
          v-if="canPick && !isPicking"
          class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500 scale-150" />

        <!-- 圆形按钮 -->
        <div
          class="relative flex flex-col items-center justify-center w-36 h-36 rounded-full cursor-pointer transition-all duration-300 select-none"
          :class="[
            canPick && !isPicking
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-xl shadow-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/40'
              : 'bg-gray-200 cursor-not-allowed shadow-none'
          ]"
          role="button"
          @click="handlePick">
          <!-- 内圈光晕 -->
          <div
            v-if="canPick && !isPicking"
            class="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

          <!-- 图标 -->
          <n-icon v-if="!isPicking" size="42" class="text-white relative z-10 drop-shadow-lg">
            <SparklesOutline v-if="options.length > 0" />
            <ShuffleOutline v-else />
          </n-icon>

          <!-- 加载动画 -->
          <div v-else class="relative z-10">
            <n-spin :size="42" stroke-color="#ffffff" />
          </div>

          <!-- 文字 -->
          <span class="mt-2 text-sm font-semibold text-white relative z-10 drop-shadow">
            {{ isPicking ? '选择中...' : '开始选择' }}
          </span>
        </div>
      </div>

      <!-- 重置按钮 -->
      <transition name="fade">
        <n-button
          v-if="selectedCount > 0"
          quaternary
          type="warning"
          size="medium"
          class="mt-6"
          @click="handleReset">
          <template #icon>
            <n-icon size="16"><RefreshOutline /></n-icon>
          </template>
          重置已选
        </n-button>
      </transition>
    </div>

    <!-- 结果展示 -->
    <n-modal
      v-model:show="showResult"
      preset="card"
      title="🎉 选择结果"
      :style="{ width: '400px' }"
      :bordered="false"
      class="result-modal"
      @close="closeResult">
      <div class="flex flex-col gap-3 py-4">
        <transition-group name="result">
          <div
            v-for="(item, index) in pickResult"
            :key="item.id"
            class="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <div class="text-lg font-semibold text-green-800">{{ item.name }}</div>
                <div class="text-xs text-green-600">已添加到已选列表</div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <n-button size="large" @click="handlePick" class="flex-1">
            <template #icon>
              <n-icon><ShuffleOutline /></n-icon>
            </template>
            再选一次
          </n-button>
          <n-button type="primary" size="large" @click="closeResult" class="flex-1 font-medium">
            知道了！
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.result-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.result-move {
  transition: transform 0.5s ease;
}
</style>
