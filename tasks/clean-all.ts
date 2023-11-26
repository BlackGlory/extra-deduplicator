import { remove } from 'npm:extra-filesystem@^0.5.1'
import { getStoragesRoot } from '@utils/paths.ts'

await remove(getStoragesRoot())
