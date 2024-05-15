import { DownloadUrlToPath, OpenDirByDialog, GetCpuInfo, SaveDataToFile } from 'backend/core/App'
import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { excludeFileTypes } from '@/utils/binary-file-types'
import { UploadFileInfo, UploadSettledFileInfo } from 'naive-ui'
import { EventsOn } from 'runtime'
import { debounce } from 'lodash-es'

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

  const fileList = shallowRef<UploadFileInfo[]>([])
  const searched = shallowRef<string[]>([])

  function handleSelectFile(files: UploadSettledFileInfo[]) {
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
    downloadCount.value = 0
    for (const url of searched.value) {
      if (!isDownloading.value) {
        await Promise.allSettled(reqs)
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

    await Promise.allSettled(reqs)

    message.info('下载完成')
    isDownloading.value = false
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

interface OutputObject {
  module: string
  message: string
}

export function useBackendOutput() {
  const outputs = ref<string[]>([])
  const outputRef = ref<HTMLDivElement>()

  const clear = EventsOn('backend:output', ({ module, message }: OutputObject) => {
    if (module !== 'download') return

    outputs.value.push(message)
    if (outputs.value.length > 100) {
      outputs.value.shift()
    }

    updateOutputScroll()
  })

  const updateOutputScroll = debounce(() => {
    if (!outputRef.value) return

    outputRef.value.scrollTop = outputRef.value.scrollHeight
  }, 200)

  function clearOutputs() {
    outputs.value.length = 0
  }

  onUnmounted(() => clear())

  return { outputs, outputRef, clearOutputs }
}
