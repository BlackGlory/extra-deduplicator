import { Observable } from 'npm:rxjs@^7.8.1'
import { Awaitable } from 'npm:@blackglory/prelude@^0.3.4'

export interface INotification {
  id?: string | number
  title?: string
  message?: string

  imageUrl?: string
  iconUrl?: string
  url?: string

  /**
   * 以毫秒为单位的Unix时间戳.
   */
  expires?: number
}

export interface IOptions {
  mode: Mode
}

export interface IContext {
  fetch: typeof globalThis.fetch
}

export enum Mode {
  /**
   * 保留返回的所有通知, 保留的通知不会被记录.
   */
  Passthrough

  /**
   * 保留返回的所有通知, 保留的通知会被记录.
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
  fn: (context: IContext) => ScriptResult<Options>
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
  fn: (context: IContext, ...args: Args) => ScriptResult<Options>
, options: Options
): (...args: Args) => IScript<Options> {
  return (...args) => ({
    fn: context => fn(context, ...args)
  , options
  })
}
