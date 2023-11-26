import { Observable } from 'npm:rxjs@^7.8.1'
import { Awaitable } from 'npm:@blackglory/prelude@^0.3.4'

export interface INotification {
  id?: string | number
  title?: string
  message?: string

  imageUrl?: string
  iconUrl?: string
  url?: string
  expires?: number
}

export interface IOptions {
  filter: NotificationFilter
}

export interface IContext {
  fetch: typeof globalThis.fetch
}

export enum NotificationFilter {
  /**
   * 直通, 不过滤返回的通知, 通知亦不会被记录.
   */
  Passthrough

  /**
   * 保留返回的所有通知, 与Passthough类似, 但保留的通知将被记录下来.
   */
, KeepAll

  /**
   * 保留返回的通知里不同于记录的通知, 保留的通知将被记录下来.
   */
, KeepDiff

  /**
   * 仅当返回的通知跟上一个记录的通知不同时保留, 保留的通知将被记录下来.
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
  [NotificationFilter.Passthrough]: INotification | INotification[]
  [NotificationFilter.KeepAll]: INotification | INotification[]
  [NotificationFilter.KeepDiff]: INotification[]
  [NotificationFilter.KeepLatestDiff]: INotification
}[Options['filter']]

export function script<Args extends unknown[], Options extends IOptions>(
  fn: (context: IContext, ...args: Args) => ScriptResult<Options>
, options: Options
): (...args: Args) => IScript<Options> {
  return (...args) => ({
    fn: context => fn(context, ...args)
  , options
  })
}
