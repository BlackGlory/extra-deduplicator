# extra-deduplicator
A data deduplication library for Deno,
which is designed for extracting new data.

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
