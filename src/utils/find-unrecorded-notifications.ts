import { toArray, zip, difference, uniq } from 'https://esm.sh/iterable-operator@4.0.6'
import { isntEmptyArray } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { map } from 'https://esm.sh/extra-promise@6.0.8'
import { sha256 } from 'https://esm.sh/extra-compatible@0.2.1'
import { DigestsFile } from '@utils/digests-file.ts'
import { INotification } from "@src/script.ts";
import { storageMutexHub } from '@utils/storage-mutex-hub.ts'

export async function findUnrecordedNotifications(
  storage: string
, notifications: INotification[]
): Promise<INotification[]> {
  const digests = await map(notifications, async x => {
    const text = JSON.stringify([
      x.title ?? null
    , x.message ?? null
    , x.id ?? null
    ])

    return await sha256(text)
  })

  return await storageMutexHub.acquire(storage, async () => {
    const file = new DigestsFile(`data/storages/${storage}/notification-digests`, {
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
