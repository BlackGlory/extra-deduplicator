import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'
import { each } from 'https://esm.sh/extra-promise@6.0.8'
import { pipe } from 'https://esm.sh/extra-utils@5.5.2'
import { filterAsync, toArrayAsync } from 'https://esm.sh/iterable-operator@4.0.6'
import { findAllFilenames } from 'npm:extra-filesystem@^0.5.1'
import { getScriptsRoot } from '@utils/paths.ts'
import { upgradeScript } from '@utils/upgrade-script.ts'

const filenames = await pipe(
  getScriptsRoot()
, findAllFilenames
, iter => filterAsync(iter, isScriptFile)
, toArrayAsync
)
await each(filenames, upgradeScript)

function isScriptFile(filename: string): boolean {
  return /^.m?[j|t]sx?$/.test(path.extname(filename))
}
