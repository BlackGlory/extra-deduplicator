import { toArray, zip, difference, uniq } from 'https://esm.sh/iterable-operator@4.0.6'
import { JSONValue, isntEmptyArray } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { map } from 'https://esm.sh/extra-promise@6.0.8'
import { sha256 } from 'https://esm.sh/extra-compatible@0.2.1'
import { RecordsFile } from '@utils/records-file.ts'
import { MutexHub } from '@utils/mutex-hub.ts'

const mutexById = new MutexHub()

export async function findUnrecordedValues<T>(
  id: string
, values: T[]
, format: (value: T) => JSONValue[]
): Promise<T[]> {
  const digests = await map(values, x => sha256(JSON.stringify(format(x))))
  const digestToValue = Object.fromEntries(zip(digests, values))
  const file = new RecordsFile(`data/${id}/records`, {
    shrinkTarget: 500
  , shrinkThreshold: 1000
  })

  return await mutexById.acquire(id, async () => {
    const oldDigests = await file.read()
    const newDigests = toArray(difference(uniq(digests), oldDigests))
    if (isntEmptyArray(newDigests)) {
      await file.append(newDigests)
      return newDigests.map(digest => digestToValue[digest])
    } else {
      return []
    }
  })
}
