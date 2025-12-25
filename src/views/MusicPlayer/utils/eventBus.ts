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
