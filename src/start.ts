import ms from 'npm:ms@^2.1.3'
import { toArray, zip, difference, uniq } from 'npm:iterable-operator@^4.0.6'
import { Awaitable, isAsyncIterable, isIterable, isArray, isEmptyArray, isntEmptyArray } from 'npm:@blackglory/prelude@^0.3.4'
import { isObservable } from 'npm:rxjs@^7.8.1'
import { map, delay } from 'npm:extra-promise@^6.0.8'
import { retryUntil, anyOf, notRetryOnCommonFatalErrors, exponentialBackoff, tap } from 'npm:extra-retry@^0.4.3'
import { INotification, IScript, IOptions, NotificationFilter, ScriptResult, ScriptValue } from '@src/script.ts'
import { Storage } from '@utils/storage.ts'
import { appDestructor } from '@utils/graceful-exit.ts'
import { hashNotification } from '@utils/hash-notification.ts'
import config from '@root/config.ts'

interface IStartOptions {
  /**
   * 用户脚本执行的间隔时间, 这通常只对返回值为Awaitable的用户脚本有意义.
   */
  interval?: number

  /**
   * 决定该用户脚本是否应该在第一次执行后停下, 这通常只对返回值为Awaitable的用户脚本有意义.
   */
  once?: boolean

  /**
   * 是否忽略用户脚本的初始提交.
   * 即无论提交过滤结果如何, 都不将其发送给notify函数.
   */
  ignoreInitialCommit?: boolean

  /**
   * 是否忽略用户脚本此次启动后的首次提交.
   * 即无论提交过滤结果如何, 都不将其发送给notify函数.
   */
  ignoreStartupCommit?: boolean

  /**
   * 该用户脚本使用的存储.
   * 在省略此项的情况下, 将创建随机名称的临时存储, 存储会在程序退出时删除.
   */
  storage?: string
}

export async function start<Options extends IOptions>(
  script: IScript<Options>
, {
    interval = ms('1m')
  , once = false
  , ignoreInitialCommit = true
  , ignoreStartupCommit = false
  , storage: storageName
  }: IStartOptions = {}
): Promise<void> {
  const storage: Storage = await createStorage()

  let isInitialCommit = isEmptyArray(await storage.getNotificationDigestDatabase().all())
  let isStartupCommit = true
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

  async function createStorage(): Promise<Storage> {
    if (storageName) {
      return await Storage.create(storageName)
    } else {
      const storage = await Storage.create(crypto.randomUUID())
      appDestructor.defer(() => storage.removeSync())
      return storage
    }
  }

  async function handleValue(value: ScriptValue<Options>): Promise<void> {
    switch (script.options.filter) {
      case NotificationFilter.Passthrough: {
        const notifications = normalizeValue(value)

        if (isntEmptyArray(notifications)) {
          if (ignoreInitialCommit && isInitialCommit) break
          if (ignoreStartupCommit && isStartupCommit) break

          await config.notify(notifications)
        }

        break
      }
      case NotificationFilter.KeepAll: {
        const notifications = normalizeValue(value)

        if (isntEmptyArray(notifications)) {
          const digests = await map(notifications, hashNotification)

          await storage.lock(async () => {
            const digestDatabase = storage.getNotificationDigestDatabase()
            const oldDigests = await digestDatabase.all()
            const newDigests = toArray(difference(uniq(digests), oldDigests))

            if (isntEmptyArray(newDigests)) {
              await digestDatabase.append(newDigests)
            }
          })

          if (ignoreInitialCommit && isInitialCommit) break
          if (ignoreStartupCommit && isStartupCommit) break

          await config.notify(notifications)
        }

        break
      }
      case NotificationFilter.KeepDiff: {
        const notifications = value as INotification[]

        if (isntEmptyArray(notifications)) {
          const digests = await map(notifications, hashNotification)

          const newNotifications = await storage.lock(async () => {
            const digestDatabase = storage.getNotificationDigestDatabase()
            const oldDigests = await digestDatabase.all()
            const newDigests = toArray(difference(uniq(digests), oldDigests))

            if (isntEmptyArray(newDigests)) {
              await digestDatabase.append(newDigests)

              const digestToNotification = Object.fromEntries(zip(digests, notifications))
              return newDigests.map(digest => digestToNotification[digest])
            } else {
              return []
            }
          })

          if (isntEmptyArray(newNotifications)) {
            if (ignoreInitialCommit && isInitialCommit) break
            if (ignoreStartupCommit && isStartupCommit) break

            await config.notify(newNotifications)
          }
        }

        break
      }
      case NotificationFilter.KeepLatestDiff: {
        const notification = value as INotification
        const digest = await hashNotification(notification)

        await storage.lock(async () => {
          const digestDatabase = storage.getNotificationDigestDatabase()
          const lastestDigest = await digestDatabase.last()

          if (digest !== lastestDigest) {
            digestDatabase.append([digest])

            if (ignoreInitialCommit && isInitialCommit) return
            if (ignoreStartupCommit && isStartupCommit) return

            return config.notify([notification])
          }
        })

        break
      }
    }

    isInitialCommit = false
    isStartupCommit = false
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
