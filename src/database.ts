import Database, { Database as IDatabase } from 'better-sqlite3'
import { migrate } from '@blackglory/better-sqlite3-migrations'
import { findMigrationFilenames, readMigrationFile } from 'migration-files'
import { map } from 'extra-promise'
import { assert, isFinite } from '@blackglory/prelude'
import { findUpPackageFilename } from 'extra-filesystem'
import path from 'path'

interface IShrinkOptions {
  target: number
  threshold: number
}


export async function openDatabase(filename = ':memory:'): Promise<IDatabase> {
  const packageFilename = await findUpPackageFilename(import.meta.dirname)
  assert(packageFilename, 'package.json not found')

  const packageRoot = path.dirname(packageFilename)
  const migrationsPath = path.join(packageRoot, 'migrations')
  const migrationFilenames = await findMigrationFilenames(migrationsPath)
  const migrations = await map(migrationFilenames, readMigrationFile)

  const db = new Database(filename)
  migrate(db, migrations)

  return db
}

export function hasHashes(db: IDatabase, hashes: string[]): boolean[] {
  return hashes.map(hash => {
    const row = db.prepare<
      { hash: string }
    , { hash_exists: number }
    >(`
      SELECT EXISTS(
        SELECT *
         FROM hash
        WHERE hash = $hash
      ) AS hash_exists
    `).get({ hash })

    return !!row?.hash_exists
  })
}

export function isLastHash(db: IDatabase, hash: string): boolean {
  const row = db.prepare<
    []
  , { hash: string }
  >(`
    SELECT hash
      FROM hash
     ORDER BY id DESC
     LIMIT 1
  `).get()

  return row?.hash === hash
}

export function addHashes(
  db: IDatabase
, hashes: string[]
, shrinkOptions: IShrinkOptions
): string[] {
  return db.transaction(() => {
    const newHashes: string[] = []

    for (const hash of hashes) {
      const { changes } = db.prepare<{ hash: string }>(`
        INSERT INTO hash (hash)
        VALUES ($hash)
            ON CONFLICT DO NOTHING
      `).run({ hash })
      
      if (changes === 1) {
        newHashes.push(hash)
      } else {
        // 如果没有行改变, 则说明记录已经存在了, 重新插入此记录以更新其id.
        db.prepare<{ hash: string }>(`
          INSERT INTO hash (hash)
          VALUES ($hash)
        `).run({ hash })
      }
    }

    shrink(db, shrinkOptions)

    return newHashes
  })()
}

export function addLastHash(
  db: IDatabase
, hash: string
, shrinkOptions: IShrinkOptions
): boolean {
  return db.transaction(() => {
    const row = db.prepare<[], { hash: string }>(`
      SELECT hash
        FROM hash
       ORDER BY id DESC
       LIMIT 1
    `).get()

    if (row?.hash === hash) {
      return false
    } else {
      db.prepare<{ hash: string }>(`
        INSERT INTO hash (hash)
        VALUES ($hash)
      `).run({ hash })
      shrink(db, shrinkOptions)

      return true
    }
  })()
}

function shrink(db: IDatabase, options: IShrinkOptions): void {
  if (isFinite(options.threshold)) {
    db.transaction(() => {
      const count = countHashes(db)

      if (count >= options.threshold) {
        db.prepare<{ limit: number }>(`
          DELETE FROM hash
           ORDER BY id ASC
           LIMIT $limit
        `).run({ limit: count - options.target })
      }
    })()
  }
}

function countHashes(db: IDatabase): number {
  const row = db.prepare<[], { count: number }>(`
    SELECT COUNT(*) as count
      FROM hash
  `).get()
  assert(row)

  return row.count
}
