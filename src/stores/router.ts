import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ConfigFile } from '@/utils/storage'

export const useRouterStore = defineStore(
  'router',
  () => {
    const currentRoutePath = ref('/')

    return {
      currentRoutePath
    }
  },
  {
    persist: {
      fileName: ConfigFile.Router,
      key: 'current-route-path'
    }
  }
)
