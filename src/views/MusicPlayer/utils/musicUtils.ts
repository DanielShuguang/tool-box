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
