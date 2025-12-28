export enum BackendRespCode {
  SUCCESS = 200,
  FAILURE = 500
}

export interface BackendResp<T> {
  code: BackendRespCode
  data: T | null
  message: string
}

export type Nullable<T> = T | null

export type MaybeArray<T> = T | T[]

export type MaybePromise<T> = T | Promise<T>

export type Callback<T = void> = (arg: T) => void

export type StrictDict<T = any> = Record<string, T | undefined>
