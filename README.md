# Hallu
Hallu是一个建立在Deno运行时上的数据去重库, 它专为提取新数据而设计.

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
