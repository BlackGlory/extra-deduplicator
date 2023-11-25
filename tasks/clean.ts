import { remove } from '@utils/fs.ts'
import { getStoragePath } from '@utils/paths.ts'
import { each } from 'https://esm.sh/extra-promise@6.0.8'

const storages = Deno.args
await each(storages, clean)

async function clean(storage: string): Promise<void> {
  await remove(getStoragePath(storage))
}
