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
