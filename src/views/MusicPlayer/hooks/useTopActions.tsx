import { NIcon } from 'naive-ui'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import type { SortOption } from './usePlaylist'
import RepeatOutline from '@vicons/ionicons5/es/RepeatOutline'
import ShuffleOutline from '@vicons/ionicons5/es/ShuffleOutline'
import FolderOutline from '@vicons/ionicons5/es/FolderOutline'
import TrashOutline from '@vicons/ionicons5/es/TrashOutline'
import DownloadOutline from '@vicons/ionicons5/es/DownloadOutline'
import CloudUploadOutline from '@vicons/ionicons5/es/CloudUploadOutline'
import type { PlaylistFormat } from '../utils/playlistFormat'

export type UseTopActionsOptions = {
  playMode: ReturnType<typeof import('./usePlayMode').usePlayMode>
  audioCore: ReturnType<typeof import('./useAudioCore').useAudioCore>
  playlist: ReturnType<typeof import('./usePlaylist').usePlaylist>
  coordinator: ReturnType<typeof import('./usePlayerCoordinator').usePlayerCoordinator>
  playlistIO?: ReturnType<typeof import('./usePlaylistIO').usePlaylistIO>
}

export function useTopActions(options: UseTopActionsOptions) {
  const { playMode, audioCore, playlist, coordinator, playlistIO } = options

  const playModeIcons: Record<string, typeof RepeatOutline> = {
    sequence: RepeatOutline,
    loop: RepeatOutline,
    single: RepeatOutline,
    random: ShuffleOutline
  }

  const playModeLabels: Record<string, string> = {
    sequence: '顺序播放',
    loop: '列表循环',
    single: '单曲循环',
    random: '随机播放'
  }

  const currentPlayModeIcon = computed(() => playModeIcons[playMode.playMode.value])
  const currentPlayModeLabel = computed(() => playModeLabels[playMode.playMode.value])

  const progressPercent = computed(() => {
    if (audioCore.duration.value === 0) return 0
    return (audioCore.currentTime.value / audioCore.duration.value) * 100
  })

  function handleProgressChange(value: number) {
    const time = (value / 100) * audioCore.duration.value
    audioCore.seekTo(time)
  }

  function handleVolumeChange(value: number) {
    coordinator.setVolume(value / 100)
  }

  const sortOptions: Array<{ label: string; key: SortOption } & DropdownMixedOption> = [
    { label: '默认排序', key: 'default' },
    { label: '按歌名', key: 'title' },
    { label: '按歌手', key: 'artist' },
    { label: '按专辑', key: 'album' },
    { label: '按文件名', key: 'name' }
  ]

  const sortLabels: Record<SortOption, string> = {
    default: '默认',
    title: '歌名',
    artist: '歌手',
    album: '专辑',
    name: '文件名'
  }

  function getSortLabel(option: SortOption) {
    return sortLabels[option] || '默认'
  }

  const actionOptions: DropdownMixedOption[] = [
    {
      label: '导出播放列表',
      key: 'export',
      icon: () => (
        <NIcon size={14}>
          <DownloadOutline />
        </NIcon>
      ),
      children: [
        {
          label: '导出当前播放列表',
          key: 'exportCurrent',
          children: [
            { label: 'JSON格式', key: 'export-json' },
            { label: 'M3U8格式', key: 'export-m3u8' },
            { label: 'PLS格式', key: 'export-pls' }
          ]
        }
      ]
    },
    {
      label: '导入播放列表',
      key: 'import',
      icon: () => (
        <NIcon size={14}>
          <CloudUploadOutline />
        </NIcon>
      )
    },
    { type: 'divider', key: 'd1' },
    {
      label: '添加文件夹',
      key: 'addFolder',
      icon: () => (
        <NIcon size={14}>
          <FolderOutline />
        </NIcon>
      )
    },
    { type: 'divider', key: 'd2' },
    {
      label: '清空播放列表',
      key: 'clear',
      icon: () => (
        <NIcon size={14}>
          <TrashOutline />
        </NIcon>
      )
    }
  ]

  function handleActionSelect(key: string) {
    if (key === 'addFolder') {
      coordinator.selectFolder()
    } else if (key === 'clear') {
      coordinator.clearPlaylist()
    } else if (key.startsWith('export-')) {
      const format = key.replace('export-', '') as PlaylistFormat
      playlistIO?.exportPlaylist(format)
    } else if (key === 'import') {
      playlistIO?.importPlaylist()
    }
  }

  const displayPlayList = computed(() =>
    playlist.searchQuery.value
      ? `${playlist.filteredPlaylist.value.length}/${playlist.playlist.value.length}`
      : playlist.playlist.value.length
  )

  return {
    currentPlayModeIcon,
    currentPlayModeLabel,
    progressPercent,
    handleProgressChange,
    handleVolumeChange,
    sortOptions,
    getSortLabel,
    actionOptions,
    handleActionSelect,
    displayPlayList
  }
}
