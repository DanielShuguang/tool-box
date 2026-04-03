<script lang="ts" setup>
import type { DownloadTask } from '../types'
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
import {
  formatFileSize,
  formatSpeed,
  formatTime,
  formatDate,
  getStatusType,
  getStatusText,
  formatSpeedLimitLabel
} from '@/utils/download'

const props = defineProps<{
  task: DownloadTask
}>()

const downloadStore = useDownloadStore()

const statusType = computed(() => getStatusType(props.task.status))
const statusText = computed(() => getStatusText(props.task.status))
const currentSpeedLimitLabel = computed(() => formatSpeedLimitLabel(props.task.speedLimit))
</script>

<template>
  <div class="task-card">
    <!-- 头部：文件名 + 状态 + 操作 -->
    <div class="flex items-center gap-3 mb-2">
      <div class="flex-1 min-w-0">
        <n-tooltip trigger="hover" :delay="500" content-class="max-w-[60vw]">
          <template #trigger>
            <div class="file-name">{{ task.fileName || '未命名文件' }}</div>
          </template>
          {{ task.url }}
        </n-tooltip>
        <div class="file-url">{{ task.url }}</div>
      </div>

      <n-tag :type="statusType" size="small" :bordered="false">{{ statusText }}</n-tag>

      <div class="flex items-center gap-1">
        <n-tooltip v-if="task.status === 'pending' || task.status === 'paused'">
          <template #trigger>
            <n-button circle size="small" @click="downloadStore.startTask(task.id)">
              <template #icon
                ><n-icon><PlayOutline /></n-icon
              ></template>
            </n-button>
          </template>
          开始
        </n-tooltip>

        <n-tooltip v-if="task.status === 'downloading'">
          <template #trigger>
            <n-button circle size="small" @click="downloadStore.pauseTask(task.id)">
              <template #icon
                ><n-icon><PauseOutline /></n-icon
              ></template>
            </n-button>
          </template>
          暂停
        </n-tooltip>

        <n-tooltip v-if="task.status === 'paused'">
          <template #trigger>
            <n-button circle size="small" @click="downloadStore.cancelTask(task.id)">
              <template #icon
                ><n-icon><CloseOutline /></n-icon
              ></template>
            </n-button>
          </template>
          取消
        </n-tooltip>

        <template v-if="task.status === 'completed'">
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.openFile(task.id)">
                <template #icon
                  ><n-icon><OpenOutline /></n-icon
                ></template>
              </n-button>
            </template>
            打开文件
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button circle size="small" @click="downloadStore.openFileDirectory(task.id)">
                <template #icon
                  ><n-icon><FolderOpenOutline /></n-icon
                ></template>
              </n-button>
            </template>
            打开目录
          </n-tooltip>
        </template>

        <n-tooltip v-if="task.status === 'failed' || task.status === 'cancelled'">
          <template #trigger>
            <n-button circle size="small" @click="downloadStore.retryTask(task.id)">
              <template #icon
                ><n-icon><RefreshOutline /></n-icon
              ></template>
            </n-button>
          </template>
          重试
        </n-tooltip>

        <n-popconfirm @positive-click="downloadStore.deleteTask(task.id)">
          <template #trigger>
            <n-button circle size="small" type="error">
              <template #icon
                ><n-icon><TrashBinOutline /></n-icon
              ></template>
            </n-button>
          </template>
          确定要删除这个下载任务吗？
        </n-popconfirm>
      </div>
    </div>

    <!-- 进度条 -->
    <n-progress
      :percentage="task.progress.percentage"
      :show-indicator="false"
      :height="5"
      :border-radius="3"
      :fill-border-radius="3"
      class="mb-2" />

    <!-- 底部元信息 -->
    <div class="flex items-center justify-between">
      <div class="meta-group">
        <span>
          {{ formatFileSize(task.progress.downloadedBytes) }} /
          {{ formatFileSize(task.progress.totalBytes) }}
        </span>
        <span v-if="task.progress.speed > 0">{{ formatSpeed(task.progress.speed) }}</span>
        <span v-if="task.progress.eta > 0">剩余 {{ formatTime(task.progress.eta) }}</span>
      </div>
      <div class="meta-group">
        <span v-if="task.speedLimit">限速 {{ currentSpeedLimitLabel }}</span>
        <span v-if="task.retryCount > 0">重试 {{ task.retryCount }} 次</span>
        <span v-if="task.status === 'completed'">完成于 {{ formatDate(task.completedAt) }}</span>
        <span v-else>{{ formatDate(task.createdAt) }}</span>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="task.status === 'failed' && task.errorMessage" class="error-msg">
      {{ task.errorMessage }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.task-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 10px 12px;
  background-color: var(--cardColor);
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--primaryColor);
  }
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--textColorBase);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-url {
  font-size: 11px;
  color: var(--textColor3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.meta-group {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--textColor3);
  font-variant-numeric: tabular-nums;
}

.error-msg {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: rgba(208, 48, 80, 0.08);
  color: var(--errorColor);
}
</style>
