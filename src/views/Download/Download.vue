<script lang="ts" setup>
import { useDownloadStore } from '@/stores/download'
import { useDownloadDialog } from './hooks/useDownloadDialog'
import { useResumeDownload } from './hooks/useResumeDownload'
import DownloadTaskItem from './components/DownloadTaskItem.vue'
import NewDownloadDialog from './components/NewDownloadDialog.vue'
import ScanResumeDialog from './components/ScanResumeDialog.vue'
import {
  AddOutline,
  TrashBinOutline,
  ClipboardOutline,
  RefreshOutline,
  CloudDownloadOutline,
  CheckmarkCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'

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

// 统计数据
const totalTasks = computed(() => downloadingTasks.value.length + completedTasks.value.length)
const completedCount = computed(() => completedTasks.value.length)
const downloadingCount = computed(() => downloadingTasks.value.length)

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
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">下载管理</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-blue-500">
              <CloudDownloadOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">总任务数</div>
              <div class="text-xl font-bold">{{ totalTasks }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <TimeOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">下载中</div>
              <div class="text-xl font-bold">{{ downloadingCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-green-500">
              <CheckmarkCircleOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">已完成</div>
              <div class="text-xl font-bold">{{ completedCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <n-card :bordered="false" class="mb-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
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
            class="w-full sm:w-52" />
        </div>
      </n-card>

      <!-- 标签栏 -->
      <n-card :bordered="false" class="mb-4">
        <div class="flex gap-2">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="{
              'bg-blue-500 text-white': activeTab === 'downloading',
              'bg-gray-100 text-gray-600 hover:bg-gray-200': activeTab !== 'downloading'
            }"
            @click="activeTab = 'downloading'">
            下载中 {{ downloadingTasks.length }}
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="{
              'bg-green-500 text-white': activeTab === 'completed',
              'bg-gray-100 text-gray-600 hover:bg-gray-200': activeTab !== 'completed'
            }"
            @click="activeTab = 'completed'">
            已完成 {{ completedTasks.length }}
          </button>
        </div>
      </n-card>

      <!-- 任务列表 -->
      <n-card :bordered="false">
        <div v-if="!isSettingsLoaded" class="flex items-center justify-center py-12">
          <n-spin size="large" />
        </div>
        <template v-else>
          <div v-show="activeTab === 'downloading'">
            <div v-if="filteredDownloadingTasks.length === 0" class="py-12 text-center">
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
            <div v-if="filteredCompletedTasks.length === 0" class="py-12 text-center">
              <n-empty description="暂无已完成的任务" />
            </div>
            <div v-else class="flex flex-col gap-2">
              <DownloadTaskItem
                v-for="task in filteredCompletedTasks"
                :key="task.id"
                :task="task" />
            </div>
          </div>
        </template>
      </n-card>
    </div>

    <NewDownloadDialog
      :show="showNewDownloadDialog"
      @close="showNewDownloadDialog = false"
      @confirm="handleCreateDownload" />
    <ScanResumeDialog :show="showScanDialog" @close="showScanDialog = false" />
  </div>
</template>

<style scoped lang="scss">
.n-card {
  background-color: var(--cardColor);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bg-white {
  background-color: var(--cardColor);
}
</style>
