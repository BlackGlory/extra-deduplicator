import { each } from 'https://esm.sh/extra-promise@6.0.8'
import { updateScript } from '@utils/update-script.ts'

const filenames = Deno.args
await each(filenames, updateScript)
