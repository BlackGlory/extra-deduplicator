import { Awaitable } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { INotification } from '@src/script.ts'

interface IConfig {
  getCookies(domain: string): Awaitable<string | null>
  notify(notifications: INotification[]): Awaitable<void>
}

export function config(config: IConfig): IConfig {
  return config
}
