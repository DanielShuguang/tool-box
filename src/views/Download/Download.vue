<script lang="ts" setup>
import { useDownloadStore } from '@/stores/download'
import { useDownloadDialog } from './hooks/useDownloadDialog'
import DownloadTaskItem from './components/DownloadTaskItem.vue'
import NewDownloadDialog from './components/NewDownloadDialog.vue'
import { AddOutline, TrashBinOutline, FolderOpenOutline } from '@vicons/ionicons5'

const downloadStore = useDownloadStore()
const { downloadingTasks, completedTasks, isSettingsLoaded } = storeToRefs(downloadStore)

const { showNewDownloadDialog, openNewDownloadDialog, handleCreateDownload } = useDownloadDialog()

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
  <div class="download-page h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="toolbar flex items-center gap-4 p-4 border-b border-[--divider-color]">
      <n-button type="primary" @click="openNewDownloadDialog">
        <template #icon>
          <n-icon>
            <AddOutline />
          </n-icon>
        </template>
        新建下载
      </n-button>

      <n-button @click="handlePasteFromClipboard">
        <template #icon>
          <n-icon>
            <FolderOpenOutline />
          </n-icon>
        </template>
        从剪贴板
      </n-button>

      <n-button :disabled="completedTasks.length === 0" @click="handleClearCompleted">
        <template #icon>
          <n-icon>
            <TrashBinOutline />
          </n-icon>
        </template>
        清除已完成
      </n-button>

      <n-input v-model:value="searchKeyword" placeholder="搜索任务..." clearable class="w-60" />

      <div class="flex-1" />

      <n-space>
        <span class="text-[--text-color-secondary]"> 下载中: {{ downloadingTasks.length }} </span>
        <span class="text-[--text-color-secondary]"> 已完成: {{ completedTasks.length }} </span>
      </n-space>
    </div>

    <!-- 任务列表 -->
    <div class="task-list flex-1 overflow-auto p-4">
      <n-spin :show="!isSettingsLoaded">
        <template v-if="isSettingsLoaded">
          <!-- 下载中标签页 -->
          <div v-show="activeTab === 'downloading'" class="downloading-section">
            <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#18a058]" />
              下载中 ({{ filteredDownloadingTasks.length }})
            </h3>

            <div v-if="filteredDownloadingTasks.length === 0" class="empty-state py-8">
              <n-empty description="暂无下载任务">
                <template #extra>
                  <n-button type="primary" @click="openNewDownloadDialog"> 添加下载任务 </n-button>
                </template>
              </n-empty>
            </div>

            <div v-else class="task-items space-y-3">
              <DownloadTaskItem
                v-for="task in filteredDownloadingTasks"
                :key="task.id"
                :task="task" />
            </div>
          </div>

          <!-- 已完成标签页 -->
          <div v-show="activeTab === 'completed'" class="completed-section">
            <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#2080f0]" />
              已完成 ({{ filteredCompletedTasks.length }})
            </h3>

            <div v-if="filteredCompletedTasks.length === 0" class="empty-state py-8">
              <n-empty description="暂无已完成的任务" />
            </div>

            <div v-else class="task-items space-y-3">
              <DownloadTaskItem
                v-for="task in filteredCompletedTasks"
                :key="task.id"
                :task="task" />
            </div>
          </div>
        </template>
      </n-spin>
    </div>

    <!-- 标签页切换 -->
    <div class="tabs border-t border-[--divider-color] p-2 flex gap-2">
      <n-button
        :type="activeTab === 'downloading' ? 'primary' : 'default'"
        @click="activeTab = 'downloading'">
        下载中 ({{ downloadingTasks.length }})
      </n-button>
      <n-button
        :type="activeTab === 'completed' ? 'primary' : 'default'"
        @click="activeTab = 'completed'">
        已完成 ({{ completedTasks.length }})
      </n-button>
    </div>

    <!-- 新建下载对话框 -->
    <NewDownloadDialog
      :show="showNewDownloadDialog"
      @close="showNewDownloadDialog = false"
      @confirm="handleCreateDownload" />
  </div>
</template>

<style lang="scss" scoped>
.download-page {
  background: var(--action-color);
}

.toolbar {
  background: var(--body-color);
}

.task-list {
  background: var(--action-color);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.task-items {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.tabs {
  background: var(--body-color);
}
</style>
