import { parseMetadata } from '@utils/metadata.ts'
import { pass } from 'npm:@blackglory/prelude@^0.3.4'
import { ok, toText } from 'npm:extra-response@^0.5.2'

export async function updateScript(filename: string): Promise<boolean> {
  const text = await Deno.readTextFile(filename)
  const metadata = parseMetadata(text)
  for (const updateURL of metadata.updateURLs) {
    try {
      const code = await fetch(updateURL)
        .then(ok)
        .then(toText)
      
      await Deno.writeTextFile(filename, code)

      return true
    } catch {
      pass()
    }
  }

  return false
}
