import { each } from 'https://esm.sh/extra-promise@6.0.8'
import { upgradeScript } from '@utils/upgrade-script.ts'

const filenames = Deno.args
await each(filenames, upgradeScript)
