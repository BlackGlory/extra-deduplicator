import { toArray, zip, difference, uniq } from 'npm:iterable-operator@^4.0.6'
import { isntEmptyArray, last } from 'npm:extra-utils@^5.5.2'
import { map } from 'npm:extra-promise@^6.0.8'
import { sha256 } from 'npm:extra-compatible@^0.2.2'
import { DigestsFile } from '@utils/digests-file.ts'
import { INotification } from "@src/script.ts";
import { storageMutexHub } from '@utils/storage-mutex-hub.ts'
import { getNotificationDigestsPath } from '@utils/paths.ts'

export async function findUnrecordedNotifications(
  notifications: INotification[]
, storage: string
): Promise<INotification[]> {
  const digests = await map(notifications, getNotificationDigest)
  const filename = await getNotificationDigestsPath(storage)

  return await storageMutexHub.acquire(storage, async () => {
    const file = new DigestsFile(filename, {
      shrinkTarget: 500
    , shrinkThreshold: 1000
    })
    const oldDigests = await file.read()
    const newDigests = toArray(difference(uniq(digests), oldDigests))
    if (isntEmptyArray(newDigests)) {
      await file.append(newDigests)
      const digestToValue = Object.fromEntries(zip(digests, notifications))
      return newDigests.map(digest => digestToValue[digest])
    } else {
      return []
    }
  })
}

export async function equalsLatestDigest(
  notification: INotification
, storage: string
): Promise<boolean> {
  const digest = await getNotificationDigest(notification)
  const filename = await getNotificationDigestsPath(storage)

  return await storageMutexHub.acquire(storage, async () => {
    const file = new DigestsFile(filename, {
      shrinkTarget: 500
    , shrinkThreshold: 1000
    })
    const oldDigests = await file.read()
    const lastestDigest = last(oldDigests)

    return digest === lastestDigest
  })
}

async function getNotificationDigest(notification: INotification): Promise<string> {
  const text = JSON.stringify([
    notification.title ?? null
  , notification.message ?? null
  , notification.id ?? null
  ])

  return await sha256(text)
}
