import { DownloadUrlToPath } from 'backend/core/app'
import { EventsOn } from 'runtime'

interface DownloadProgress {
  url: string
  total: number
  current: number
}

interface DownloadInfo {
  url: string
  filename: string
  contentLength: number
  acceptRanges: boolean
  dirPath: string
}

export function useDownload() {
  const percent = ref(0)
  const fileTotalSize = ref(0)

  async function createDownload(url: string, dirPath: string) {
    const res = await DownloadUrlToPath(url, dirPath)

    const stop1 = EventsOn('backend:download-info', (obj: DownloadInfo) => {
      const { contentLength, url: _url } = obj
      if (url !== _url) return

      stop1()
      fileTotalSize.value = contentLength / Math.pow(1024, 2)
    })

    const stop2 = EventsOn('backend:download-progress', (obj: DownloadProgress) => {
      const { current, total, url: _url } = obj
      if (_url !== url) return

      percent.value = Math.ceil((current / total) * 100)
      if (current === total) {
        stop2()
      }
    })
  }

  function changeStatus(state?: boolean) {}

  return { fileTotalSize, percent, changeStatus, createDownload }
}
