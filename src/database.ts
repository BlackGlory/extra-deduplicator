import { Database } from '@db/sqlite'
import { migrate } from './utils/migrate.ts'
import { parseMigrationFile } from 'migration-files'
import { map } from 'extra-promise'
import { assert, isFinite } from '@blackglory/prelude'

interface IShrinkOptions {
  target: number
  threshold: number
}

const migrationFilenames = [
  '001-initial.sql'
].map(filename => new URL(`../migrations/${filename}`, import.meta.url).href)

export async function openDatabase(filename = ':memory:'): Promise<Database> {
  const migrations = await map(migrationFilenames, async filename => {
    const content = await fetch(filename).then(res => res.text())

    return parseMigrationFile(filename, content)
  })

  const db = new Database(filename)
  migrate(db, migrations)

  return db
}

export function hasHashes(db: Database, hashes: string[]): boolean[] {
  return hashes.map(hash => {
    const row = db.prepare(`
      SELECT EXISTS(
        SELECT *
         FROM hash
        WHERE hash = $hash
      ) AS hash_exists
    `).get<{ hash_exists: number }>({ $hash: hash })

    return !!row?.hash_exists
  })
}

export function isLastHash(db: Database, hash: string): boolean {
  const row = db.prepare(`
    SELECT hash
      FROM hash
     ORDER BY id DESC
     LIMIT 1
  `).get<{ hash: string }>()

  return row?.hash === hash
}

export function addHashes(
  db: Database
, hashes: string[]
, shrinkOptions: IShrinkOptions
): string[] {
  return db.transaction(() => {
    const newHashes: string[] = []

    for (const hash of hashes) {
      const changes = db.prepare(`
        INSERT INTO hash (hash)
        VALUES ($hash)
            ON CONFLICT DO NOTHING
      `).run({ $hash: hash })

      if (changes === 1) {
        newHashes.push(hash)
      } else {
        // 如果没有行改变, 则说明记录已经存在了, 重新插入此记录以更新其id.
        db.prepare(`
          INSERT INTO hash (hash)
          VALUES ($hash)
        `).run({ $hash: hash })
      }
    }

    shrink(db, shrinkOptions)

    return newHashes
  })()
}

export function addLastHash(
  db: Database
, hash: string
, shrinkOptions: IShrinkOptions
): boolean {
  return db.transaction(() => {
    const row = db.prepare(`
      SELECT hash
        FROM hash
       ORDER BY id DESC
       LIMIT 1
    `).get<{ hash: string }>()

    if (row?.hash === hash) {
      return false
    } else {
      db.prepare(`
        INSERT INTO hash (hash)
        VALUES ($hash)
      `).run({ $hash: hash })
      shrink(db, shrinkOptions)

      return true
    }
  })()
}

function shrink(db: Database, options: IShrinkOptions): void {
  if (isFinite(options.threshold)) {
    db.transaction(() => {
      const count = countHashes(db)

      if (count >= options.threshold) {
        db.prepare(`
          DELETE FROM hash
           ORDER BY id ASC
           LIMIT $limit
        `).run({ $limit: count - options.target })
      }
    })()
  }
}

function countHashes(db: Database): number {
  const row = db.prepare(`
    SELECT COUNT(*) as count
      FROM hash
  `).get<{ count: number }>()
  assert(row)

  return row.count
}
