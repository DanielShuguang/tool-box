# 变更：优化音乐播放器组件通信方式

## 为什么

当前音乐播放器的组件通信方式存在以下问题：

1. **Props 过度传递**：父组件 `MusicPlayer.vue` 将所有状态和方法通过 props 传递给子组件，导致 props 数量过多，组件间耦合度高
2. **代码冗余**：子组件 `PlayerPanel.vue` 和 `PlaylistPanel.vue` 都需要接收大量 props，增加了代码维护成本
3. **类型提示不足**：现有通信方式缺乏良好的类型提示，容易导致类型错误
4. **纯函数分散**：一些纯函数（如 `getTrackTitle`、`getTrackArtist`）分散在组件中，没有统一管理
5. **事件监听内存泄漏**：直接使用 `eventBus.on` 注册事件监听器，若忘记手动移除会导致内存泄漏
6. **上下文获取繁琐**：子组件需要手动处理 context 为 null 的情况，代码重复

为了解决这些问题，需要优化组件通信方式，采用混合通信策略，提升代码的可维护性和可扩展性。

## 变更内容

### 1. 组件通信优化

- **使用 provide/inject 减少 props drilling**：

  - 创建 `MusicPlayerContext`，使用 Symbol 键提供全局状态
  - 子组件通过 inject 获取所需状态和方法
  - 增强类型提示能力

- **引入 mitt 事件总线**：

  - 实现跨组件的事件通信
  - 减少回调函数的传递
  - 支持复杂的组件交互场景

- **保留必要的 props**：
  - 仅保留必要的 props 传递
  - 减少不必要的组件依赖

### 2. 响应式状态优化

- **直接传递 Ref/ComputedRef 对象**：

  - Context 中直接传递 Ref 和 ComputedRef 对象，而非 `.value` 快照值
  - 确保状态变更时自动触发响应式更新
  - 避免手动维护同步逻辑

- **优化播放列表更新逻辑**：

  - 使用 `playerState.value.playlist` 直接修改，而非通过 computed 属性
  - 避免异步存储加载覆盖新添加的音乐

- **Context 接口类型强化**：
  ```typescript
  export interface PlayerContext {
    isPlaying: Ref<boolean>
    isLoading: Ref<boolean>
    currentTime: Ref<number>
    duration: Ref<number>
    volume: Ref<number>
    currentTrack: ComputedRef<AudioFile | null>
    currentTrackId: Ref<string | null>
    searchQuery: Ref<string>
    sortOption: Ref<SortOption>
    sortOrder: Ref<'asc' | 'desc'>
    filteredPlaylist: ComputedRef<AudioFile[]>
    // ...
  }
  ```

### 3. 事件处理优化

- **使用 useEmitter 钩子替代直接 eventBus.on**：

  - 自动在组件卸载时移除事件监听器
  - 防止内存泄漏
  - 简化事件注册代码

  ```typescript
  // 优化前
  eventBus.on('toggle-play', () => {
    togglePlay()
  })
  onUnmounted(() => {
    eventBus.off('toggle-play', handler)
  })

  // 优化后
  useEmitter(
    'toggle-play',
    () => {
      togglePlay()
    },
    { instance: eventBus }
  )
  ```

- **提供上下文默认值获取方法**：

  ```typescript
  export function createMusicPlayerContextDefaults(): PlayerContext {
    return {
      isPlaying: ref(false)
      // ...其他默认值
    }
  }

  export function useMusicPlayerContext(): PlayerContext {
    const context = inject(MusicPlayerContextKey)
    if (context) {
      return context
    }
    return createMusicPlayerContextDefaults()
  }
  ```

### 4. 纯函数提取

- **创建工具函数文件**：
  - 提取 `formatTime` 函数到 `src/views/MusicPlayer/utils/musicUtils.ts`
  - 提取 `getTrackTitle`、`getTrackArtist` 函数到 `src/views/MusicPlayer/utils/musicUtils.ts`
  - 遵循函数式编程原则，确保函数纯度

### 5. 实现细节

- **使用 useMusicPlayerContext 钩子简化组件代码**：

  ```typescript
  // 子组件中直接使用，无需手动处理 null 情况
  import { useMusicPlayerContext } from '../contexts/PlayerContext'

  const context = useMusicPlayerContext()
  const isPlaying = context.isPlaying
  const filteredPlaylist = context.filteredPlaylist
  ```

- **优化后的 MusicPlayer.vue 事件处理**：

  ```typescript
  // 使用 useEmitter 优化事件注册
  import { useEmitter } from '../../utils/event'
  import { eventBus } from './utils/eventBus'

  useEmitter(
    'toggle-play',
    () => {
      if (currentTrack.value) {
        togglePlay()
      }
    },
    { instance: eventBus }
  )

  useEmitter('play-track', coordinator.playTrack, { instance: eventBus })
  useEmitter('play-next', coordinator.playNextTrack, { instance: eventBus })
  useEmitter('play-previous', coordinator.playPreviousTrack, { instance: eventBus })
  useEmitter('seek', coordinator.seek, { instance: eventBus })
  useEmitter('set-volume', setAudioVolume, { instance: eventBus })
  useEmitter('toggle-play-mode', togglePlayMode, { instance: eventBus })
  useEmitter('select-folder', coordinator.selectFolder, { instance: eventBus })
  useEmitter('clear-search', () => setSearchQuery(''), { instance: eventBus })
  ```

- **创建 Context 和工具函数**：

  ```typescript
  // src/views/MusicPlayer/contexts/PlayerContext.ts
  import type { ComputedRef, InjectionKey, Ref } from 'vue'
  import type { AudioFile, SortOption } from '../hooks/usePlaylist'
  import { noop } from 'lodash-es'

  export interface PlayerContext {
    isPlaying: Ref<boolean>
    isLoading: Ref<boolean>
    currentTime: Ref<number>
    duration: Ref<number>
    volume: Ref<number>
    currentTrack: ComputedRef<AudioFile | null>
    currentTrackId: Ref<string | null>
    searchQuery: Ref<string>
    sortOption: Ref<SortOption>
    sortOrder: Ref<'asc' | 'desc'>
    filteredPlaylist: ComputedRef<AudioFile[]>
    togglePlay: () => void
    setVolume: (value: number) => void
    setSearchQuery: (query: string) => void
    setSortOption: (option: SortOption) => void
    playTrack: (id: string) => void
    playNextTrack: () => void
    playPreviousTrack: () => void
    handleProgressChange: (value: number) => void
    togglePlayMode: () => void
    selectFolder: () => void
  }

  export const MusicPlayerContextKey: InjectionKey<PlayerContext> = Symbol('MusicPlayerContext')

  export function createMusicPlayerContextDefaults(): PlayerContext {
    return {
      isPlaying: ref(false),
      isLoading: ref(false),
      currentTime: ref(0),
      duration: ref(0),
      volume: ref(1),
      currentTrack: computed(() => null),
      currentTrackId: ref(null),
      searchQuery: ref(''),
      sortOption: ref('name'),
      sortOrder: ref('asc'),
      filteredPlaylist: computed(() => [] as AudioFile[]),
      togglePlay: noop,
      setVolume: noop,
      setSearchQuery: noop,
      setSortOption: noop,
      playTrack: noop,
      playNextTrack: noop,
      playPreviousTrack: noop,
      handleProgressChange: noop,
      togglePlayMode: noop,
      selectFolder: noop
    }
  }

  export function useMusicPlayerContext(): PlayerContext {
    const context = inject(MusicPlayerContextKey)
    if (context) {
      return context
    }
    return createMusicPlayerContextDefaults()
  }
  ```

- **引入 mitt 事件总线**：

  ```typescript
  // src/views/MusicPlayer/utils/eventBus.ts
  import mitt from 'mitt'

  export type PlayerEvents = {
    'toggle-play': void
    'play-track': string
    'play-next': void
    'play-previous': void
    seek: number
    'set-volume': number
    'toggle-play-mode': void
    'select-folder': void
    'clear-search': void
    'play-track-by-id': string
  }

  export const eventBus = mitt<PlayerEvents>()
  ```

- **提取纯函数**：

  ```typescript
  // src/views/MusicPlayer/utils/musicUtils.ts
  export function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  export function getTrackTitle(track: { title?: string; name?: string } | null): string {
    if (!track) return '未知曲目'
    return track.title || track.name || '未知曲目'
  }

  export function getTrackArtist(track: { artist?: string } | null): string {
    if (!track) return '未知艺术家'
    return track.artist || '未知艺术家'
  }
  ```

- **通用事件处理钩子**：

  ```typescript
  // src/utils/event.ts
  import mitt, { Emitter } from 'mitt'

  export type GlobalEventMap = {
    'theme-change': boolean
    'close-window': void
  }

  export const emitter = mitt<GlobalEventMap>()

  export interface UseEmitterOptions<T extends Record<string, unknown>> {
    once?: boolean
    instance?: Emitter<T>
  }

  export function useEmitter<
    Events extends Record<string, unknown> = GlobalEventMap,
    Key extends keyof Events = keyof Events
  >(event: Key, handler: (arg: Events[Key]) => void, options?: UseEmitterOptions<Events>) {
    const { instance = emitter, once } = options || {}

    const currentInstance = instance as Emitter<any>

    currentInstance.on(event, (...arg) => {
      handler(...arg)
      if (once) {
        off()
      }
    })

    function off() {
      currentInstance.off(event, handler)
    }

    onUnmounted(off)

    return off
  }
  ```

### 6. 组件修改

- **PlayerPanel.vue**：

  - 使用 `useMusicPlayerContext` 获取上下文
  - 直接访问 Ref/ComputedRef 对象，无需 `.value`
  - 代码更简洁，类型更安全

- **PlaylistPanel.vue**：

  - 使用 `useMusicPlayerContext` 获取上下文
  - 使用 `computed` 双向绑定搜索查询
  - 代码更简洁，类型更安全

- **MusicPlayer.vue**：
  - 使用 `provide` 提供上下文
  - 使用 `useEmitter` 注册事件监听器
  - 自动清理，无需手动管理

## 影响

### 受影响规范

- 无（优化现有功能，不影响功能规范）

### 受影响代码

- 修改 `src/views/MusicPlayer/MusicPlayer.vue` - 父组件，添加 provide 逻辑和 useEmitter 事件处理
- 修改 `src/views/MusicPlayer/components/PlayerPanel.vue` - 子组件，使用 useMusicPlayerContext
- 修改 `src/views/MusicPlayer/components/PlaylistPanel.vue` - 子组件，使用 useMusicPlayerContext
- 新增 `src/views/MusicPlayer/contexts/PlayerContext.ts` - 播放器上下文（含 useMusicPlayerContext 钩子）
- 新增 `src/views/MusicPlayer/utils/eventBus.ts` - 事件总线
- 新增 `src/views/MusicPlayer/utils/musicUtils.ts` - 音乐工具函数
- 新增 `src/utils/event.ts` - 通用事件处理钩子 useEmitter

### 性能影响

- 减少 props 传递的开销
- 自动清理事件监听器，防止内存泄漏
- 提升组件渲染性能
- 优化代码结构，提高可维护性

### 兼容性影响

- 不影响现有功能的使用
- 完全向后兼容
- 无需用户额外操作
