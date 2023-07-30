export interface DownloadItem {
  filename: string
  progress: number
  url: string
  dirPath: string
}

export function useDownloadList() {
  const dialog = useDialog()
  const downloadList = ref<DownloadItem[]>([])

  function createDownloadMission(url: string) {
    const index = downloadList.value.findIndex(x => x.url === url)
    if (index !== -1) {
      dialog.info({
        content: '任务已存在，是否需要覆盖任务？',
        onPositiveClick: () => {},
        onNegativeClick: () => {}
      })
    }
  }

  return { downloadList, createDownloadMission }
}
