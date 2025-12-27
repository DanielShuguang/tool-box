export interface StoreReadyState {
  isReady: Ref<boolean>
  waitForReady: () => Promise<void>
}
