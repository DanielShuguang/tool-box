<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { Option } from '@/views/RandomPicker/types/picker'
import {
  AddOutline,
  TrashBinOutline,
  EyeOutline,
  EyeOffOutline,
  RemoveCircleOutline
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
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 头部操作栏 -->
    <div class="px-4 py-3 border-b border-[var(--border-color)]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">候选项</span>
          <n-tag size="small" round>{{ options.length }}</n-tag>
        </div>
        <n-button type="primary" size="small" @click="showAddDialog = true">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加
        </n-button>
      </div>

      <!-- 批量操作栏 -->
      <transition name="fade">
        <div
          v-if="showBatchActions"
          class="flex items-center gap-2 p-2 rounded-lg bg-[var(--primary-color)]/10 mb-2">
          <span class="text-xs text-[var(--text-color2)] flex-1">
            已选 {{ selectedForBatch.length }} 项
          </span>
          <n-button size="tiny" @click="toggleSelectAll">
            {{ selectedForBatch.length === options.length ? '取消全选' : '全选' }}
          </n-button>
          <n-button size="tiny" type="error" @click="handleBatchRemove">删除</n-button>
          <n-button
            size="tiny"
            @click="
              showBatchActions = false
              selectedForBatch = []
            ">
            取消
          </n-button>
        </div>
      </transition>

      <!-- 工具按钮 -->
      <div v-if="!showBatchActions && options.some(opt => opt.disabled)" class="flex items-center">
        <n-button size="small" quaternary @click="handleClearAllDisabled">
          <template #icon>
            <n-icon size="14"><RemoveCircleOutline /></n-icon>
          </template>
          清除禁用
        </n-button>
      </div>
    </div>

    <!-- 候选项列表 -->
    <div class="flex-1 overflow-auto">
      <div v-if="options.length > 0" class="p-3">
        <div
          v-for="option in options"
          :key="option.id"
          class="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-150 hover:bg-[var(--hover-color)]"
          :class="{
            'opacity-40': option.disabled,
            'bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/30':
              isSelected(option)
          }"
          @click="toggleBatchSelect(option.id)">
          <!-- 批量选择复选框 -->
          <n-checkbox
            :checked="selectedForBatch.includes(option.id)"
            @update:checked="toggleBatchSelect(option.id)"
            @click.stop />

          <!-- 候选项内容 -->
          <div class="flex-1 flex items-center gap-2 min-w-0">
            <span
              class="flex-1 truncate text-sm"
              :class="{
                'line-through text-[var(--text-color3)]': option.disabled,
                'text-[var(--primary-color)] font-medium': isSelected(option)
              }">
              {{ option.name }}
            </span>
            <n-tag v-if="option.weight !== 1" size="small" type="info">
              权重: {{ option.weight }}
            </n-tag>
            <n-tag v-if="option.group" size="small">
              {{ option.group }}
            </n-tag>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-1 flex-shrink-0" @click.stop>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  quaternary
                  circle
                  size="tiny"
                  :type="option.disabled ? 'warning' : 'default'"
                  @click="handleToggleDisabled(option.id)">
                  <template #icon>
                    <n-icon size="14">
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
                  size="tiny"
                  type="error"
                  @click="handleRemove(option.id)">
                  <template #icon>
                    <n-icon size="14"><TrashBinOutline /></n-icon>
                  </template>
                </n-button>
              </template>
              删除
            </n-tooltip>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-[var(--text-color3)]">
        <n-empty description="暂无候选项" size="small">
          <template #extra>
            <n-button size="small" type="primary" @click="showAddDialog = true">
              添加候选项
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 统计信息 -->
    <div
      v-if="options.length > 0"
      class="px-4 py-2 border-t border-[var(--border-color)] text-xs text-[var(--text-color3)] flex justify-between">
      <span>已禁用 {{ options.filter(opt => opt.disabled).length }} 项</span>
      <span>已选中 {{ selectedCount }} 项</span>
    </div>

    <!-- 添加对话框 -->
    <n-modal
      v-model:show="showAddDialog"
      preset="dialog"
      title="添加候选项"
      positive-text="添加"
      negative-text="取消"
      @positive-click="handleAdd">
      <n-input
        v-model:value="addText"
        type="textarea"
        placeholder="输入候选项，每行一个&#10;例如：&#10;火锅&#10;烧烤&#10;日料"
        :rows="5" />
    </n-modal>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
