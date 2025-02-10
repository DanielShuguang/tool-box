<script lang="ts" setup>
import { Copy } from '@vicons/ionicons5'
import { SearchStatus, useInitDisk, useSearchFile } from './logic'

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
  itemHeight: 30
})

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
  <div class="flex flex-col gap-[10px]">
    <n-form label-placement="left">
      <n-form-item label="文件名">
        <n-input v-model:value="searchText" />
      </n-form-item>
      <n-form-item label="需要搜索的磁盘">
        <n-checkbox class="mr-[10px]" v-model:checked="selectAll" label="全选"></n-checkbox>
        <n-checkbox-group v-model:value="selectedPoint">
          <n-space item-class="flex">
            <n-checkbox v-for="disk in diskMountPoints" :value="disk" :label="disk" :key="disk" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="搜索使用线程数">
        <n-input-number v-model:value="concurrentCount" :min="1" />
        <span class="ml-[15px]">搜索线程越多，速度越快，请根据电脑配置合理设置</span>
      </n-form-item>
      <n-form-item label="搜索文件夹">
        <n-switch v-model:value="supportFolder"></n-switch>
      </n-form-item>
      <n-form-item>
        <n-button v-if="taskStatus === SearchStatus.Default" type="primary" @click="handleSearch">
          搜索
        </n-button>
        <n-button
          v-else
          :loading="taskStatus === SearchStatus.Shutdown"
          @click="handleStopSearchTask"
        >
          取消
        </n-button>
        <n-button v-if="list.length" class="ml-[10px]" @click="clearResult">清空</n-button>
      </n-form-item>
    </n-form>

    <div class="position-relative flex-1 min-h-0">
      <n-spin
        v-if="taskStatus === SearchStatus.Processing"
        class="position-(absolute top-[10px] right-[10px])"
        size="small"
      />
      <div
        class="bg-[--avatarColor] size-full border-(1px solid) border-[--borderColor] p-[10px] box-border"
        :="containerProps"
      >
        <div :="wrapperProps">
          <div
            v-for="item in list"
            :key="item.data.path"
            class="flex items-center px-[10px] h-[30px]"
          >
            <div class="mr-[15px]">{{ item.index + 1 }}.</div>
            <n-popover content-class="max-w-[70vw]" :delay="500">
              <template #trigger>
                <n-highlight
                  class="text-ellipsis overflow-hidden text-nowrap"
                  highlight-class="text-[--errorColor] underline bg-[transparent]"
                  :text="item.data.path"
                  :patterns="[searchText]"
                />
              </template>
              <n-highlight
                :text="item.data.path"
                highlight-class="text-[--errorColor] underline bg-[transparent]"
                :patterns="[searchText]"
              />
            </n-popover>
            <n-icon
              :size="15"
              class="ml-[15px] cursor-pointer hover:text-[--primaryColorHover]"
              title="复制路径"
            >
              <Copy @click="handleCopy(item.data.path)" />
            </n-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
