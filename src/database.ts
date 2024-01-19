import { Database } from 'https://deno.land/x/sqlite3@0.10.0/mod.ts'
import { migrate } from '@utils/migrate.ts'
import { findMigrationFilenames, readMigrationFile } from 'npm:migration-files@0.4.1'
import { map } from 'https://esm.sh/extra-promise@6.0.8'
import { getAppRoot } from '@utils/get-app-root.ts'
import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'
import { isFinite } from 'https://esm.sh/@blackglory/prelude@0.3.4'

interface IShrinkOptions {
  target: number
  threshold: number
}

export async function openDatabase(filename: string = ':memory:'): Promise<Database> {
  const migrations = await map(
    await findMigrationFilenames(path.join(getAppRoot(), 'migrations'))
  , readMigrationFile
  )
  const db = new Database(filename)
  migrate(db, migrations)

  return db
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
