import { getStoragesRoot } from '@utils/paths.ts'
import { remove } from '@utils/fs.ts'

await remove(getStoragesRoot())
