<script lang="ts" setup>
import type { DownloadTask } from 'src/views/Download/types'
import { useDownloadStore } from '@/stores/download'
import {
  PlayOutline,
  PauseOutline,
  CloseOutline,
  TrashBinOutline,
  RefreshOutline,
  FolderOpenOutline,
  OpenOutline
} from '@vicons/ionicons5'
import { format } from 'date-fns'

const props = defineProps<{
  task: DownloadTask
}>()

const downloadStore = useDownloadStore()

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond) + '/s'
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '--'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}时${minutes}分`
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '--'
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
}

const statusType = computed(() => {
  switch (props.task.status) {
    case 'downloading':
      return 'info'
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'paused':
      return 'warning'
    default:
      return 'default'
  }
})

const statusText = computed(() => {
  switch (props.task.status) {
    case 'pending':
      return '等待中'
    case 'downloading':
      return '下载中'
    case 'paused':
      return '已暂停'
    case 'completed':
      return '已完成'
    case 'failed':
      return '下载失败'
    case 'cancelled':
      return '已取消'
    default:
      return props.task.status
  }
})

const currentSpeedLimitLabel = computed(() => {
  const limit = props.task.speedLimit
  if (!limit) return '不限速'
  if (limit >= 1024 * 1024) {
    return `${(limit / (1024 * 1024)).toFixed(1)} MB/s`
  }
  return `${(limit / 1024).toFixed(0)} KB/s`
})
</script>

<template>
  <div
    class="download-task-item p-4 border border-[--divider-color] rounded-lg hover:border-[--primary-color] transition-colors">
    <div class="task-header flex items-center gap-3 mb-3">
      <!-- 文件名 -->
      <div class="file-info flex-1 min-w-0">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="file-name font-medium text-base truncate">
              {{ task.fileName || '未命名文件' }}
            </div>
          </template>
          {{ task.url }}
        </n-tooltip>
        <div class="file-url text-[--text-color-secondary] text-xs truncate mt-1">
          {{ task.url }}
        </div>
      </div>

      <!-- 状态标签 -->
      <n-tag :type="statusType" size="small">
        {{ statusText }}
      </n-tag>

      <!-- 操作按钮 -->
      <n-space>
        <template v-if="task.status === 'pending' || task.status === 'paused'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.startTask(task.id)">
                <template #icon>
                  <n-icon>
                    <PlayOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            开始
          </n-tooltip>
        </template>

        <template v-if="task.status === 'downloading'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.pauseTask(task.id)">
                <template #icon>
                  <n-icon>
                    <PauseOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            暂停
          </n-tooltip>
        </template>

        <template v-if="task.status === 'paused'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.cancelTask(task.id)">
                <template #icon>
                  <n-icon>
                    <CloseOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            取消
          </n-tooltip>
        </template>

        <template v-if="task.status === 'completed'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.openFile(task.id)">
                <template #icon>
                  <n-icon>
                    <OpenOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            打开
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.openFileDirectory(task.id)">
                <template #icon>
                  <n-icon>
                    <FolderOpenOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            打开目录
          </n-tooltip>
        </template>

        <template v-if="task.status === 'failed' || task.status === 'cancelled'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.retryTask(task.id)">
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
            重试
          </n-tooltip>
        </template>

        <n-popconfirm @positive-click="downloadStore.deleteTask(task.id)">
          <template #trigger>
            <n-button circle size="small" type="error">
              <template #icon>
                <n-icon>
                  <TrashBinOutline />
                </n-icon>
              </template>
            </n-button>
          </template>
          确定要删除这个下载任务吗？
        </n-popconfirm>
      </n-space>
    </div>

    <!-- 进度信息 -->
    <div class="task-progress mb-3">
      <div class="progress-bar mb-2">
        <n-progress
          :percentage="task.progress.percentage"
          :show-indicator="false"
          :height="8"
          :border-radius="4"
          :fill-border-radius="4" />
      </div>
      <div class="progress-info flex justify-between text-sm text-[--text-color-secondary]">
        <span>
          {{ formatFileSize(task.progress.downloadedBytes) }} /
          {{ formatFileSize(task.progress.totalBytes) }}
        </span>
        <span> {{ task.progress.percentage.toFixed(1) }}% </span>
      </div>
    </div>

    <!-- 速度和限速 -->
    <div
      class="task-footer flex items-center justify-between text-sm text-[--text-color-secondary]">
      <div class="speed-info flex gap-4">
        <span> 速度: {{ formatSpeed(task.progress.speed) }} </span>
        <span v-if="task.progress.eta > 0"> 剩余: {{ formatTime(task.progress.eta) }} </span>
      </div>

      <div class="meta-info flex gap-4">
        <span v-if="task.speedLimit"> 限速: {{ currentSpeedLimitLabel }} </span>
        <span v-if="task.status === 'completed'"> 完成于: {{ formatDate(task.completedAt) }} </span>
        <span v-else> 创建于: {{ formatDate(task.createdAt) }} </span>
        <span v-if="task.retryCount > 0"> 重试: {{ task.retryCount }}次 </span>
      </div>
    </div>

    <!-- 错误信息 -->
    <div
      v-if="task.status === 'failed' && task.errorMessage"
      class="error-message mt-2 p-2 bg-[#fff0f0] rounded text-[#d03050] text-sm">
      {{ task.errorMessage }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.download-task-item {
  background: var(--body-color);
}

.file-name {
  color: var(--text-color-base);
}

.file-url {
  color: var(--text-color-secondary);
}
</style>
