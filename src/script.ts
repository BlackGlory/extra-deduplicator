import { Observable } from 'https://esm.sh/rxjs@7.8.1'
import { Awaitable } from 'https://esm.sh/@blackglory/prelude@0.3.4'

export interface INotification {
  id?: string | number | null
  title?: string | null
  message?: string | null

  imageUrl?: string | null
  iconUrl?: string | null
  url?: string | null

  /**
   * 以毫秒为单位的Unix时间戳.
   */
  expires?: number | null
}

export interface IOptions {
  mode: Mode
}

export enum Mode {
  /**
   * 保留返回的所有通知, 保留的通知不会被记录.
   */
  Passthrough

  /**
   * 保留返回的所有通知, 保留的通知会被记录.
   * 该模式的唯一作用是便于以后切换到KeepDiff或KeepLatestDiff.
   */
, KeepAll

  /**
   * 保留返回的通知里不同于已记录通知的通知, 保留的通知会被记录.
   */
, KeepDiff

  /**
   * 仅当返回的通知跟上一个已记录通知不同时保留, 保留的通知会被记录.
   */
, KeepLatestDiff
}

export interface IScript<Options extends IOptions> {
  fn: () => ScriptResult<Options>
  options: Options
}

export type ScriptResult<Options extends IOptions> =
| Awaitable<ScriptValue<Options>>
| Observable<ScriptValue<Options>>
| Iterable<ScriptValue<Options>>
| AsyncIterable<ScriptValue<Options>>

export type ScriptValue<Options extends IOptions> = {
  [Mode.Passthrough]: INotification | INotification[]
  [Mode.KeepAll]: INotification | INotification[]
  [Mode.KeepDiff]: INotification[]
  [Mode.KeepLatestDiff]: INotification
}[Options['mode']]

export function script<Args extends unknown[], Options extends IOptions>(
  fn: (...args: Args) => ScriptResult<Options>
, options: Options
): (...args: Args) => IScript<Options> {
  return (...args) => ({
    fn: () => fn(...args)
  , options
  })
}
