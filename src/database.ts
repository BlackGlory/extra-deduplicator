import { Database } from 'https://deno.land/x/sqlite3@0.11.1/mod.ts'
import { migrate } from './utils/migrate.ts'
import { parseMigrationFile } from 'npm:migration-files@0.4.2'
import { map } from 'https://esm.sh/extra-promise@6.0.8'
import { isFinite } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { cache } from 'https://deno.land/x/cache@0.2.13/mod.ts'

interface IShrinkOptions {
  target: number
  threshold: number
}

const migrationFiles = await map(
  ['001-initial.sql']
, async filename => {
    const url = new URL(`../migrations/${filename}`, import.meta.url)
    const file = await cache(url)
    return file
  }
)

export async function openDatabase(filename = ':memory:'): Promise<Database> {
  const migrations = await map(migrationFiles, async file => {
    const content = await Deno.readTextFile(file.path)
    return parseMigrationFile(file.url.href, content)
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
    db.prepare(`
      DELETE FROM hash
       ORDER BY id ASC
       LIMIT (
               SELECT COUNT(*) as count
                 FROM hash
             ) - $target
    `).run({ $target: options.target })
  }
}
