import { DownloadUrlToPath, OpenDirByDialog } from 'backend/core/app'
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { FileInfo, SettledFileInfo } from 'naive-ui/es/upload/src/interface'

export function useUpdateSavingDir() {
  const message = useMessage()
  const dirPath = ref('')

  async function selectSavingDir() {
    const res = await OpenDirByDialog()
    if (res.data) {
      dirPath.value = res.data
    } else if (res.error) {
      message.error(res.error)
    }
  }

  return { dirPath, selectSavingDir }
}

export function useManageRegexSelect() {
  const regText = ref('')
  const selectedReg = ref('')

  const regList: SelectMixedOption[] = [
    { label: '图片', value: '(https|http)://.*.(jpg|png|jpeg|gif)' },
    { label: '视频', value: '(https|http)://.*.(mp4|rmvb|mkv|avi)' }
  ]

  function handleSelect(v: string) {
    regText.value = v
    selectedReg.value = v
  }

  return { regText, selectedReg, regList, handleSelect }
}

export function useAnalysisFileContent(regText: Ref<string>) {
  const message = useMessage()

  const fileList = shallowRef<FileInfo[]>([])
  const searched = shallowRef<string[]>([])

  function handleSelectFile(files: SettledFileInfo[]) {
    fileList.value = files.slice(-1)
  }

  async function analysisContent() {
    const currentFile = fileList.value[0]
    const file = currentFile.file
    if (!file) return

    try {
      const text = await file.text()
      const reg = new RegExp(regText.value, 'ig')
      const contents = text.match(reg) || []
      searched.value = contents
      removeDuplicates()
      message.success('分析完成')
    } catch (err) {
      message.error(err as any)
    }
  }

  /** 去重 */
  function removeDuplicates() {
    if (!searched.value.length) return

    const freq = new Set<string>()
    const dst: string[] = []

    searched.value.forEach(str => {
      if (freq.has(str)) {
        return
      }

      freq.add(str)
      dst.push(str)
    })

    searched.value = dst
  }

  return { fileList, searched, analysisContent, handleSelectFile }
}

export function useManageDownloader(searched: Ref<string[]>, dirPath: Ref<string>) {
  const message = useMessage()

  const isDownloading = ref(false)
  const downloadCount = ref(0)

  async function handleDownload() {
    const reqs: Promise<any>[] = []
    isDownloading.value = true
    for (const url of searched.value) {
      if (!isDownloading.value) {
        message.info('已停止下载')
        return
      }

      const downFn = DownloadUrlToPath(url, dirPath.value).then(msg => {
        !msg && downloadCount.value++
        const i = reqs.findIndex(f => f === downFn)
        reqs.splice(i, 1)
      })
      reqs.push(downFn)

      if (reqs.length >= 5) {
        await Promise.any(reqs)
      }
    }
  }

  function stopDownload() {
    isDownloading.value = false
  }

  return { isDownloading, downloadCount, handleDownload, stopDownload }
}
