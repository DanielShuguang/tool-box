<script setup lang="ts">
import { NInput, NIcon, NDropdown, NModal, NDescriptions, NDescriptionsItem } from 'naive-ui'
import { FolderOutline, ArrowUpOutline, ArrowDownOutline, SearchOutline } from '@vicons/ionicons5'
import { useVirtualList } from '@vueuse/core'
import type { SortOption } from '../hooks/usePlaylist'
import type { AudioFile } from '../hooks/usePlaylist'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed } from 'vue'

interface Props {
  playlist: AudioFile[]
  currentTrackId: string | null
  searchQuery: string
  sortOption: SortOption
  sortOrder: 'asc' | 'desc'
  sortOptions: Array<{ label: string; key: SortOption }>
  sortLabel: string
  actionOptions: DropdownMixedOption[]
  contextMenuShow: boolean
  contextMenuX: number
  contextMenuY: number
  contextMenuOptions: DropdownMixedOption[]
  contextMenuTrack: AudioFile | null
  infoModalShow: boolean
  infoModalTitle: string
  infoModalData: Record<string, string> | null
}

const props = defineProps<Props>()

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.playlist),
  {
    itemHeight: 50,
    overscan: 10
  }
)

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:sortOption', value: SortOption): void
  (e: 'clearSearch'): void
  (e: 'selectAction', key: string): void
  (e: 'contextMenuShowChange', value: boolean): void
  (e: 'contextMenuSelect', key: string): void
  (e: 'dblClick', id: string): void
  (e: 'contextMenu', event: MouseEvent, track: AudioFile): void
  (e: 'infoModalShowChange', value: boolean): void
}>()

function handleSortSelect(key: string) {
  emit('update:sortOption', key as SortOption)
}

function handleActionSelect(key: string) {
  emit('selectAction', key)
}

function handleContextMenuSelect(key: string) {
  emit('contextMenuSelect', key)
}

function handleContextMenuHide() {
  emit('contextMenuShowChange', false)
}

function handleInfoModalShowChange(value: boolean) {
  emit('infoModalShowChange', value)
}

function getTrackTitle(track: AudioFile): string {
  return track.title || track.name || '未知曲目'
}

function getTrackArtist(track: AudioFile): string {
  return track.artist || '未知艺术家'
}
</script>

<template>
  <div
    class="flex-1 border-(1px solid) border-[--borderColor] flex flex-col min-h-0 relative min-w-0">
    <div
      class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor] gap-[8px]">
      <div class="flex items-center gap-[8px]">
        <span class="font-bold text-[14px]">播放列表 ({{ list.length }})</span>
        <n-dropdown :options="sortOptions" @select="handleSortSelect" :trigger="'click'">
          <n-button size="tiny" quaternary class="flex items-center gap-[4px] cursor-pointer">
            {{ sortLabel }}
            <n-icon size="12">
              <ArrowDownOutline v-if="sortOrder === 'asc'" />
              <ArrowUpOutline v-else />
            </n-icon>
          </n-button>
        </n-dropdown>
      </div>
      <n-input
        :value="searchQuery"
        :bordered="false"
        placeholder="搜索歌曲..."
        clearable
        size="small"
        class="flex-1!"
        @update:value="emit('update:searchQuery', $event)"
        @clear="emit('clearSearch')">
        <template #prefix>
          <n-icon size="14">
            <SearchOutline />
          </n-icon>
        </template>
      </n-input>
      <n-dropdown :options="actionOptions" @select="handleActionSelect" :trigger="'click'">
        <n-button size="tiny" quaternary class="cursor-pointer">
          <template #icon>
            <n-icon size="14">
              <FolderOutline />
            </n-icon>
          </template>
          操作
        </n-button>
      </n-dropdown>
    </div>

    <div
      class="flex-1 overflow-auto"
      v-bind="containerProps"
      @click="emit('contextMenuShowChange', false)">
      <div v-bind="wrapperProps">
        <div
          v-for="item in list"
          :key="item.data.id"
          class="flex items-center px-[12px] border-b-(1px solid) border-[--borderColor] hover:bg-[--hoverColor] transition-colors cursor-pointer h-[50px] box-border"
          :class="{ 'bg-[--activeColor]': currentTrackId === item.data.id }"
          @dblclick="emit('dblClick', item.data.id)"
          @contextmenu="emit('contextMenu', $event, item.data)">
          <div class="flex-1 min-w-0 flex flex-col justify-around h-full box-border">
            <p
              class="text-[14px] truncate"
              :class="{ 'font-medium text-[--primaryColor]': currentTrackId === item.data.id }">
              {{ getTrackTitle(item.data) }}
            </p>
            <p class="text-[12px] text-[--textColor3] truncate">
              {{ getTrackArtist(item.data) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <n-dropdown
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      @select="handleContextMenuSelect"
      @clickoutside="handleContextMenuHide" />
    <n-modal
      :show="infoModalShow"
      preset="card"
      :title="infoModalTitle"
      style="width: 400px"
      @update:show="handleInfoModalShowChange">
      <n-descriptions :column="1" label-placement="left" v-if="infoModalData">
        <n-descriptions-item v-for="(value, key) in infoModalData" :key="key" :label="key">
          {{ value }}
        </n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </div>
</template>
