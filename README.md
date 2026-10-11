# extra-deduplicator
A data deduplication library, which is designed for extracting new data.

## Install
```sh
npm install --save extra-deduplicator
```

## Usage
```ts
import { Deduplicator } from 'extra-deduplicator'

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

  diff(values: T[]): Promise<T[]>
  diffLast(value: T): Promise<boolean>

  addAndDiff(values: T[]): Promise<T[]>
  addAndDiffLast(value: T): Promise<boolean>

  close(): void
}
```
