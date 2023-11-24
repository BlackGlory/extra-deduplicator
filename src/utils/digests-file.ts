import { assert } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { last, isntEmptyArray, isntNull } from 'https://esm.sh/extra-utils@5.5.2'
import * as fs from 'https://deno.land/std@0.207.0/fs/mod.ts'

export class DigestsFile {
  size: number | null = null

  constructor(
    private filename: string
  , private options: {
      shrinkTarget: number
      shrinkThreshold: number
    }
  ) {
    assert(
      options.shrinkTarget < options.shrinkThreshold
    , 'shrinkTarget must be less than shrinkThreshold'
    )
  }

  async read(): Promise<string[]> {
    await fs.ensureFile(this.filename)

    const text = await Deno.readTextFile(this.filename)
    const records = text.split('\n')
    if (last(records) === '') {
      records.pop()
    }

    this.size = records.length

    return records
  }

  async write(records: string[]): Promise<void> {
    await this._write(records)
    await this.shrink()
  }

  async append(records: string[]): Promise<void> {
    if (isntEmptyArray(records)) {
      await Deno.writeTextFile(this.filename, records.join('\n') + '\n', {
        append: true
      })

      if (isntNull(this.size)) {
        this.size += records.length
      }

      await this.shrink()
    }
  }

  private async shrink(): Promise<void> {
    if (isntNull(this.size) && this.size < this.options.shrinkThreshold) return

    const records = await this.read()
    if (records.length >= this.options.shrinkThreshold) {
      const newRecords = records.slice(records.length - this.options.shrinkTarget)
      await this._write(newRecords)
    }
  }

  private async _write(records: string[]): Promise<void> {
    await Deno.writeTextFile(`${this.filename}.tmp`, records.join('\n') + '\n')
    await Deno.rename(`${this.filename}.tmp`, this.filename)

    this.size = records.length
  }
}
