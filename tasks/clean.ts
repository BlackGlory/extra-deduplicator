import { each } from 'https://esm.sh/extra-promise@6.0.8'
import { uniq } from 'https://esm.sh/iterable-operator@4.0.6'
import { Storage } from '@utils/storage.ts'

const ids = Deno.args
await each(uniq(ids), async id => {
  const storage = await Storage.create(id)
  await storage.remove()
})
