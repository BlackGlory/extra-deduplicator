import { toArray, uniq, zip } from 'iterable-operator'
import { isntEmptyArray, assert, type Awaitable, isPositiveInfinity, isFinite } from '@blackglory/prelude'
import { map } from 'extra-promise'
import { openDatabase, hasHashes, isLastHash, addHashes, addLastHash } from './database.ts'
import type { Database } from '@db/sqlite'
import { stringify } from 'extra-json-stable-stringify'
import { sha256 } from 'extra-compatible'

export interface IOptions<T> {
  filename?: string

  hash?: (value: T) => Awaitable<string>

  shrink?: {
    target?: number
    threshold?: number
  }
}

export class Deduplicator<T> {
  private constructor(
    private db: Database
  , private hash: (value: T) => Awaitable<string>
  , private shrink: {
      threshold: number
      target: number
    }
  ) {}

  static async create<T>(
    {
      filename
    , hash = value => sha256(stringify(value))
    , shrink: {
        threshold = Infinity
      , target = Math.floor(threshold / 2)
      } = {}
    }: IOptions<T> = {}
  ): Promise<Deduplicator<T>> {
    assert(
      isPositiveInfinity(threshold) || Number.isInteger(threshold)
    , 'The shrink.threshold must be Infinity or an integer'
    )
    assert(
      isPositiveInfinity(target) || Number.isInteger(target)
    , 'The shrink.target must be Infinity or an integer'
    )
    assert(threshold > 1, 'The shrink.threshold must be greater than 1')
    if (isFinite(threshold)) {
      assert(target < threshold, 'The shrink.target must be less than shrink.threshold')
    }

    const db = await openDatabase(filename)

    return new Deduplicator<T>(db, hash, { threshold, target })
  }

  close(): void {
    this.db.close()
  }

  async add(values: T[]): Promise<void> {
    const hashes = await map(values, value => this.hash(value))

    addHashes(this.db, hashes, this.shrink)
  }

  async diff(values: T[]): Promise<T[]> {
    values = toArray(uniq(values))

    const hashes = await map(values, value => this.hash(value))
    const results = hasHashes(this.db, hashes)
    const newValues = values.filter((_, index) => !results[index])

    return newValues
  }

  async diffLast(value: T): Promise<boolean> {
    const hash = await this.hash(value)

    return !isLastHash(this.db, hash)
  }

  async addAndDiff(values: T[]): Promise<T[]> {
    const hashes = await map(values, this.hash)

    const newHashes = addHashes(this.db, hashes, this.shrink)

    if (isntEmptyArray(newHashes)) {
      const hashToValue = Object.fromEntries(zip(hashes, values))

      return newHashes.map(hash => hashToValue[hash])
    } else {
      return []
    }
  }

  async addAndDiffLast(value: T): Promise<boolean> {
    const hash = await this.hash(value)

    return addLastHash(this.db, hash, this.shrink)
  }
}
