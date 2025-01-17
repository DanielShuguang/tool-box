import { cancelSearchTask, searchHarddiskFile } from '@/backend-channel/file-search'
import { getHarddiskInfo } from '@/backend-channel/utils'
import { useRuntimeEvent } from '@/hooks/useRuntimeEvent'
import { debounce } from 'lodash-es'

export function useInitDisk() {
  const diskMountPoints = ref<string[]>([])

  async function getDiskMountPoints() {
    try {
      const disks = await getHarddiskInfo()
      diskMountPoints.value = disks
    } catch (error) {}
  }

  getDiskMountPoints()

  return { diskMountPoints }
}

interface ResultFileModel {
  path: string
  size: number
  type: 'file' | 'dir'
}

export function useSearchFile(diskMountPoints: Ref<string[]>) {
  const searchText = ref('')
  const searchResult = ref<ResultFileModel[]>([])
  const isRunning = ref(false)
  const isStopping = ref(false)

  function handleSearch() {
    searchResult.value = []
    isRunning.value = true

    searchHarddiskFile({
      name: searchText.value,
      disks: diskMountPoints.value
    })
  }

  useRuntimeEvent<ResultFileModel[] | null>('search-disk-file-output', async ({ payload }) => {
    if (!payload) {
      setTimeout(() => {
        isRunning.value = false
        isStopping.value = false
      }, 500)
      return
    }

    searchResult.value.push(...payload)
  })

  const renderItems = useDebounce(searchResult, 500)

  function handleStopSearchTask() {
    isStopping.value = true
    cancelSearchTask()
  }

  return {
    searchText,
    searchResult,
    renderItems,
    isStopping,
    isRunning,
    handleSearch,
    handleStopSearchTask
  }
}
