import { Awaitable, NonEmptyArray } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { INotification } from '@src/script.ts'

interface IConfig {
  getCookies(url: string): Awaitable<string | null>
  setCookie(cookie: string): Awaitable<void>

  notify(notifications: NonEmptyArray<INotification>): Awaitable<void>
}

export function config(config: IConfig): IConfig {
  return config
}
