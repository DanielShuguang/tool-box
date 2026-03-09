<script setup lang="ts">
import { useRandomPickerStore } from '@/stores/randomPicker'
import type { ExportFormat, ExportRange, PickResult } from '@/views/RandomPicker/types/picker'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const store = useRandomPickerStore()
const { history } = storeToRefs(store)
const message = useMessage()

const exportFormat = ref<ExportFormat>('json')
const exportRange = ref<ExportRange>('all')

// 获取模式名称
const getModeName = (mode: string): string => {
  const modeMap: Record<string, string> = {
    normal: '普通选择',
    weighted: '权重选择',
    sequential: '顺序选择'
  }
  return modeMap[mode] || mode
}

// 导出
const handleExport = async () => {
  let dataToExport: PickResult[] = []

  if (exportRange.value === 'current' && history.value.length > 0) {
    dataToExport = [history.value[0]]
  } else {
    dataToExport = [...history.value]
  }

  if (dataToExport.length === 0) {
    message.warning('没有可导出的数据')
    return
  }

  // 选择保存路径
  const filePath = await save({
    defaultPath: `random-picker-export-${Date.now()}.${exportFormat.value}`,
    filters: [{ name: exportFormat.value.toUpperCase(), extensions: [exportFormat.value] }]
  })

  if (!filePath) return

  let content = ''

  if (exportFormat.value === 'json') {
    content = JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        results: dataToExport.map(item => ({
          timestamp: item.timestamp,
          mode: item.mode,
          target: item.target,
          selected: item.selected.map(s => ({
            id: s.id,
            name: s.name,
            weight: s.weight
          }))
        }))
      },
      null,
      2
    )
  } else {
    // CSV 格式
    const lines = ['时间,模式,目标,选中项']
    dataToExport.forEach(item => {
      const time = new Date(item.timestamp).toLocaleString('zh-CN')
      const mode = getModeName(item.mode)
      const target = item.target?.name || '-'
      const selected = item.selected.map(s => s.name).join(';')
      lines.push(`${time},${mode},${target},${selected}`)
    })
    content = lines.join('\n')
  }

  try {
    await writeTextFile(filePath, content)
    message.success('导出成功')
    emit('update:show', false)
  } catch {
    message.error('导出失败')
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="props.show"
    preset="dialog"
    title="导出结果"
    positive-text="导出"
    negative-text="取消"
    @positive-click="handleExport"
    @negative-click="handleClose"
    @close="handleClose">
    <div class="flex flex-col gap-4">
      <!-- 导出格式 -->
      <div>
        <span class="text-gray-600 mb-2 block">导出格式</span>
        <n-radio-group v-model:value="exportFormat">
          <n-radio value="json">JSON</n-radio>
          <n-radio value="csv">CSV</n-radio>
        </n-radio-group>
      </div>

      <!-- 导出范围 -->
      <div>
        <span class="text-gray-600 mb-2 block">导出范围</span>
        <n-radio-group v-model:value="exportRange">
          <n-radio value="current">仅当前结果</n-radio>
          <n-radio value="all">全部历史</n-radio>
        </n-radio-group>
      </div>

      <!-- 提示 -->
      <n-alert type="info" title="提示"> 导出文件将保存到您选择的位置 </n-alert>
    </div>
  </n-modal>
</template>
