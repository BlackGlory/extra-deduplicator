import ms from 'npm:ms@^2.1.3'
import { Awaitable, isAsyncIterable, isIterable, isArray, isntEmptyArray } from 'npm:@blackglory/prelude@^0.3.4'
import { isObservable } from 'npm:rxjs@^7.8.1'
import { delay } from 'npm:extra-promise@^6.0.8'
import { retryUntil, anyOf, notRetryOnCommonFatalErrors, exponentialBackoff, tap } from 'npm:extra-retry@^0.4.3'
import { INotification, IScript, IOptions, NotificationFilter, ScriptResult, ScriptValue } from '@src/script.ts'
import { findUnrecordedNotifications, equalsLatestDigest } from '@utils/find-unrecorded-notifications.ts'
import config from '@root/config.ts'

interface IStartOptions {
  interval?: number
  once?: boolean
  ignoreInitialCommit?: boolean
  ignoreStartupCommit?: boolean
  storage?: string
}

export async function start<Options extends IOptions>(
  script: IScript<Options>
, {
    interval = ms('1m')
  , once = false
  , ignoreInitialCommit = true
  , ignoreStartupCommit = false
  , storage = 'memory<TODO>'
  }: IStartOptions = {}
): Promise<void> {
  while (true) {
    // 用户脚本因为网络问题而抛出错误的情况非常普遍, 有必要捕获错误和重试.
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
        const result = script.fn({ fetch })
        await handleResult(result, handleValue)
      })
    )

    if (once) break

    await delay(interval)
  }

  async function handleValue(value: ScriptValue<Options>): Promise<void> {
    switch (script.options.filter) {
      case NotificationFilter.Passthrough: {
        const notifications = normalizeValue(value)

        if (isntEmptyArray(notifications)) {
          await config.notify(notifications)
        }

        break
      }
      case NotificationFilter.KeepAll: {
        const notifications = normalizeValue(value)

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
  }
}

export async function test<Options extends IOptions>(
  script: IScript<Options>
, _: IStartOptions
): Promise<void> {
  const result = script.fn({ fetch })
  await handleResult(result, handleValue)

  function handleValue(value: ScriptValue<Options>): void {
    const notifications = normalizeValue(value)

    console.debug(notifications)
  }
}

async function handleResult<Options extends IOptions>(
  result: ScriptResult<Options>
, handleValue: (value: ScriptValue<Options>) => Awaitable<void>
): Promise<void> {
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
    await handleValue(await result)
  }
}

function normalizeValue<T>(value: T | T[]): T[] {
  return isArray(value)
       ? value
       : [value]
}
