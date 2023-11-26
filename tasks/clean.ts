import { each } from 'npm:extra-promise@^6.0.8'
import { uniq } from 'npm:iterable-operator@^4.0.6'
import { Storage } from '@utils/storage.ts'

const storageNames = Deno.args
await each(uniq(storageNames), async storageName => {
  const storage = await Storage.create(storageName)
  await storage.remove()
})
