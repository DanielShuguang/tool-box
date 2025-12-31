<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import type { Playlist } from '../hooks/usePlaylist'
import { usePlaylist } from '../hooks/usePlaylist'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'

const message = useMessage()
const dialog = useDialog()
const playlistObj = usePlaylist()

const {
  playlists,
  currentPlaylistId,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  switchPlaylist
} = playlistObj

// 创建播放列表对话框
const createDialogShow = ref(false)
const createDialogName = ref('')

// 重命名播放列表对话框
const renameDialogShow = ref(false)
const renameDialogId = ref<string | null>(null)
const renameDialogName = ref('')

// 右键菜单
const contextMenuShow = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuPlaylist = ref<Playlist | null>(null)

/**
 * 处理创建播放列表
 */
function handleCreatePlaylist() {
  const name = createDialogName.value.trim()
  if (!name) {
    message.warning('播放列表名称不能为空')
    return
  }

  // 检查名称是否重复
  const exists = playlists.value.some(p => p.name === name)
  if (exists) {
    message.warning('播放列表名称已存在')
    return
  }

  createPlaylist(name)
  createDialogShow.value = false
  createDialogName.value = ''
  message.success('播放列表创建成功')
}

/**
 * 处理删除播放列表
 */
function handleDeletePlaylist(playlistId: string) {
  const playlist = playlists.value.find(p => p.id === playlistId)
  if (!playlist) {
    return
  }

  if (playlist.isDefault) {
    message.warning('默认播放列表不可删除')
    return
  }

  const success = deletePlaylist(playlistId)
  if (success) {
    message.success('播放列表已删除')
  } else {
    message.error('删除播放列表失败')
  }
}

/**
 * 处理重命名播放列表
 */
function handleRenamePlaylist(playlistId: string) {
  const playlist = playlists.value.find(p => p.id === playlistId)
  if (!playlist) {
    return
  }

  if (playlist.isDefault) {
    message.warning('默认播放列表不可重命名')
    return
  }

  renameDialogId.value = playlistId
  renameDialogName.value = playlist.name
  renameDialogShow.value = true
}

/**
 * 确认重命名
 */
function handleConfirmRename() {
  if (!renameDialogId.value) {
    return
  }

  const name = renameDialogName.value.trim()
  if (!name) {
    message.warning('播放列表名称不能为空')
    return
  }

  // 检查名称是否重复（排除当前播放列表）
  const exists = playlists.value.some(p => p.name === name && p.id !== renameDialogId.value)
  if (exists) {
    message.warning('播放列表名称已存在')
    return
  }

  const success = renamePlaylist(renameDialogId.value, name)
  if (success) {
    message.success('播放列表重命名成功')
    renameDialogShow.value = false
    renameDialogId.value = null
    renameDialogName.value = ''
  } else {
    message.error('重命名播放列表失败')
  }
}

/**
 * 处理右键菜单
 */
function handleContextMenu(event: MouseEvent, playlist: Playlist) {
  event.preventDefault()
  event.stopPropagation()
  contextMenuPlaylist.value = playlist
  contextMenuShow.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
}

/**
 * 处理右键菜单选择
 */
function handleContextMenuSelect(key: string) {
  const playlist = contextMenuPlaylist.value
  if (!playlist) {
    return
  }

  switch (key) {
    case 'rename':
      handleRenamePlaylist(playlist.id)
      break
    case 'delete':
      dialog.info({
        type: 'warning',
        title: '确认删除',
        content: `确定要删除播放列表 "${playlist.name}" 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          handleDeletePlaylist(playlist.id)
        }
      })
      break
  }
  handleContextMenuHide()
}

/**
 * 隐藏右键菜单
 */
function handleContextMenuHide() {
  contextMenuShow.value = false
}

/**
 * 处理播放列表点击
 */
function handlePlaylistClick(playlistId: string) {
  switchPlaylist(playlistId)
}

const contextMenuOptions = computed(() => {
  const playlist = contextMenuPlaylist.value
  if (!playlist) {
    return []
  }

  const options: DropdownMixedOption[] = []

  if (!playlist.isDefault) {
    options.push({ label: '重命名', key: 'rename' })
    options.push({ label: '删除', key: 'delete' })
  }

  return options
})
</script>

<template>
  <div
    class="w-[200px] border-r-(1px solid) border-[--borderColor] bg-[--hoverColor] flex flex-col">
    <div class="p-[12px] border-b-(1px solid) border-[--borderColor]">
      <n-button size="small" type="primary" block @click="createDialogShow = true">
        <template #icon>
          <n-icon size="16">
            <AddOutline />
          </n-icon>
        </template>
        新建播放列表
      </n-button>
    </div>

    <div class="flex-1 overflow-auto">
      <div
        v-for="playlist in playlists"
        :key="playlist.id"
        class="px-[12px] py-[8px] cursor-pointer hover:bg-[--hoverColor] transition-colors"
        :class="{
          'bg-[color-mix(in_srgb,var(--primaryColor)_15%,transparent)]':
            currentPlaylistId === playlist.id
        }"
        @click="handlePlaylistClick(playlist.id)"
        @contextmenu="handleContextMenu($event, playlist)">
        <div class="flex items-center justify-between">
          <span
            class="text-[14px] truncate flex-1"
            :class="{
              'font-medium text-[--primaryColor]': currentPlaylistId === playlist.id
            }">
            {{ playlist.name }}
          </span>
          <span v-if="playlist.isDefault" class="text-[10px] text-[--textColor3] ml-[4px]">
            默认
          </span>
        </div>
        <div class="text-[12px] text-[--textColor3] mt-[2px]">{{ playlist.tracks.length }} 首</div>
      </div>
    </div>

    <!-- 创建播放列表对话框 -->
    <n-modal v-model:show="createDialogShow" preset="dialog" title="新建播放列表">
      <n-input
        v-model:value="createDialogName"
        placeholder="请输入播放列表名称"
        :maxlength="50"
        @keyup.enter="handleCreatePlaylist" />
      <template #action>
        <n-button @click="createDialogShow = false">取消</n-button>
        <n-button type="primary" @click="handleCreatePlaylist">确定</n-button>
      </template>
    </n-modal>

    <!-- 重命名播放列表对话框 -->
    <n-modal v-model:show="renameDialogShow" preset="dialog" title="重命名播放列表">
      <n-input
        v-model:value="renameDialogName"
        placeholder="请输入播放列表名称"
        :maxlength="50"
        @keyup.enter="handleConfirmRename" />
      <template #action>
        <n-button @click="renameDialogShow = false">取消</n-button>
        <n-button type="primary" @click="handleConfirmRename">确定</n-button>
      </template>
    </n-modal>

    <!-- 右键菜单 -->
    <n-dropdown
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="contextMenuOptions"
      @select="handleContextMenuSelect"
      @clickoutside="handleContextMenuHide" />
  </div>
</template>
