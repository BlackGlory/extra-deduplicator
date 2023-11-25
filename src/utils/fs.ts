import * as fs from 'https://deno.land/std@0.207.0/fs/mod.ts'

export async function remove(path: string): Promise<void> {
  if (await fs.exists(path)) {
    await Deno.remove(path, { recursive: true })
  }
}
