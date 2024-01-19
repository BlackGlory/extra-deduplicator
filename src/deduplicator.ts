import { zip } from 'https://esm.sh/iterable-operator@4.0.6'
import { isntEmptyArray, assert, Awaitable, isPositiveInfinity, isFinite } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { map } from 'https://esm.sh/extra-promise@6.0.8'
import { addHashes, addLastHash, openDatabase } from '@src/database.ts'
import { Database } from 'https://deno.land/x/sqlite3@0.10.0/mod.ts'
import { stringify } from 'https://esm.sh/extra-json-stable-stringify@0.1.2'
import { sha256 } from 'https://esm.sh/extra-compatible@0.2.2'

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
    const hashes = await map(values, this.hash)

    const newHashes = addHashes(this.db, hashes, this.shrink)

    if (isntEmptyArray(newHashes)) {
      const hashToValue = Object.fromEntries(zip(hashes, values))

      return newHashes.map(hash => hashToValue[hash])
    } else {
      return []
    }
  }

  async lastDiff(value: T): Promise<boolean> {
    const hash = await this.hash(value)

    return addLastHash(this.db, hash, this.shrink)
  }
}
