<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useResumeDownload } from '../hooks/useResumeDownload'
import { FileTrayFullOutline, RefreshOutline, PlayOutline } from '@vicons/ionicons5'
import { formatFileSize } from '@/utils/download'

const props = defineProps<{
  show: boolean
}>()

watch(
  () => props.show,
  val => {
    if (!val) {
      scannedTasks.value = []
    }
  }
)

const emit = defineEmits<{
  close: []
}>()

const {
  scannedTasks,
  isScanning,
  isCheckingRange,
  selectAndScanFiles,
  checkAllRangeSupport,
  toggleTaskSelection,
  selectAllTasks,
  resumeSelectedTasks,
  restartFromBeginning
} = useResumeDownload()

const selectedCount = computed(() => scannedTasks.value.filter(t => t.selected).length)

const hasUnsupportedTasks = computed(() =>
  scannedTasks.value.some(t => t.rangeSupport && !t.rangeSupport.supportsRange)
)

function handleClose() {
  emit('close')
}

async function handleScan() {
  await selectAndScanFiles()
  if (scannedTasks.value.length > 0) {
    await checkAllRangeSupport()
  }
}

function handleResume() {
  resumeSelectedTasks()
  emit('close')
}

function handleRestart(task: (typeof scannedTasks.value)[0]) {
  restartFromBeginning(task)
  emit('close')
}
</script>

<template>
  <n-modal
    :show="show"
    preset="dialog"
    title="恢复未完成的下载"
    style="width: 700px"
    @close="handleClose"
    @mask-click="handleClose">
    <div class="scan-section mb-4">
      <n-button :loading="isScanning" @click="handleScan">
        <template #icon>
          <n-icon>
            <FileTrayFullOutline />
          </n-icon>
        </template>
        选择临时文件
      </n-button>
      <span class="ml-4 text-[--text-color-secondary] text-sm"> 请选择 .download 临时文件 </span>
    </div>

    <n-spin :show="isScanning">
      <div v-if="scannedTasks.length > 0" class="task-list max-h-80 overflow-auto">
        <div class="mb-3 flex items-center justify-between">
          <n-checkbox
            :checked="selectedCount === scannedTasks.length"
            :indeterminate="selectedCount > 0 && selectedCount < scannedTasks.length"
            @update:checked="selectAllTasks">
            全选 ({{ selectedCount }}/{{ scannedTasks.length }})
          </n-checkbox>
          <n-button size="small" :loading="isCheckingRange" @click="checkAllRangeSupport">
            <template #icon>
              <n-icon>
                <RefreshOutline />
              </n-icon>
            </template>
            检查服务器支持
          </n-button>
        </div>

        <n-table size="small">
          <thead>
            <tr>
              <th style="width: 40px"></th>
              <th>文件名</th>
              <th style="width: 100px">大小</th>
              <th style="width: 100px">状态</th>
              <th style="width: 80px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in scannedTasks" :key="task.filePath">
              <td>
                <n-checkbox :checked="task.selected" @update:checked="toggleTaskSelection(task)" />
              </td>
              <td>
                <div class="truncate" :title="task.fileName">
                  {{ task.fileName }}
                </div>
                <div class="text-xs text-[--text-color-secondary] truncate" :title="task.url">
                  {{ task.url }}
                </div>
              </td>
              <td>
                <div>{{ formatFileSize(task.downloadedBytes) }}</div>
                <div class="text-xs text-[--text-color-secondary]">
                  / {{ formatFileSize(task.totalBytes) }}
                </div>
              </td>
              <td>
                <template v-if="task.rangeSupport">
                  <n-tag v-if="task.rangeSupport.supportsRange" type="success" size="small">
                    支持断点
                  </n-tag>
                  <n-tag v-else type="warning" size="small"> 不支持断点 </n-tag>
                </template>
                <n-tag v-else-if="task.rangeCheckError" type="error" size="small"> 检查失败 </n-tag>
                <n-tag v-else type="default" size="small"> 待检查 </n-tag>
              </td>
              <td>
                <n-space vertical size="small">
                  <n-button
                    v-if="task.rangeSupport && !task.rangeSupport.supportsRange"
                    size="tiny"
                    @click="handleRestart(task)">
                    <template #icon>
                      <n-icon>
                        <RefreshOutline />
                      </n-icon>
                    </template>
                    重下
                  </n-button>
                  <n-button
                    v-else
                    size="tiny"
                    :disabled="!task.selected"
                    @click="handleRestart(task)">
                    <template #icon>
                      <n-icon>
                        <PlayOutline />
                      </n-icon>
                    </template>
                    开始
                  </n-button>
                </n-space>
              </td>
            </tr>
          </tbody>
        </n-table>

        <div v-if="hasUnsupportedTasks" class="mt-3 p-3 bg-[--warning-color] bg-opacity-10 rounded">
          <n-alert type="warning">
            部分下载任务的服务器不支持断点续传。您可以选择重新下载整个文件，或在不支持断点的情况下继续下载。
          </n-alert>
        </div>
      </div>

      <n-empty v-else-if="!isScanning" description="请先选择临时文件" />
    </n-spin>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" :disabled="selectedCount === 0" @click="handleResume">
          恢复下载 ({{ selectedCount }})
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
