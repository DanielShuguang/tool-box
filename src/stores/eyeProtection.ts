import { ConfigFile } from '@/utils/storage'
import type { Nullable } from '@/types/common'

export interface EyeProtectionState {
  isOpen: boolean
  closeEyesInterval: Nullable<number>
  restInterval: Nullable<number>
}

export const useEyeProtectionStore = defineStore(
  'eyeProtection',
  () => {
    const isOpen = ref(false)
    const closeEyesInterval = ref<Nullable<number>>(120)
    const restInterval = ref<Nullable<number>>(20)

    return {
      isOpen,
      closeEyesInterval,
      restInterval
    }
  },
  {
    persist: {
      fileName: ConfigFile.EyeProtection,
      key: 'open-eye-protection'
    }
  }
)
