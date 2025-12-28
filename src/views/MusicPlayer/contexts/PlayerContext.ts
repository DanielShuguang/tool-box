import type { AudioFile } from '../hooks/usePlaylist'
import { noop } from 'lodash-es'

export interface PlayerContext {
  isPlaying: Ref<boolean>
  isLoading: Ref<boolean>
  isAnyLoading: Ref<boolean>
  currentTime: Ref<number>
  duration: Ref<number>
  volume: Ref<number>
  currentTrack: Ref<AudioFile | null>
  togglePlay: () => void
  setVolume: (value: number) => void
  playTrack: (id: string) => void
  playNextTrack: () => void
  playPreviousTrack: () => void
  handleProgressChange: (value: number) => void
  togglePlayMode: () => void
  selectFolder: () => void
  removeTrack: (trackId: string) => void
  removeTracks: (trackIds: string[]) => void
  clearPlaylist: () => void
  stop: () => void
}

export const MusicPlayerContextKey: InjectionKey<PlayerContext> = Symbol('MusicPlayerContext')

export function createMusicPlayerContextDefaults(): PlayerContext {
  return {
    isPlaying: ref(false),
    isLoading: ref(false),
    isAnyLoading: ref(false),
    currentTime: ref(0),
    duration: ref(0),
    volume: ref(1),
    currentTrack: ref(null),
    togglePlay: noop,
    setVolume: noop,
    playTrack: noop,
    playNextTrack: noop,
    playPreviousTrack: noop,
    handleProgressChange: noop,
    togglePlayMode: noop,
    selectFolder: noop,
    removeTrack: noop,
    removeTracks: noop,
    clearPlaylist: noop,
    stop: noop
  }
}

export function useMusicPlayerContext(): PlayerContext {
  const context = inject(MusicPlayerContextKey)
  if (context) {
    return context
  }
  return createMusicPlayerContextDefaults()
}
