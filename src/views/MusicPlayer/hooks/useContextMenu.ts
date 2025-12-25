import { computed, h, reactive } from 'vue'
import { NIcon } from 'naive-ui'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import type { AudioFile } from './usePlaylist'
import PlayOutline from '@vicons/ionicons5/es/PlayOutline'
import InformationCircleOutline from '@vicons/ionicons5/es/InformationCircleOutline'
import TrashOutline from '@vicons/ionicons5/es/TrashOutline'

export interface ContextMenuProps {
  show: boolean
  x: number
  y: number
  track: AudioFile | null
}

export function useContextMenu() {
  const menuProps = reactive<ContextMenuProps>({
    show: false,
    x: 0,
    y: 0,
    track: null
  })

  const options = computed<DropdownMixedOption[]>(() => [
    {
      label: '播放',
      key: 'play',
      icon: () => h(NIcon, { size: 14 }, { default: () => h(PlayOutline) })
    },
    { type: 'divider', key: 'd1' },
    {
      label: '查看详情',
      key: 'info',
      icon: () => h(NIcon, { size: 14 }, { default: () => h(InformationCircleOutline) })
    },
    { type: 'divider', key: 'd2' },
    {
      label: '从列表中删除',
      key: 'remove',
      icon: () => h(NIcon, { size: 14 }, { default: () => h(TrashOutline) })
    }
  ])

  function show(e: MouseEvent, track: AudioFile) {
    e.preventDefault()
    menuProps.show = true
    menuProps.x = e.clientX
    menuProps.y = e.clientY
    menuProps.track = track
  }

  function hide() {
    menuProps.show = false
    menuProps.track = null
  }

  function updatePosition(x: number, y: number) {
    menuProps.x = x
    menuProps.y = y
  }

  return {
    menuProps,
    options,
    show,
    hide,
    updatePosition
  }
}
