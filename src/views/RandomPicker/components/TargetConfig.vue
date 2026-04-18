<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import { AddOutline, CreateOutline, TrashBinOutline, ListOutline } from '@vicons/ionicons5'

const store = useRandomPickerStore()
const { targets, history } = storeToRefs(store)

const showAddDialog = ref(false)
const editingTarget = ref<string | null>(null)
const targetName = ref('')
const targetCount = ref(1)

// 重置表单
const resetForm = () => {
  targetName.value = ''
  targetCount.value = 1
  editingTarget.value = null
}

// 打开添加对话框
const openAddDialog = () => {
  resetForm()
  showAddDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (id: string) => {
  const target = targets.value.find(t => t.id === id)
  if (target) {
    editingTarget.value = id
    targetName.value = target.name
    targetCount.value = target.count
    showAddDialog.value = true
  }
}

// 保存目标
const handleSave = () => {
  if (!targetName.value.trim()) return

  if (editingTarget.value) {
    store.updateTarget(editingTarget.value, {
      name: targetName.value.trim(),
      count: targetCount.value
    })
  } else {
    store.addTarget(targetName.value.trim(), targetCount.value)
  }

  showAddDialog.value = false
  resetForm()
}

// 删除目标
const handleRemove = (id: string) => {
  store.removeTarget(id)
}

// 执行顺序选择
const handlePick = (target: (typeof targets.value)[0]) => {
  store.performSequentialPick(target)
}

// 判断目标是否已完成
const isTargetCompleted = (targetId: string): boolean => {
  return history.value.some(h => h.target?.id === targetId)
}
</script>

<template>
  <div class="flex flex-col">
    <!-- 头部 -->
    <div class="px-4 py-3 flex items-center justify-between">
      <span class="text-sm font-medium text-gray-600">选择目标</span>
      <n-button size="small" type="primary" @click="openAddDialog">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加
      </n-button>
    </div>

    <!-- 目标列表 -->
    <div class="px-4 pb-3">
      <div v-if="targets.length > 0" class="flex flex-col gap-2">
        <div
          v-for="target in targets"
          :key="target.id"
          class="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          :class="{ 'opacity-50': isTargetCompleted(target.id) }">
          <div class="flex items-center gap-2">
            <n-tag type="info" size="small">
              {{ target.order + 1 }}
            </n-tag>
            <span class="text-sm font-medium">{{ target.name }}</span>
            <n-tag size="small">×{{ target.count }}</n-tag>
          </div>
          <div class="flex items-center gap-1">
            <n-button
              size="tiny"
              type="primary"
              :disabled="isTargetCompleted(target.id)"
              @click="handlePick(target)">
              选择
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button size="tiny" quaternary @click="openEditDialog(target.id)">
                  <template #icon>
                    <n-icon size="14"><CreateOutline /></n-icon>
                  </template>
                </n-button>
              </template>
              编辑
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button size="tiny" quaternary type="error" @click="handleRemove(target.id)">
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
      <div v-else class="flex flex-col items-center justify-center py-6 text-gray-400">
        <n-icon size="32" :depth="3">
          <ListOutline />
        </n-icon>
        <span class="mt-1 text-xs">暂无选择目标</span>
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <n-modal
      v-model:show="showAddDialog"
      preset="dialog"
      :title="editingTarget ? '编辑目标' : '添加目标'"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSave">
      <div class="flex flex-col gap-4">
        <n-input v-model:value="targetName" placeholder="目标名称（如：第一选择、二等奖）" />
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">选择数量:</span>
          <n-input-number v-model:value="targetCount" :min="1" :max="100" />
        </div>
      </div>
    </n-modal>
  </div>
</template>
