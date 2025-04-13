interface BackendResp<T> {
  code: number
  data: T | null
  message: string
}

export type Nullable<T> = T | null

export type MaybeArray<T> = T | T[]

export type MaybePromise<T> = T | Promise<T>

export type Callback<T = void> = (arg: T) => void
