<script setup lang="ts">
import { FolderOutline, ArrowUpOutline, ArrowDownOutline, SearchOutline } from '@vicons/ionicons5'
import type { SortOption, AudioFile } from '../hooks/usePlaylist'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { useMusicPlayerContext } from '../contexts/PlayerContext'
import { useMusicPlayerStore, usePlaybackProgressStore } from '@/stores/musicPlayer'
import { usePlaylist } from '../hooks/usePlaylist'
import { getTrackTitle, getTrackArtist } from '../utils/musicUtils'
import { eventBus } from '../utils/eventBus'
import { useListSelection } from '../hooks/useListSelection'
import { useSelectionStore } from '@/stores/selection'
import { StrictDict } from '@/types/common'
import PlaylistList from './PlaylistList.vue'

const emit = defineEmits<{
  drop: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
}>()

const context = useMusicPlayerContext()
const store = useMusicPlayerStore()
const playlistObj = usePlaylist()
const progressStore = usePlaybackProgressStore()
const { currentTrackId } = storeToRefs(progressStore)
const selectionStore = useSelectionStore()
const { clearSelection } = selectionStore
const { selectedCount, hasSelection, selectedIds } = storeToRefs(selectionStore)

const { sortOption, sortOrder } = storeToRefs(store)

const { filteredPlaylist: playlist, setSearchQuery, searchQuery } = playlistObj

const { removeTrack, removeTracks, clearPlaylist, selectFolder, playTrack } = context

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
  const labelMap: StrictDict<string, SortOption> = {
    default: '默认',
    name: '文件名',
    title: '标题',
    artist: '艺术家',
    album: '专辑'
  }
  return labelMap[sortOption.value] || '默认'
})

const contextMenuShow = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTrack = ref<AudioFile | null>(null)

const contextMenuOptions = computed<DropdownMixedOption[]>(() => {
  const hasSel = hasSelection.value

  const header = hasSel
    ? { label: `已选择 ${selectedCount.value} 首歌曲`, key: 'header', disabled: true }
    : null

  const options: DropdownMixedOption[] = []

  if (header) {
    options.push(header)
  }

  // 仅当当前右键歌曲是唯一选中项时，才认为“仅选中当前”
  const onlySelectedCurrent =
    selectedIds.value.size === 1 && selectedIds.value.has(contextMenuTrack.value?.id || '')
  // 当满足“仅选中当前”或“没有任何选中”时，视为“单条操作”场景
  const isSingleAction = onlySelectedCurrent || !hasSel
  if (isSingleAction) {
    // 单条操作：显示“播放”与“查看详情”
    options.push({ label: '播放', key: 'play' })
    options.push({ type: 'divider', key: 'd1' })
    options.push({ label: '查看详情', key: 'info' })
  } else {
    // 多条操作：仅先插入分隔线，后续再插入“批量删除”
    options.push({ type: 'divider', key: 'd1' })
  }

  // 添加到播放列表的二级菜单
  const otherPlaylists = playlistObj.playlists.value.filter(
    p => p.id !== playlistObj.currentPlaylistId.value
  )
  if (otherPlaylists.length > 0) {
    // 获取当前要添加的歌曲列表
    const tracksToAdd = isSingleAction
      ? ([contextMenuTrack.value].filter(Boolean) as AudioFile[])
      : playlist.value.filter(item => selectedIds.value.has(item.id))

    options.push({
      label: '添加到播放列表',
      key: 'addToPlaylist',
      children: otherPlaylists.map(playlist => {
        // 检查目标播放列表中是否已存在要添加的歌曲
        const existingIds = new Set(playlist.tracks.map(t => t.id))
        const hasAllTracks = tracksToAdd.every(t => existingIds.has(t.id))

        return {
          label: playlist.name,
          key: `addToPlaylist_${playlist.id}`,
          disabled: hasAllTracks // 如果所有歌曲都已存在，则禁用该选项
        }
      })
    })
  }

  if (isSingleAction) {
    options.push({ label: '从列表中移除', key: 'remove' })
  } else {
    options.push({ label: '批量删除', key: 'removeSelected' })
  }

  return options
})

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

const {
  isAllSelected,
  handleRowClick,
  handleRowDoubleClick,
  handleBackgroundClick,
  toggleSelectAll,
  playSelected,
  removeSelected,
  isSelected,
  selectionBoxStyle,
  temporarilyHighlightedIds,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp
} = useListSelection(() => playlist.value, {
  clearOnBackgroundClick: true,
  containerRef: containerProps.ref
})

function handleSortSelect(key: string) {
  store.setSortOption(key as SortOption)
}

function handleActionSelect(key: string) {
  switch (key) {
    case 'addFolder':
      selectFolder()
      break
    case 'clear':
      clearPlaylist()
      break
  }
}

function handleContextMenuSelect(key: string) {
  const track = contextMenuTrack.value

  switch (key) {
    case 'play':
      if (track) {
        playTrack(track.id)
      }
      break
    case 'playSelected':
      playSelected(id => playTrack(id))
      break
    case 'info':
      if (track) {
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
      }
      break
    case 'remove':
      if (track) {
        removeTrack(track.id)
      }
      break
    case 'removeSelected':
      if (removeTracks) {
        const removedIds = removeSelected()
        removeTracks(removedIds)
      } else {
        const removedIds = removeSelected()
        removedIds.forEach(id => removeTrack(id))
      }
      break
    default:
      // 处理添加到播放列表的二级菜单选项
      if (key.startsWith('addToPlaylist_')) {
        const targetPlaylistId = key.replace('addToPlaylist_', '')
        // 获取要添加的歌曲列表
        let tracksToAdd: AudioFile[] = []

        // 仅当当前右键歌曲是唯一选中项时，才认为“仅选中当前”
        const onlySelectedCurrent =
          selectedIds.value.size === 1 && selectedIds.value.has(contextMenuTrack.value?.id || '')
        // 当满足“仅选中当前”或“没有任何选中”时，视为“单条操作”场景
        const isSingleAction = onlySelectedCurrent || !hasSelection.value

        if (isSingleAction) {
          // 单条操作：只添加当前右键点击的歌曲
          if (contextMenuTrack.value) {
            tracksToAdd = [contextMenuTrack.value]
          }
        } else {
          // 多条操作：添加所有选中的歌曲
          tracksToAdd = playlist.value.filter(item => selectedIds.value.has(item.id))
        }

        if (tracksToAdd.length > 0) {
          store.addToSpecificPlaylist(tracksToAdd, targetPlaylistId)
        }
      }
      break
  }
  handleContextMenuHide()
}

function handleContextMenuHide() {
  contextMenuShow.value = false
}

function handleDblClick(item: AudioFile) {
  handleRowDoubleClick(item, track => playTrack(track.id))
}

function handleRowClickWrapper(item: AudioFile, index: number, event: MouseEvent) {
  handleRowClick(item, index, event)
}

function handleContextMenu(event: MouseEvent, track: AudioFile) {
  event.preventDefault()
  contextMenuTrack.value = track
  if (!isSelected(track.id)) {
    clearSelection()
  }
  contextMenuShow.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
}

function handleClearSearch() {
  searchQuery.value = ''
  setSearchQuery('')
  eventBus.emit('clear-search')
}

// 计算行背景颜色
function getRowBackgroundColor(track: AudioFile) {
  if (currentTrackId.value === track.id) {
    return 'color-mix(in srgb, var(--primaryColor) 15%, transparent)'
  }
  if (isSelected(track.id)) {
    return 'color-mix(in srgb, var(--primaryColor) 10%, transparent)'
  }
  if (temporarilyHighlightedIds.value.has(track.id)) {
    return 'color-mix(in srgb, var(--primaryColor) 5%, transparent)'
  }
  return undefined
}

// 监听搜索查询变化，当搜索内容改变时滚动到顶部
watchDebounced(
  searchQuery,
  newValue => {
    setSearchQuery(newValue)
    // 当搜索内容变化时，滚动到顶部
    containerProps.ref.value?.scrollTo({ top: 0 })
  },
  { debounce: 300 }
)

/**
 * 处理键盘事件
 * @param event 键盘事件对象
 */
function handleKeyDown(event: KeyboardEvent) {
  // 检查是否在输入框中（忽略搜索框输入时的 Delete 操作）
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  // 处理 Delete 键删除选中歌曲
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // 如果有选中的歌曲，则删除选中的歌曲
    if (hasSelection.value) {
      event.preventDefault()
      if (removeTracks) {
        const removedIds = removeSelected()
        removeTracks(removedIds)
      } else {
        const removedIds = removeSelected()
        removedIds.forEach(id => removeTrack(id))
      }
    }
  }
}

// 为组件添加键盘事件监听器
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    class="h-full border-(1px solid) border-[--borderColor] flex flex-row min-h-0 relative min-w-0"
    @drop="emit('drop', $event)"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)">
    <!-- 播放列表列表 -->
    <PlaylistList />
    <!-- 播放列表内容 -->
    <div class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      <div
        class="flex items-center justify-between p-[12px] border-b-(1px solid) border-[--borderColor] bg-[--hoverColor] gap-[8px] flex-shrink-0">
        <div class="flex items-center gap-[8px]">
          <span class="font-bold text-[14px]">
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

      <div
        class="flex-1 relative min-h-0"
        v-bind="containerProps"
        @click="handleBackgroundClick"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp">
        <div class="selection-box" :style="selectionBoxStyle"></div>
        <div v-bind="wrapperProps">
          <div
            v-for="item in list"
            :key="item.data.id"
            :data-index="item.index"
            class="flex items-center px-[12px] border-b-(1px solid) border-[--borderColor] hover:bg-[--hoverColor] cursor-pointer h-[50px] select-none relative transition-all duration-200 ease-out"
            :class="{
              'border-l-[3px]': isSelected(item.data.id),
              'border-l-transparent': !isSelected(item.data.id)
            }"
            :style="{
              backgroundColor: getRowBackgroundColor(item.data),
              borderColor: isSelected(item.data.id) ? 'var(--primaryColor)' : undefined
            }"
            @click.stop="handleRowClickWrapper(item.data, item.index, $event)"
            @dblclick="handleDblClick(item.data)"
            @contextmenu="handleContextMenu($event, item.data)">
            <div
              class="flex-1 min-w-0 flex flex-col justify-around h-full transition-transform duration-200 ease-out"
              :style="{
                transform: isSelected(item.data.id) ? 'translateX(2px)' : 'translateX(0)'
              }">
              <p
                class="text-[14px] truncate transition-colors duration-200"
                :class="{ 'font-medium text-[--primaryColor]': currentTrackId === item.data.id }">
                {{ getTrackTitle(item.data) }}
              </p>
              <p class="text-[12px] text-[--textColor3] truncate transition-opacity duration-200">
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
  </div>
</template>
