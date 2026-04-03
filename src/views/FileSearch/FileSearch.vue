<script lang="ts" setup>
import { Copy, FolderOpenOutline, DocumentTextOutline } from '@vicons/ionicons5'
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
</script>

<template>
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <!-- 搜索配置 -->
    <div class="config-card">
      <p class="section-title">搜索配置</p>
      <n-form label-placement="top" :show-feedback="false" :show-require-mark="false">
        <n-form-item label="文件名">
          <n-input
            v-model:value="searchText"
            placeholder="输入文件名关键词"
            :disabled="taskStatus === SearchStatus.Processing" />
        </n-form-item>
        <n-form-item label="搜索磁盘" class="mt-3">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <n-checkbox v-model:checked="selectAll" label="全选" />
            <n-divider vertical />
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
        </n-form-item>
        <div class="grid grid-cols-2 gap-4 mt-3">
          <n-form-item label="搜索线程数">
            <n-input-number
              v-model:value="concurrentCount"
              :min="1"
              class="w-full"
              :disabled="taskStatus === SearchStatus.Processing" />
          </n-form-item>
          <n-form-item label="包含文件夹">
            <div class="flex items-center h-[34px]">
              <n-switch
                v-model:value="supportFolder"
                :disabled="taskStatus === SearchStatus.Processing" />
            </div>
          </n-form-item>
        </div>
      </n-form>
    </div>

    <!-- 操作栏 -->
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
        <n-button v-if="list.length" @click="clearResult">清空结果</n-button>
      </div>
      <span v-if="list.length" class="text-[13px] text-[--textColor3]">
        共找到
        <b class="text-[--textColorBase] font-semibold">{{ list.length }}</b>
        个结果
      </span>
    </div>

    <!-- 搜索结果 -->
    <div v-show="renderItems.length" class="result-panel flex-1 min-h-0">
      <div class="result-header">
        <p class="section-title !mb-0">搜索结果</p>
        <div class="flex items-center gap-2">
          <span class="text-[12px] text-[--textColor3]">点击路径可打开所在文件夹</span>
          <n-spin v-if="taskStatus === SearchStatus.Processing" size="small" />
        </div>
      </div>
      <div class="result-body" v-bind="containerProps">
        <div v-bind="wrapperProps">
          <div v-for="item in list" :key="item.data.path" class="result-row">
            <span class="row-index">{{ item.index + 1 }}</span>
            <n-tooltip :delay="300">
              <template #trigger>
                <n-icon
                  :size="14"
                  class="row-type-icon shrink-0"
                  :class="item.data.isDir ? 'text-[--warningColor]' : 'text-[--textColor3]'">
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
                  highlight-class="text-[--errorColor] underline bg-[transparent]"
                  :data="item.data.path"
                  :search="searchText"
                  component-type="a"
                  @click="openInExplorer(item.data)" />
              </template>
              <PathHighlight
                :data="item.data.path"
                highlight-class="text-[--errorColor] underline bg-[transparent]"
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
  </div>
</template>

<style scoped lang="scss">
.config-card {
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  padding: 14px 16px;
  background-color: var(--cardColor);
  flex-shrink: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--textColor3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 10px;
}

.result-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  overflow: hidden;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--cardColor);
    border-bottom: 1px solid var(--borderColor);
    flex-shrink: 0;
  }

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
