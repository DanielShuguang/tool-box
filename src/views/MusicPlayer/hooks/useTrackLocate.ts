import type { AudioFile } from './usePlaylist'

interface UseTrackLocate {
  /**
   * 播放列表数据
   */
  playlist: ComputedRef<AudioFile[]>
  /**
   * 当前播放音乐ID
   */
  currentTrackId: Ref<string | null>
  /**
   * useVirtualList的滚动方法
   */
  scrollTo: (index: number) => void
  /**
   * 容器DOM引用
   */
  containerRef: Ref<HTMLElement | null>
}

/**
 * 音乐定位功能的Hook
 */
export function useTrackLocate(props: UseTrackLocate) {
  const { playlist, currentTrackId, scrollTo, containerRef } = props

  /**
   * 滚动到当前播放的音乐位置
   */
  function scrollToCurrentTrack() {
    const currentId = currentTrackId.value
    if (!currentId) {
      return
    }

    // 查找当前播放音乐在播放列表中的索引
    const currentIndex = playlist.value.findIndex(track => track.id === currentId)
    if (currentIndex === -1) {
      return
    }

    // 使用 useVirtualList 内置方法滚动到目标位置
    scrollTo(currentIndex)
  }

  /**
   * 检查当前播放音乐是否在可视区域内
   * @returns boolean true表示在可视区域内，false表示不在可视区域内
   */
  function isCurrentTrackVisible(): boolean {
    const currentId = currentTrackId.value
    if (!currentId) {
      return true // 没有当前播放音乐，认为是可见的（不需要显示按钮）
    }

    const container = containerRef.value
    if (!container) {
      return false // 容器不存在，认为不可见
    }

    // 查找当前播放音乐在播放列表中的索引
    const currentIndex = playlist.value.findIndex(track => track.id === currentId)
    if (currentIndex === -1) {
      return true // 音乐不在播放列表中，认为是可见的
    }

    // 计算目标滚动位置（虚拟列表中每项高度为50px）
    const itemHeight = 50
    const targetScrollTop = currentIndex * itemHeight
    const containerHeight = container.clientHeight
    const currentScrollTop = container.scrollTop
    const containerBottom = currentScrollTop + containerHeight

    // 检查当前播放音乐是否在可视区域内
    const isVisible =
      targetScrollTop >= currentScrollTop && targetScrollTop <= containerBottom + itemHeight

    return isVisible
  }

  /**
   * 是否需要显示定位按钮
   * 只有当当前播放音乐存在且不在可视区域内时才显示
   */
  const shouldShowLocateButton = () => {
    const currentId = currentTrackId.value
    if (!currentId) {
      return false // 没有当前播放音乐，不显示按钮
    }

    if (playlist.value.length === 0) {
      return false // 播放列表为空，不显示按钮
    }

    // 只有当音乐不在可视区域内时才显示按钮
    return !isCurrentTrackVisible()
  }

  /**
   * 定位按钮的可见性（用于过渡动画）
   */
  const locateButtonVisible = ref(false)

  /**
   * 更新定位按钮的可见性
   */
  function updateLocateButtonVisibility() {
    const shouldShow = shouldShowLocateButton()

    // 如果应该显示但当前不可见，则显示
    if (shouldShow && !locateButtonVisible.value) {
      locateButtonVisible.value = true
    }
    // 如果不应该显示但当前可见，则隐藏
    else if (!shouldShow && locateButtonVisible.value) {
      locateButtonVisible.value = false
    }
  }

  // 监听滚动事件，更新定位按钮可见性（防抖处理）
  const debouncedUpdateVisibility = useDebounceFn(() => {
    updateLocateButtonVisibility()
  }, 100)

  // 监听当前播放音乐变化，更新定位按钮可见性
  watch(currentTrackId, () => {
    nextTick(() => {
      updateLocateButtonVisibility()
    })
  })

  // 监听播放列表变化，更新定位按钮可见性
  watch(
    playlist,
    () => {
      nextTick(() => {
        updateLocateButtonVisibility()
      })
    },
    { deep: true }
  )

  // 组件挂载时初始化定位按钮可见性
  onMounted(() => {
    nextTick(() => {
      updateLocateButtonVisibility()
    })
  })

  return {
    scrollToCurrentTrack,
    isCurrentTrackVisible,
    shouldShowLocateButton,
    locateButtonVisible,
    updateLocateButtonVisibility,
    debouncedUpdateVisibility
  }
}
