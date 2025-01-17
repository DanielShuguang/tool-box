<script lang="ts" setup>
import { useInitDisk, useSearchFile } from './logic'

const selectedPoint = ref<string[]>([])

const { diskMountPoints } = useInitDisk()

const { searchText, renderItems, isRunning, isStopping, handleSearch, handleStopSearchTask } =
  useSearchFile(diskMountPoints)
</script>

<template>
  <div class="flex flex-col gap-[10px]">
    <n-form label-placement="left">
      <n-form-item label="文件名">
        <n-input v-model:value="searchText" />
      </n-form-item>
      <n-form-item label="需要搜索的磁盘">
        <n-checkbox-group v-model:value="selectedPoint">
          <n-space item-class="flex">
            <n-checkbox v-for="disk in diskMountPoints" :value="disk" :label="disk" :key="disk" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item>
        <n-button v-if="isRunning" :loading="isStopping" @click="handleStopSearchTask">
          取消
        </n-button>
        <n-button v-else type="primary" @click="handleSearch">搜索</n-button>
      </n-form-item>
    </n-form>

    <div class="flex-1 min-h-0 bg-[#fff] border-(1px solid #ddd) p-[10px] overflow-auto">
      <n-virtual-list :visible-items-props="{}" :item-size="42" :items="renderItems">
        <template #default="{ item, index }">
          <div class="flex items-center justify-between px-[20px]">
            <div>{{ index + 1 }}</div>
            <div>{{ item.path }}</div>
          </div>
        </template>
      </n-virtual-list>
    </div>
  </div>
</template>
