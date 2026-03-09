<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { Option } from '@/views/RandomPicker/types/picker'
import {
  AddOutline,
  TrashBinOutline,
  EyeOutline,
  EyeOffOutline,
  DocumentTextOutline
} from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { options, selectedCount } = storeToRefs(store)

const showAddDialog = ref(false)
const addText = ref('')
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

// 批量禁用选中的项
const handleBatchDisable = () => {
  if (selectedForBatch.value.length > 0) {
    store.setDisabled(selectedForBatch.value, true)
    selectedForBatch.value = []
  }
}

// 批量启用选中的项
const handleBatchEnable = () => {
  if (selectedForBatch.value.length > 0) {
    store.setDisabled(selectedForBatch.value, false)
    selectedForBatch.value = []
  }
}

// 批量删除选中的项
const handleBatchRemove = () => {
  if (selectedForBatch.value.length > 0) {
    store.removeOptions(selectedForBatch.value)
    selectedForBatch.value = []
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
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 头部操作栏 -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <n-button type="primary" @click="showAddDialog = true">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加
      </n-button>
      <n-button v-if="selectedForBatch.length > 0" size="small" @click="handleBatchDisable">
        禁用 ({{ selectedForBatch.length }})
      </n-button>
      <n-button v-if="selectedForBatch.length > 0" size="small" @click="handleBatchEnable">
        启用 ({{ selectedForBatch.length }})
      </n-button>
      <n-button
        v-if="selectedForBatch.length > 0"
        size="small"
        type="error"
        @click="handleBatchRemove">
        删除 ({{ selectedForBatch.length }})
      </n-button>
      <n-button
        v-if="options.some(opt => opt.disabled)"
        size="small"
        @click="handleClearAllDisabled">
        清除禁用
      </n-button>
    </div>

    <!-- 候选项列表 -->
    <div class="flex-1 overflow-auto">
      <n-list v-if="options.length > 0" hoverable clickable>
        <n-list-item v-for="option in options" :key="option.id">
          <div
            class="flex items-center gap-2"
            :class="{
              'opacity-50': option.disabled,
              'bg-blue-500/10': isSelected(option)
            }">
            <!-- 批量选择复选框 -->
            <n-checkbox
              :checked="selectedForBatch.includes(option.id)"
              @update:checked="toggleBatchSelect(option.id)" />

            <!-- 候选项内容 -->
            <div class="flex-1 flex items-center gap-2 min-w-0">
              <span
                class="flex-1 truncate"
                :class="{
                  'line-through text-gray-400': option.disabled,
                  'text-blue-500 font-bold': isSelected(option)
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
            <div class="flex items-center gap-1 flex-shrink-0">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    quaternary
                    circle
                    size="small"
                    :type="option.disabled ? 'warning' : 'default'"
                    @click="handleToggleDisabled(option.id)">
                    <template #icon>
                      <n-icon>
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
                      <n-icon><TrashBinOutline /></n-icon>
                    </template>
                  </n-button>
                </template>
                删除
              </n-tooltip>
            </div>
          </div>
        </n-list-item>
      </n-list>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
        <n-icon size="48" :depth="3">
          <DocumentTextOutline />
        </n-icon>
        <span class="mt-2">暂无候选项，点击"添加"按钮开始</span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="mt-4 text-sm text-gray-500 flex justify-between">
      <span>共 {{ options.length }} 项</span>
      <span>
        已禁用 {{ options.filter(opt => opt.disabled).length }} 项 | 已选中 {{ selectedCount }} 项
      </span>
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
        :rows="6" />
    </n-modal>
  </div>
</template>
