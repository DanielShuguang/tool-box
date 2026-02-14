<script lang="ts" setup>
import {
  ArrowUndoOutline,
  ArrowRedoOutline,
  TrashOutline,
  DownloadOutline,
  FolderOpenOutline,
  RefreshOutline,
  CreateOutline,
  SquareOutline,
  RadioButtonOnOutline,
  EllipseOutline,
  TextOutline,
  LinkOutline,
  ExpandOutline,
  ContractOutline,
  BrushOutline,
  ImageOutline,
  HandLeftOutline,
  RemoveCircleOutline,
  RefreshCircleOutline,
  ColorFillOutline
} from '@vicons/ionicons5'
import type { ToolbarItem } from '../types'
import { Component } from 'vue'

interface Props {
  toolbarItems: ToolbarItem[]
  currentTool: string
  canUndo: boolean
  canRedo: boolean
}

interface Emits {
  (e: 'action', item: ToolbarItem): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const getIconComponent = (iconName: string | undefined) => {
  if (!iconName) return CreateOutline
  const iconMap: Record<string, Component> = {
    CreateOutline,
    SquareOutline,
    RadioButtonOnOutline,
    EllipseOutline,
    LinkOutline,
    TextOutline,
    ArrowUndoOutline,
    ArrowRedoOutline,
    TrashOutline,
    RefreshOutline,
    DownloadOutline,
    FolderOpenOutline,
    ExpandOutline,
    ContractOutline,
    BrushOutline,
    ImageOutline,
    HandLeftOutline,
    RemoveCircleOutline,
    RefreshCircleOutline,
    ColorFillOutline
  }
  return iconMap[iconName] || CreateOutline
}

const handleAction = (item: ToolbarItem) => {
  if (item.disabled || item.type === 'separator') return
  emit('action', item)
}
</script>

<template>
  <div
    class="toolbar flex items-center gap-[10px] p-[10px] border-b border-[--borderColor] bg-[--modalColor]">
    <template v-for="item in toolbarItems" :key="item.id">
      <template v-if="item.type === 'separator'">
        <n-divider vertical />
      </template>
      <template v-else>
        <n-tooltip>
          <template #trigger>
            <n-button
              :type="currentTool === item.id ? 'primary' : 'default'"
              :disabled="item.disabled"
              circle
              @click="handleAction(item)">
              <template #icon>
                <n-icon :component="getIconComponent(item.icon)" />
              </template>
            </n-button>
          </template>
          {{ item.tooltip }}
        </n-tooltip>
      </template>
    </template>
  </div>
</template>
