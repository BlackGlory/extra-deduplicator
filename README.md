# extra-deduplicator
A data deduplication library for Deno,
which is designed for extracting new data.

## Usage
```ts
#!/usr/bin/envw -S deno run --allow-all --unstable-ffi
import { Deduplicator } from 'https://deno.land/x/extra_deduplicator@VERSION/mod.ts'

const deduplicator = await Deduplicator.create({ filename: 'dedup.db' })

const records = ['record-1', 'record-2']
const newRecords = await deduplicator.addAndDidff(records)
```

## API
```ts
interface IOptions<T> {
  filename?: string

  hash?: (value: T) => JSONValue

  shrink?: {
    target?: number
    threshold?: number
  }
}

class Deduplicator<T> {
  static create(options?: IOptions): Promise<Deduplicator<T>>

  add(values: T[]): Promise<void>
  addAndDiff(values: T[]): Promise<T[]>
  addAndDiffLast(value: T): Promise<boolean>

  close(): void
}
```
