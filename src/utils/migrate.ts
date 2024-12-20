import type { Database } from '@db/sqlite'
import { assert, isFunction } from '@blackglory/prelude'

export interface IMigration {
  version: number
  up: string | ((db: Database) => void)
  down: string | ((db: Database) => void)
}

export function migrate(
  db: Database
, migrations: IMigration[]
, targetVersion: number = getMaximumVersion(migrations)
): void {
  const maxVersion = getMaximumVersion(migrations)
  const migrate = db.transaction((
    targetVersion: number
  , maxVersion: number
  ) => {
    const currentVersion = getDatabaseVersion(db)
    if (maxVersion < currentVersion) {
      return true
    } else {
      if (currentVersion === targetVersion) {
        return true
      } else if (currentVersion < targetVersion) {
        upgrade()
        return false
      } else {
        downgrade()
        return false
      }
    }
  })

  while (true) {
    const done = migrate.immediate(targetVersion, maxVersion)
    if (done) break
  }

  function upgrade(): void {
    const currentVersion = getDatabaseVersion(db)
    const targetVersion = currentVersion + 1

    const migration = migrations.find(x => x.version === targetVersion)
    assert(migration, `Cannot find migration for version ${targetVersion}`)

    try {
      if (isFunction(migration.up)) {
        migration.up(db)
      } else {
        db.exec(migration.up)
      }
    } catch (e) {
      console.error(`Upgrade from version ${currentVersion} to version ${targetVersion} failed.`)
      throw e
    }
    setDatabaseVersion(db, targetVersion)
  }

  function downgrade(): void {
    const currentVersion = getDatabaseVersion(db)
    const targetVersion = currentVersion - 1

    const migration = migrations.find(x => x.version === currentVersion)
    assert(migration, `Cannot find migration for version ${targetVersion}`)

    try {
      if (isFunction(migration.down)) {
        migration.down(db)
      } else {
        db.exec(migration.down)
      }
    } catch (e) {
      console.error(`Downgrade from version ${currentVersion} to version ${targetVersion} failed.`)
      throw e
    }
    setDatabaseVersion(db, targetVersion)
  }
}

function getMaximumVersion(migrations: IMigration[]): number {
  return migrations.reduce((max, cur) => Math.max(cur.version, max), 0)
}

function getDatabaseVersion(db: Database): number {
  const result = db.prepare('PRAGMA user_version;')
    .get() as { user_version: number }
  return result['user_version']
}

function setDatabaseVersion(db: Database, version: number): void {
  // PRAGMA不支持变量
  db.exec(`PRAGMA user_version = ${ version }`)
}
