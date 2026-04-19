<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { Option } from '@/views/RandomPicker/types/picker'
import {
  AddOutline,
  TrashBinOutline,
  EyeOutline,
  EyeOffOutline,
  RemoveCircleOutline,
  ShuffleOutline
} from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { options, selectedCount } = storeToRefs(store)

const showAddDialog = ref(false)
const addText = ref('')

const showBatchActions = ref(false)
const selectedForBatch = ref<string[]>([])

// 添加候选项
const handleAdd = () => {
  if (addText.value.trim()) {
    const names = addText.value.split('\n').filter(name => name.trim())
    store.addOptions(names)
    addText.value = ''
    showAddDialog.value = false
  }
}

// 删除候选项
const handleRemove = (id: string) => {
  store.removeOption(id)
}

// 切换禁用状态
const handleToggleDisabled = (id: string) => {
  store.toggleDisabled(id)
}

// 批量删除选中的项
const handleBatchRemove = () => {
  if (selectedForBatch.value.length > 0) {
    store.removeOptions(selectedForBatch.value)
    selectedForBatch.value = []
    showBatchActions.value = false
  }
}

// 清除所有禁用状态
const handleClearAllDisabled = () => {
  store.clearAllDisabled()
}

// 判断是否已选中（用于剔除）
const isSelected = (option: Option): boolean => {
  return store.isSelected(option.id)
}

// 切换批量选择
const toggleBatchSelect = (id: string) => {
  const index = selectedForBatch.value.indexOf(id)
  if (index === -1) {
    selectedForBatch.value.push(id)
  } else {
    selectedForBatch.value.splice(index, 1)
  }
  showBatchActions.value = selectedForBatch.value.length > 0
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedForBatch.value.length === options.value.length) {
    selectedForBatch.value = []
  } else {
    selectedForBatch.value = options.value.map(opt => opt.id)
  }
  showBatchActions.value = selectedForBatch.value.length > 0
}

// 取消批量选择
const cancelBatchSelect = () => {
  showBatchActions.value = false
  selectedForBatch.value = []
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 头部操作栏 -->
    <div class="px-6 py-5 border-b border-[var(--border-color)]">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-[var(--text-color1)]">候选项列表</h3>
          <n-tag size="medium" round type="primary">{{ options.length }}</n-tag>
        </div>
        <n-button type="primary" size="medium" @click="showAddDialog = true">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加选项
        </n-button>
      </div>

      <!-- 批量操作栏 -->
      <transition name="fade">
        <div
          v-if="showBatchActions"
          class="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-3">
          <span class="text-sm text-[var(--text-color2)] flex items-center gap-2">
            <n-icon size="18" class="text-blue-500">
              <CheckboxOutline />
            </n-icon>
            已选 {{ selectedForBatch.length }} 项
          </span>
          <n-button size="small" secondary @click="toggleSelectAll">
            {{ selectedForBatch.length === options.length ? '取消全选' : '全选' }}
          </n-button>
          <n-button size="small" type="error" @click="handleBatchRemove">
            <template #icon>
              <n-icon><TrashBinOutline /></n-icon>
            </template>
            删除
          </n-button>
          <n-button size="small" @click="cancelBatchSelect">取消</n-button>
        </div>
      </transition>

      <!-- 工具按钮 -->
      <div v-if="!showBatchActions && options.some(opt => opt.disabled)" class="flex items-center">
        <n-button size="small" quaternary @click="handleClearAllDisabled">
          <template #icon>
            <n-icon size="16"><RemoveCircleOutline /></n-icon>
          </template>
          恢复全部
        </n-button>
      </div>
    </div>

    <!-- 候选项列表 -->
    <div class="flex-1 overflow-auto px-4 py-4">
      <div v-if="options.length > 0" class="space-y-2">
        <transition-group name="list">
          <div
            v-for="(option, index) in options"
            :key="option.id"
            class="group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 border border-transparent hover:border-gray-200"
            :class="{
              'opacity-50 bg-gray-100': option.disabled,
              'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200': isSelected(option)
            }"
            @click="toggleBatchSelect(option.id)">
            <!-- 序号 -->
            <div
              class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 group-hover:bg-gray-200 transition-colors">
              {{ index + 1 }}
            </div>

            <!-- 批量选择复选框 -->
            <n-checkbox
              :checked="selectedForBatch.includes(option.id)"
              @update:checked="toggleBatchSelect(option.id)"
              @click.stop />

            <!-- 候选项内容 -->
            <div class="flex-1 flex items-center gap-3 min-w-0">
              <span
                class="flex-1 truncate text-sm font-medium"
                :class="{
                  'line-through text-gray-400': option.disabled,
                  'text-blue-600': isSelected(option)
                }">
                {{ option.name }}
              </span>
              <n-tag v-if="option.weight !== 1" size="small" type="info" round>
                权重 {{ option.weight }}
              </n-tag>
              <n-tag v-if="option.group" size="small" round>
                {{ option.group }}
              </n-tag>
            </div>

            <!-- 操作按钮 -->
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    quaternary
                    circle
                    size="small"
                    :type="option.disabled ? 'warning' : 'default'"
                    @click="handleToggleDisabled(option.id)">
                    <template #icon>
                      <n-icon size="16">
                        <EyeOffOutline v-if="option.disabled" />
                        <EyeOutline v-else />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ option.disabled ? '启用' : '禁用' }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    quaternary
                    circle
                    size="small"
                    type="error"
                    @click="handleRemove(option.id)">
                    <template #icon>
                      <n-icon size="16"><TrashBinOutline /></n-icon>
                    </template>
                  </n-button>
                </template>
                删除
              </n-tooltip>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full text-center py-16">
        <div
          class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6">
          <n-icon size="48" class="text-blue-400">
            <ShuffleOutline />
          </n-icon>
        </div>
        <h4 class="text-lg font-semibold text-[var(--text-color1)] mb-2">还没有候选项</h4>
        <p class="text-sm text-[var(--text-color3)] mb-6">添加一些选项，开始随机选择</p>
        <n-button type="primary" size="large" @click="showAddDialog = true">
          <template #icon>
            <n-icon size="18"><AddOutline /></n-icon>
          </template>
          添加第一个选项
        </n-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div
      v-if="options.length > 0"
      class="px-6 py-3 border-t border-[var(--border-color)] bg-gray-50/50 flex justify-between text-sm">
      <span class="text-[var(--text-color3)]">
        已禁用 {{ options.filter(opt => opt.disabled).length }} 项
      </span>
      <span class="text-[var(--text-color3)]"> 已选中 {{ selectedCount }} 项 </span>
    </div>

    <!-- 添加对话框 -->
    <n-modal
      v-model:show="showAddDialog"
      preset="card"
      title="批量添加候选项"
      :style="{ width: '480px' }"
      :bordered="false">
      <div class="space-y-4">
        <n-input
          v-model:value="addText"
          type="textarea"
          placeholder="输入候选项，每行一个

例如：
火锅
烧烤
日料
自助餐"
          :rows="8"
          class="font-medium" />
        <div class="flex items-center gap-2 text-sm text-[var(--text-color3)]">
          <n-icon size="16">
            <InformationCircleOutline />
          </n-icon>
          <span>支持批量添加，每行一个选项</span>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <n-button @click="showAddDialog = false">取消</n-button>
          <n-button type="primary" @click="handleAdd" :disabled="!addText.trim()">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            添加选项
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
  transform: translateY(-10px);
}

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
