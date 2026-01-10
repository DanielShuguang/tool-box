import { ref } from 'vue'
import { useMusicPlayerStore, type AudioFile, type Playlist } from '@/stores/musicPlayer'
import {
  exportToJson,
  exportToM3U8,
  exportToPLS,
  importFromJson,
  importFromM3U8,
  importFromPLS,
  autoDetectFormat,
  type PlaylistFormat,
  type ImportResult
} from '../utils/playlistFormat'
import {
  saveFile,
  readFileContent,
  selectImportFile,
  batchCheckPaths
} from '@/backend-channel/file-io'

export type ConflictType = 'playlistName'

export interface ConflictItem {
  id: string
  type: ConflictType
  playlistName: string
  existingPlaylistId: string
  action: 'skip' | 'rename' | 'overwrite'
  newPlaylistName?: string
}

export interface ImportResultWithConflicts {
  success: number
  failed: number
  invalidPaths: number
  conflicts: ConflictItem[]
}

export function usePlaylistIO() {
  const message = useMessage()
  const dialog = useDialog()
  const musicPlayerStore = useMusicPlayerStore()

  const { playlists, currentPlaylist } = storeToRefs(musicPlayerStore)

  const isExporting = ref(false)
  const isImporting = ref(false)

  async function exportPlaylist(format: PlaylistFormat) {
    if (!currentPlaylist.value) {
      message.warning('当前没有播放列表')
      return
    }

    isExporting.value = true
    try {
      let content = ''
      let defaultName = ''
      let filters: Array<{ name: string; extensions: string[] }> = []

      switch (format) {
        case 'json':
          content = exportToJson(currentPlaylist.value)
          defaultName = `${currentPlaylist.value.name}.json`
          filters = [{ name: 'JSON文件', extensions: ['json'] }]
          break
        case 'm3u8':
          content = exportToM3U8(currentPlaylist.value)
          defaultName = `${currentPlaylist.value.name}.m3u8`
          filters = [{ name: 'M3U8文件', extensions: ['m3u8', 'm3u'] }]
          break
        case 'pls':
          content = exportToPLS(currentPlaylist.value)
          defaultName = `${currentPlaylist.value.name}.pls`
          filters = [{ name: 'PLS文件', extensions: ['pls'] }]
          break
      }

      const filePath = await saveFile(content, defaultName, filters)
      if (filePath) {
        message.success(`成功导出播放列表 "${currentPlaylist.value.name}" 到 ${filePath}`)
      }
    } catch (err) {
      console.error('导出失败:', err)
      message.error(`导出失败：${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      isExporting.value = false
    }
  }

  async function importPlaylist(): Promise<ImportResultWithConflicts | null> {
    const filePath = await selectImportFile([
      { name: '播放列表文件', extensions: ['json', 'm3u8', 'm3u', 'pls'] }
    ])

    if (!filePath) {
      return null
    }

    isImporting.value = true
    try {
      const content = await readFileContent(filePath)
      const format = autoDetectFormat(filePath)

      let importResult: ImportResult
      switch (format) {
        case 'json':
          importResult = importFromJson(content)
          break
        case 'm3u8':
          importResult = importFromM3U8(content)
          break
        case 'pls':
          importResult = importFromPLS(content)
          break
      }

      const { playlist } = importResult

      const filePaths = playlist.tracks.map(t => t.path.replace(/\\/g, '/'))
      const pathExistsMap = await batchCheckPaths(filePaths)

      const validTracks: AudioFile[] = []
      const invalidTracks: AudioFile[] = []

      for (const track of playlist.tracks) {
        const normalizedPath = track.path.replace(/\\/g, '/')
        if (pathExistsMap.get(normalizedPath)) {
          validTracks.push(track)
        } else {
          invalidTracks.push(track)
        }
      }

      const finalPlaylist: Playlist = {
        ...playlist,
        tracks: validTracks
      }

      const conflicts = detectConflicts(finalPlaylist)

      const invalidCount = playlist.tracks.length - validTracks.length
      if (invalidCount > 0) {
        message.warning(`导入的播放列表中有 ${invalidCount} 首歌曲文件不存在`)
      }

      const success = await applyImport(finalPlaylist, conflicts)

      return {
        success: success ? validTracks.length : 0,
        failed: success ? 0 : validTracks.length,
        invalidPaths: invalidCount,
        conflicts
      }
    } catch (err) {
      console.error('导入失败:', err)
      message.error(`导入失败：${err instanceof Error ? err.message : '未知错误'}`)
      return null
    } finally {
      isImporting.value = false
    }
  }

  function detectConflicts(playlist: Playlist): ConflictItem[] {
    const conflicts: ConflictItem[] = []

    const existingPlaylist = playlists.value.find(p => p.name === playlist.name)
    if (existingPlaylist) {
      conflicts.push({
        id: `conflict-${playlist.id}`,
        type: 'playlistName',
        playlistName: playlist.name,
        existingPlaylistId: existingPlaylist.id,
        action: 'rename',
        newPlaylistName: generateUniqueName(playlist.name)
      })
    }

    return conflicts
  }

  function generateUniqueName(baseName: string): string {
    let counter = 2
    let newName = `${baseName} (${counter})`

    while (playlists.value.some(p => p.name === newName)) {
      counter++
      newName = `${baseName} (${counter})`
    }

    return newName
  }

  async function applyImport(
    playlist: Playlist,
    conflicts: ConflictItem[],
    conflictResolutions?: Map<string, ConflictItem['action']>
  ): Promise<boolean> {
    try {
      let finalPlaylist = playlist

      for (const conflict of conflicts) {
        const action = conflictResolutions?.get(conflict.id) || conflict.action

        switch (action) {
          case 'skip':
            return false
          case 'rename':
            finalPlaylist = {
              ...finalPlaylist,
              name: conflict.newPlaylistName || generateUniqueName(finalPlaylist.name)
            }
            break
          case 'overwrite':
            const confirmed = await new Promise<boolean>(resolve => {
              dialog.warning({
                title: '确认覆盖',
                content: `确定要用导入的播放列表覆盖现有的播放列表 "${conflict.playlistName}" 吗？`,
                positiveText: '确定',
                negativeText: '取消',
                onPositiveClick: () => resolve(true),
                onNegativeClick: () => resolve(false)
              })
            })
            if (!confirmed) return false
            break
        }
      }

      musicPlayerStore.createPlaylist(finalPlaylist.name)
      const newPlaylistId = musicPlayerStore.playlists.find(
        (p: Playlist) => p.name === finalPlaylist.name
      )?.id
      if (newPlaylistId) {
        const targetPlaylist = musicPlayerStore.playlists.find(
          (p: Playlist) => p.id === newPlaylistId
        )
        if (targetPlaylist) {
          targetPlaylist.tracks = [...finalPlaylist.tracks]
          targetPlaylist.sortOption = finalPlaylist.sortOption
          targetPlaylist.sortOrder = finalPlaylist.sortOrder
        }
      }

      return true
    } catch (err) {
      console.error('应用导入失败:', err)
      message.error('应用导入失败')
      return false
    }
  }

  return {
    isExporting,
    isImporting,
    exportPlaylist,
    importPlaylist,
    detectConflicts,
    generateUniqueName,
    applyImport
  }
}
