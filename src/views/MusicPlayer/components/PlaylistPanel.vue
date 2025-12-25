<script setup lang="ts">
const emit = defineEmits<{
  drop: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
}>()

import { computed } from 'vue'
import { NInput, NIcon, NDropdown, NModal, NDescriptions, NDescriptionsItem } from 'naive-ui'
import { FolderOutline, ArrowUpOutline, ArrowDownOutline, SearchOutline } from '@vicons/ionicons5'
import { useVirtualList } from '@vueuse/core'
import type { SortOption, AudioFile } from '../hooks/usePlaylist'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { getTrackTitle, getTrackArtist } from '../utils/musicUtils'
import { eventBus } from '../utils/eventBus'

const context = useMusicPlayerContext()

const {
  filteredPlaylist: playlist,
  currentTrackId,
  sortOption,
  sortOrder,
  removeTrack,
  clearPlaylist
} = context

const sortOptions = [
  { label: '文件名', key: 'name' },
  { label: '标题', key: 'title' },
  { label: '艺术家', key: 'artist' },
  { label: '专辑', key: 'album' }
]

const actionOptions = [
  { label: '添加文件夹', key: 'addFolder' },
  { label: '清空列表', key: 'clear' }
]

const sortLabel = computed(() => {
  const labelMap: Record<SortOption, string> = {
    default: '默认',
    name: '文件名',
    title: '标题',
    artist: '艺术家',
    album: '专辑'
  }
  return labelMap[sortOption.value] || '默认'
})

const searchQuery = computed({
  get: () => context.searchQuery.value,
  set: val => context.setSearchQuery(val)
})

const contextMenuShow = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTrack = ref<AudioFile | null>(null)

const contextMenuOptions: DropdownMixedOption[] = [
  { label: '播放', key: 'play' },
  { label: '查看详情', key: 'info' },
  { type: 'divider', key: 'd1' },
  { label: '从列表中移除', key: 'remove' }
]

const infoModalShow = ref(false)
const infoModalTitle = ref('')
const infoModalData = ref<Record<string, string> | null>(null)

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => playlist.value),
  {
    itemHeight: 50,
    overscan: 10
  }
)

function handleSortSelect(key: string) {
  context.setSortOption(key as SortOption)
}

function handleActionSelect(key: string) {
  switch (key) {
    case 'addFolder':
      context.selectFolder()
      break
    case 'clear':
      clearPlaylist()
      break
  }
}

function handleContextMenuSelect(key: string) {
  const track = contextMenuTrack.value
  if (!track) return

  switch (key) {
    case 'play':
      context.playTrack(track.id)
      break
    case 'info':
      infoModalTitle.value = getTrackTitle(track)
      infoModalData.value = {
        文件名: track.name || '未知',
        路径: track.path || '未知',
        标题: track.title || '未知',
        艺术家: track.artist || '未知艺术家',
        专辑: track.album || '未知专辑',
        时长: '未知'
      }
      infoModalShow.value = true
      break
    case 'remove':
      removeTrack(track.id)
      break
  }
  handleContextMenuHide()
}

function handleContextMenuHide() {
  contextMenuShow.value = false
}

function handleDblClick(id: string) {
  context.playTrack(id)
}

function handleContextMenu(event: MouseEvent, track: AudioFile) {
  event.preventDefault()
  contextMenuShow.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuTrack.value = track
}

function handleClearSearch() {
  searchQuery.value = ''
  context.setSearchQuery('')
  eventBus.emit('clear-search')
}
</script>

<template>
  <div
    class="flex-1 border-(1px solid) border-[--borderColor] flex flex-col min-h-0 relative min-w-0"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <div
      class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor] gap-[8px]">
      <div class="flex items-center gap-[8px]">
        <span class="font-bold text-[14px]">播放列表 ({{ playlist.length }})</span>
        <n-dropdown :options="sortOptions" @select="handleSortSelect" trigger="click">
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
        v-model:value="searchQuery"
        :bordered="false"
        placeholder="搜索歌曲..."
        clearable
        size="small"
        class="flex-1!"
        @clear="handleClearSearch">
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

    <div class="flex-1 overflow-auto" v-bind="containerProps" @click="handleContextMenuHide">
      <div v-bind="wrapperProps">
        <div
          v-for="item in list"
          :key="item.data.id"
          class="flex items-center px-[12px] border-b-(1px solid) border-[--borderColor] hover:bg-[--hoverColor] transition-colors cursor-pointer h-[50px] select-none"
          :style="{
            backgroundColor:
              currentTrackId === item.data.id
                ? 'color-mix(in srgb, var(--primaryColor) 15%, transparent)'
                : undefined
          }"
          @dblclick="handleDblClick(item.data.id)"
          @contextmenu="handleContextMenu($event, item.data)">
          <div class="flex-1 min-w-0 flex flex-col justify-around h-full">
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
      v-model:show="infoModalShow"
      preset="card"
      :title="infoModalTitle"
      style="width: 400px">
      <n-descriptions :column="1" label-placement="left" v-if="infoModalData">
        <n-descriptions-item v-for="(value, key) in infoModalData" :key="key" :label="key">
          {{ value }}
        </n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </div>
</template>
