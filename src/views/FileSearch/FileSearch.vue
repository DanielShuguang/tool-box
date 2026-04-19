<script lang="ts" setup>
import {
  Copy,
  FolderOpenOutline,
  DocumentTextOutline,
  SearchOutline,
  DocumentTextOutline as FileTextIcon
} from '@vicons/ionicons5'
import {
  getCorrectSize,
  SearchStatus,
  useInitDisk,
  useSearchFile,
  useViewFileInExplorer
} from './logic'
import PathHighlight from './PathHighlight.vue'

const { diskMountPoints, selectedPoint, selectAll } = useInitDisk()

const {
  searchText,
  renderItems,
  taskStatus,
  supportFolder,
  concurrentCount,
  clearResult,
  handleSearch,
  handleStopSearchTask
} = useSearchFile(selectedPoint)

const { containerProps, list, wrapperProps } = useVirtualList(renderItems, {
  itemHeight: 30,
  overscan: 10
})

const { openInExplorer } = useViewFileInExplorer()

const { copy } = useClipboard()

const message = useMessage()

async function handleCopy(path: string) {
  try {
    await copy(path)
    message.success('复制成功')
  } catch (error) {
    message.error('复制失败')
    console.error(error)
  }
}

// 统计数据
const totalResults = computed(() => renderItems.value.length)
const fileCount = computed(() => renderItems.value.filter(item => !item.isDir).length)
const folderCount = computed(() => renderItems.value.filter(item => item.isDir).length)
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <!-- 页面标题 -->
    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <h2 class="text-lg font-semibold">文件搜索</h2>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 overflow-auto p-4">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-blue-500">
              <FileTextIcon />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">搜索结果</div>
              <div class="text-xl font-bold">{{ totalResults }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-orange-500">
              <DocumentTextOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">文件数</div>
              <div class="text-xl font-bold">{{ fileCount }}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <div class="flex items-center gap-2">
            <n-icon size="20" class="text-green-500">
              <FolderOpenOutline />
            </n-icon>
            <div>
              <div class="text-xs text-gray-500">文件夹数</div>
              <div class="text-xl font-bold">{{ folderCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索配置 -->
      <n-card :bordered="false" class="mb-4">
        <template #header>
          <div class="flex items-center gap-2">
            <n-icon size="18"><SearchOutline /></n-icon>
            <span class="text-base font-medium">搜索配置</span>
          </div>
        </template>

        <div class="flex flex-col gap-4">
          <n-input
            v-model:value="searchText"
            placeholder="输入文件名关键词"
            :disabled="taskStatus === SearchStatus.Processing">
            <template #prefix>
              <n-icon size="16"><SearchOutline /></n-icon>
            </template>
          </n-input>

          <div>
            <div class="flex items-center gap-2 mb-2">
              <n-checkbox v-model:checked="selectAll" label="全选" />
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <n-checkbox-group v-model:value="selectedPoint">
                <n-space :item-style="{ display: 'flex' }">
                  <n-checkbox
                    v-for="disk in diskMountPoints"
                    :key="disk"
                    :value="disk"
                    :label="disk" />
                </n-space>
              </n-checkbox-group>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-1 block">搜索线程数</label>
              <n-input-number
                v-model:value="concurrentCount"
                :min="1"
                class="w-full"
                :disabled="taskStatus === SearchStatus.Processing" />
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">包含文件夹</label>
              <div class="flex items-center h-[34px]">
                <n-switch
                  v-model:value="supportFolder"
                  :disabled="taskStatus === SearchStatus.Processing" />
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 操作栏 -->
      <n-card :bordered="false" class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <n-button
              v-if="taskStatus === SearchStatus.Default"
              type="primary"
              :disabled="!selectedPoint.length || !searchText"
              @click="handleSearch">
              搜索
            </n-button>
            <n-button
              v-else
              :loading="taskStatus === SearchStatus.Shutdown"
              type="warning"
              @click="handleStopSearchTask">
              取消搜索
            </n-button>
            <n-button v-if="renderItems.length" @click="clearResult">清空结果</n-button>
          </div>
          <span v-if="renderItems.length" class="text-sm text-gray-500">
            共找到
            <b class="text-gray-700 font-semibold">{{ renderItems.length }}</b>
            个结果
          </span>
        </div>
      </n-card>

      <!-- 搜索结果 -->
      <n-card v-show="renderItems.length" :bordered="false">
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-base font-medium">搜索结果</span>
            <n-spin v-if="taskStatus === SearchStatus.Processing" size="small" />
          </div>
        </template>

        <template #header-extra>
          <span class="text-xs text-gray-400">点击路径可打开所在文件夹</span>
        </template>

        <div class="result-panel flex-1 min-h-0">
          <div class="result-body" v-bind="containerProps">
            <div v-bind="wrapperProps">
              <div v-for="item in list" :key="item.data.path" class="result-row">
                <span class="row-index">{{ item.index + 1 }}</span>
                <n-tooltip :delay="300">
                  <template #trigger>
                    <n-icon
                      :size="14"
                      class="row-type-icon shrink-0"
                      :class="item.data.isDir ? 'text-orange-500' : 'text-gray-400'">
                      <FolderOpenOutline v-if="item.data.isDir" />
                      <DocumentTextOutline v-else />
                    </n-icon>
                  </template>
                  {{ item.data.isDir ? '文件夹' : '文件' }}
                </n-tooltip>
                <n-tooltip content-class="max-w-[70vw]" :delay="500">
                  <template #trigger>
                    <PathHighlight
                      class="row-path"
                      highlight-class="text-red-500 underline bg-transparent"
                      :data="item.data.path"
                      :search="searchText"
                      component-type="a"
                      @click="openInExplorer(item.data)" />
                  </template>
                  <PathHighlight
                    :data="item.data.path"
                    highlight-class="text-red-500 underline bg-transparent"
                    :search="searchText" />
                </n-tooltip>
                <span v-if="!item.data.isDir" class="row-size">
                  {{ getCorrectSize(item.data.size) }}
                </span>
                <n-tooltip>
                  <template #trigger>
                    <n-icon size="14" class="row-copy" @click="handleCopy(item.data.path)">
                      <Copy />
                    </n-icon>
                  </template>
                  复制路径
                </n-tooltip>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>
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

.result-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  overflow: hidden;

  .result-body {
    flex: 1;
    overflow-y: auto;
    background-color: var(--actionColor);
  }
}

.result-row {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  gap: 8px;
  border-bottom: 1px solid var(--dividerColor);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--hoverColor, rgba(128, 128, 128, 0.08));

    .row-copy {
      opacity: 1;
    }
  }
}

.row-index {
  font-size: 11px;
  color: var(--textColor3);
  font-variant-numeric: tabular-nums;
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.row-type-icon {
  flex-shrink: 0;
}

.row-path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  cursor: pointer;
  color: var(--textColorBase);

  &:hover {
    text-decoration: underline;
  }
}

.row-size {
  font-size: 11px;
  color: var(--infoColor);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.row-copy {
  opacity: 0;
  cursor: pointer;
  color: var(--textColor3);
  flex-shrink: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;

  &:hover {
    color: var(--primaryColor);
  }
}
</style>
