# deduplicator
deduplicator is a data deduplication library built on Deno,
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
  diff(values: T[]): Promise<T[]>
  lastDiff(value: T): Promise<boolean>

  close(): void
}
```
