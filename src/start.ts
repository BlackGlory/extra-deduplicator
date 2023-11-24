import ms from 'https://esm.sh/ms@2.1.3'
import { IScript } from '@src/script.ts'

export async function start(
  script: IScript
, {
    id
  , interval = ms('1m')
  , once = false
  , ignoreInitialCommit = true
  , ignoreStartupCommit = false
  , storage
  }: {
    id?: string
    interval?: number
    once?: boolean
    ignoreInitialCommit?: boolean
    ignoreStartupCommit?: boolean
    storage?: string
  } = {}
): Promise<void> {
  const result = await script.fn({ fetch })
  console.log(result)
}
