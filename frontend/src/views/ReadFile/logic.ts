import { DownloadUrlToPath, OpenDirByDialog, GetCpuInfo, SaveDataToFile } from 'backend/core/App'
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { FileInfo, SettledFileInfo } from 'naive-ui/es/upload/src/interface'
import { excludeFileTypes } from '@/utils/binary-file-types'

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
  const selectedReg = ref<string | null>(null)

  const regList: SelectMixedOption[] = [
    { label: '图片', value: '(https|http)://.*\\.(jpg|png|jpeg|gif)' },
    { label: '视频', value: '(https|http)://.*\\.(mp4|rmvb|mkv|avi)' },
    { label: '软件', value: '(https|http)://.*\\.(exe|msi)' },
    { label: '压缩包', value: '(https|http)://.*\\.(zip|7z|rar|iso)' }
  ]

  function handleSelect(v: string) {
    regText.value = v
    selectedReg.value = v
  }

  return { regText, selectedReg, regList, handleSelect }
}

export function useAnalysisFileContent(regText: Ref<string>, dirPath: Ref<string>) {
  const message = useMessage()
  const isUrl = ref(false)

  const fileList = shallowRef<FileInfo[]>([])
  const searched = shallowRef<string[]>([])

  function handleSelectFile(files: SettledFileInfo[]) {
    fileList.value = files.slice(-1)

    const isBinary = excludeFileTypes.some(fileType =>
      fileList.value[0].file?.name.endsWith(`.${fileType}`)
    )
    isBinary && message.warning('文件不是正常文本文件格式，可能会读取失败', { duration: 5000 })
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
      checkContentIsUrl()
      message.success(`分析完成，存在${searched.value.length}条可用数据`, { duration: 5000 })
    } catch (err) {
      message.error(err as any)
    }
  }

  function checkContentIsUrl() {
    isUrl.value = false
    if (!searched.value.length) return

    if (regText.value.includes('http') || regText.value.includes('www.')) {
      isUrl.value = true
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

  async function saveToFile() {
    await SaveDataToFile({
      data: searched.value.join('\n'),
      fullPath: `${dirPath.value}/searched-result.txt`
    })
    message.success('导出完成')
  }

  return { fileList, searched, isUrl, saveToFile, analysisContent, handleSelectFile }
}

export function useManageDownloader(searched: Ref<string[]>, dirPath: Ref<string>) {
  const message = useMessage()
  const { concurrentCount } = useDownloadConcurrent()

  const isDownloading = ref(false)
  const downloadCount = ref(0)
  const maxDownloadCount = ref(5)

  async function handleDownload() {
    const reqs: Promise<any>[] = []
    isDownloading.value = true
    for (const url of searched.value) {
      if (!isDownloading.value) {
        message.info('已停止下载')
        return
      }

      const downFn = DownloadUrlToPath({
        concurrent: concurrentCount.value,
        dirPath: dirPath.value,
        url
      }).then(msg => {
        !msg && downloadCount.value++
        const i = reqs.findIndex(f => f === downFn)
        reqs.splice(i, 1)
      })
      reqs.push(downFn)

      if (reqs.length >= maxDownloadCount.value) {
        await Promise.any(reqs)
      }
    }
  }

  function stopDownload() {
    isDownloading.value = false
  }

  return {
    isDownloading,
    downloadCount,
    concurrentCount,
    maxDownloadCount,
    handleDownload,
    stopDownload
  }
}

export function useDownloadConcurrent() {
  const concurrentCount = ref(5)

  onMounted(async () => {
    const { info, err } = await GetCpuInfo()
    if (info.length && !err) {
      concurrentCount.value = info[0].cores
    }
  })

  return { concurrentCount }
}
