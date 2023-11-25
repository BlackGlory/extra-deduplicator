import { Awaitable, NonEmptyArray } from 'npm:@blackglory/prelude@^0.3.4'
import { INotification } from '@src/script.ts'

interface IConfig {
  getCookies(domain: string): Awaitable<string | null>
  notify(notifications: NonEmptyArray<INotification>): Awaitable<void>
}

export function config(config: IConfig): IConfig {
  return config
}
