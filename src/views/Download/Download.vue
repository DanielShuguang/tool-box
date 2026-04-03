<script lang="ts" setup>
import { useDownloadStore } from '@/stores/download'
import { useDownloadDialog } from './hooks/useDownloadDialog'
import { useResumeDownload } from './hooks/useResumeDownload'
import DownloadTaskItem from './components/DownloadTaskItem.vue'
import NewDownloadDialog from './components/NewDownloadDialog.vue'
import ScanResumeDialog from './components/ScanResumeDialog.vue'
import { AddOutline, TrashBinOutline, ClipboardOutline, RefreshOutline } from '@vicons/ionicons5'

const downloadStore = useDownloadStore()
const { downloadingTasks, completedTasks, isSettingsLoaded } = storeToRefs(downloadStore)

const { showNewDownloadDialog, openNewDownloadDialog, handleCreateDownload } = useDownloadDialog()
const { showScanDialog, openScanDialog } = useResumeDownload()

const searchKeyword = ref('')

const filteredDownloadingTasks = computed(() => {
  if (!searchKeyword.value) return downloadingTasks.value
  const keyword = searchKeyword.value.toLowerCase()
  return downloadingTasks.value.filter(
    task =>
      task.url.toLowerCase().includes(keyword) || task.fileName.toLowerCase().includes(keyword)
  )
})

const filteredCompletedTasks = computed(() => {
  if (!searchKeyword.value) return completedTasks.value
  const keyword = searchKeyword.value.toLowerCase()
  return completedTasks.value.filter(
    task =>
      task.url.toLowerCase().includes(keyword) || task.fileName.toLowerCase().includes(keyword)
  )
})

const activeTab = ref<'downloading' | 'completed'>('downloading')

onMounted(async () => {
  await downloadStore.loadSettings()
  downloadStore.loadTasksFromStorage()
})

async function handleClearCompleted() {
  await downloadStore.clearCompleted()
}

async function handlePasteFromClipboard() {
  await downloadStore.createFromClipboard()
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- 工具栏 -->
    <div class="toolbar shrink-0">
      <div class="flex items-center gap-2">
        <n-button type="primary" size="small" @click="openNewDownloadDialog">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建下载
        </n-button>
        <n-button size="small" @click="handlePasteFromClipboard">
          <template #icon>
            <n-icon><ClipboardOutline /></n-icon>
          </template>
          从剪贴板
        </n-button>
        <n-button size="small" @click="openScanDialog">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          恢复下载
        </n-button>
        <n-button
          size="small"
          :disabled="completedTasks.length === 0"
          @click="handleClearCompleted">
          <template #icon>
            <n-icon><TrashBinOutline /></n-icon>
          </template>
          清除已完成
        </n-button>
      </div>
      <n-input
        v-model:value="searchKeyword"
        placeholder="搜索任务..."
        clearable
        size="small"
        class="w-52" />
    </div>

    <!-- 标签栏 -->
    <div class="tab-bar shrink-0">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'downloading' }"
        @click="activeTab = 'downloading'">
        下载中
        <span class="tab-count">{{ downloadingTasks.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'completed' }"
        @click="activeTab = 'completed'">
        已完成
        <span class="tab-count">{{ completedTasks.length }}</span>
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="flex-1 min-h-0 overflow-y-auto p-3">
      <div v-if="!isSettingsLoaded" class="flex items-center justify-center h-full">
        <n-spin size="large" />
      </div>
      <template v-else>
        <div v-show="activeTab === 'downloading'">
          <div v-if="filteredDownloadingTasks.length === 0" class="empty-state">
            <n-empty description="暂无下载任务">
              <template #extra>
                <n-button type="primary" size="small" @click="openNewDownloadDialog">
                  添加下载任务
                </n-button>
              </template>
            </n-empty>
          </div>
          <div v-else class="flex flex-col gap-2">
            <DownloadTaskItem
              v-for="task in filteredDownloadingTasks"
              :key="task.id"
              :task="task" />
          </div>
        </div>

        <div v-show="activeTab === 'completed'">
          <div v-if="filteredCompletedTasks.length === 0" class="empty-state">
            <n-empty description="暂无已完成的任务" />
          </div>
          <div v-else class="flex flex-col gap-2">
            <DownloadTaskItem v-for="task in filteredCompletedTasks" :key="task.id" :task="task" />
          </div>
        </div>
      </template>
    </div>

    <NewDownloadDialog
      :show="showNewDownloadDialog"
      @close="showNewDownloadDialog = false"
      @confirm="handleCreateDownload" />
    <ScanResumeDialog :show="showScanDialog" @close="showScanDialog = false" />
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--borderColor);
  background-color: var(--cardColor);
  gap: 8px;
  flex-shrink: 0;
}

.tab-bar {
  display: flex;
  padding: 0 8px;
  border-bottom: 1px solid var(--borderColor);
  background-color: var(--cardColor);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: none;
  background: transparent;
  color: var(--textColor2);
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: var(--textColorBase);
  }

  &.active {
    color: var(--primaryColor);
    border-bottom-color: var(--primaryColor);
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background-color: var(--actionColor);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--textColor3);

  .active & {
    background-color: var(--primaryColor);
    color: #fff;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
