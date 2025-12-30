<script setup lang="ts">
import { SearchOutline } from '@vicons/ionicons5'
import type { AudioFile } from '../hooks/usePlaylist'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { usePlaybackProgressStore } from '@/stores/musicPlayer'
import { usePlaylist } from '../hooks/usePlaylist'
import { getTrackTitle, getTrackArtist } from '../utils/musicUtils'
import { useListSelection } from '../hooks/useListSelection'
import { useSelectionStore } from '@/stores/selection'

const props = defineProps<{
  visible: boolean
  onClose: () => void
}>()

const context = useMusicPlayerContext()
const progressStore = usePlaybackProgressStore()
const playlistObj = usePlaylist()
const selectionStore = useSelectionStore()

const { currentTrackId } = storeToRefs(progressStore)

const { selectedCount, hasSelection } = storeToRefs(selectionStore)

const { filteredPlaylist: playlist, searchQuery } = playlistObj

const { playTrack } = context

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => playlist.value),
  {
    itemHeight: 50,
    overscan: 10
  }
)

const {
  isAllSelected,
  handleRowClick,
  handleRowDoubleClick,
  handleBackgroundClick,
  toggleSelectAll,
  isSelected,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp
} = useListSelection(() => playlist.value, {
  clearOnBackgroundClick: true,
  containerRef: containerProps.ref
})

function handleDblClick(item: AudioFile) {
  handleRowDoubleClick(item, track => playTrack(track.id))
}

function handleRowClickWrapper(item: AudioFile, index: number, event: MouseEvent) {
  handleRowClick(item, index, event)
}

function getRowBackgroundColor(track: AudioFile) {
  if (currentTrackId.value === track.id) {
    return 'color-mix(in srgb, var(--primaryColor) 15%, transparent)'
  }
  if (isSelected(track.id)) {
    return 'color-mix(in srgb, var(--primaryColor) 10%, transparent)'
  }
  return undefined
}
</script>

<template>
  <div
    v-if="props.visible"
    class="fixed inset-0 bg-[--bgColor]/80 backdrop-blur-sm z-20 flex items-end justify-center"
    @click="props.onClose">
    <div
      class="w-full max-w-[800px] max-h-[50vh] bg-[--bgColor] rounded-t-xl shadow-2xl border-(1px solid) border-[--borderColor] transition-all duration-300 ease-in-out transform translate-y-0"
      @click.stop>
      <!-- 头部 -->
      <div
        class="flex items-center justify-between p-[16px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor]">
        <div class="flex items-center gap-[8px]">
          <span class="font-bold text-[16px]">
            播放列表 ({{ playlist.length }})
            <span v-if="hasSelection" class="text-[--primaryColor]">
              - 已选择 {{ selectedCount }} 首
            </span>
          </span>
          <n-button
            v-if="playlist.length > 0"
            size="tiny"
            quaternary
            @click="toggleSelectAll"
            class="cursor-pointer">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </n-button>
        </div>
        <n-input
          v-model:value="searchQuery"
          :bordered="false"
          placeholder="搜索歌曲..."
          clearable
          size="small"
          class="w-[200px]">
          <template #prefix>
            <n-icon size="14">
              <SearchOutline />
            </n-icon>
          </template>
        </n-input>
      </div>

      <!-- 列表内容 -->
      <div
        class="max-h-[calc(50vh-60px)] overflow-hidden relative"
        v-bind="containerProps"
        @click="handleBackgroundClick"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp">
        <div v-bind="wrapperProps">
          <div
            v-for="item in list"
            :key="item.data.id"
            :data-index="item.index"
            class="flex items-center px-[16px] border-b-(1px solid) border-[--borderColor] hover:bg-[--hoverColor] cursor-pointer h-[50px] select-none relative transition-all duration-200 ease-out"
            :class="{
              'border-l-[3px]': isSelected(item.data.id),
              'border-l-transparent': !isSelected(item.data.id)
            }"
            :style="{
              backgroundColor: getRowBackgroundColor(item.data),
              borderColor: isSelected(item.data.id) ? 'var(--primaryColor)' : undefined
            }"
            @click.stop="handleRowClickWrapper(item.data, item.index, $event)"
            @dblclick="handleDblClick(item.data)">
            <div class="flex-1 min-w-0 flex flex-col justify-around h-full">
              <p
                class="text-[14px] text-[--textColor1] truncate transition-colors duration-200 font-medium"
                :class="{
                  'text-[--primaryColor]': currentTrackId === item.data.id
                }">
                {{ getTrackTitle(item.data) }}
              </p>
              <p class="text-[12px] text-[--textColor2] truncate transition-opacity duration-200">
                {{ getTrackArtist(item.data) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 空列表提示 -->
        <div
          v-if="playlist.length === 0"
          class="absolute inset-0 flex items-center justify-center text-[--textColor3]">
          <div class="text-center">
            <p class="text-[14px] mb-2">暂无歌曲</p>
            <p class="text-[12px]">请添加音乐文件到播放列表</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添加过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
