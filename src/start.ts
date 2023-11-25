import ms from 'https://esm.sh/ms@2.1.3'
import { isAsyncIterable, isIterable, isArray, isntEmptyArray } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { isObservable } from 'https://esm.sh/rxjs@7.8.1'
import { delay } from 'https://esm.sh/extra-promise@6.0.8'
import { retryUntil, anyOf, notRetryOnCommonFatalErrors, exponentialBackoff, tap } from 'https://esm.sh/extra-retry@0.4.3'
import { INotification, IScript, IOptions, NotificationFilter, ScriptReturnValue } from '@src/script.ts'
import { findUnrecordedNotifications, equalsLatestDigest } from '@utils/find-unrecorded-notifications.ts'
import config from '@root/config.ts'

export async function start<Options extends IOptions>(
  script: IScript<Options>
, {
    interval = ms('1m')
  , once = false
  , ignoreInitialCommit = true
  , ignoreStartupCommit = false
  , storage = 'memory<TODO>'
  }: {
    interval?: number
    once?: boolean
    ignoreInitialCommit?: boolean
    ignoreStartupCommit?: boolean
    storage?: string
  } = {}
): Promise<void> {
  do {
    // 用户脚本因为网络问题而出现错误的情况非常普遍, 有必要捕获错误防止崩溃.
    await retryUntil(
      anyOf(
        notRetryOnCommonFatalErrors
      , tap(({ error }) => console.error(error))
      , exponentialBackoff({
          baseTimeout: ms('1s')
        , maxTimeout: ms('1m')
        , jitter: false
        })
      )
    , (async () => {
        const result = await script.fn({ fetch })

        if (isIterable(result) || isAsyncIterable(result)) {
          for await (const value of result) {
            await handleValue(value)
          }
        } else if (isObservable(result)) {
          await new Promise<void>((resolve, reject) => {
            result.subscribe({
              async next(value): Promise<void> {
                await handleValue(value)
              }
            , error: reject
            , complete: resolve
            })
          })
        } else {
          await handleValue(result)
        }
      })
    )

    await delay(interval)
  } while (!once)

  async function handleValue(value: ScriptReturnValue<Options>): Promise<void> {
    switch (script.options.filter) {
      case NotificationFilter.Passthrough: {
        const notifications = normalize(value)

        if (isntEmptyArray(notifications)) {
          await config.notify(notifications)
        }

        break
      }
      case NotificationFilter.KeepAll: {
        const notifications = normalize(value)

        if (isntEmptyArray(notifications)) {
          await findUnrecordedNotifications(notifications, storage)
          await config.notify(notifications)
        }

        break
      }
      case NotificationFilter.KeepDiff: {
        const notifications = value as INotification[]

        if (isntEmptyArray(notifications)) {
          const unrecordedNotifications = await findUnrecordedNotifications(
            notifications
          , storage
          )

          if (isntEmptyArray(unrecordedNotifications)) {
            await config.notify(unrecordedNotifications)
          }
        }

        break
      }
      case NotificationFilter.KeepLatestDiff: {
        const notification = value as INotification

        if (!await equalsLatestDigest(notification, storage)) {
          await config.notify([notification])
        }

        break
      }
    }

    function normalize<T>(value: T | T[]): T[] {
      return isArray(value)
           ? value
           : [value]
    }
  }
}
