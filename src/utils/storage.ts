import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'
import { sha1 } from 'https://esm.sh/extra-compatible@0.2.2'
import { remove, removeSync } from 'npm:extra-filesystem@^0.5.1'
import { Mutex } from 'https://esm.sh/extra-promise@6.0.8'
import { getStoragesRoot } from '@utils/paths.ts'
import { NotificationDigestDatabase } from '@utils/notification-digest-database.ts'

const pathnameToStorage = new Map<string, Storage>()

export class Storage {
  private mutex = new Mutex()

  private constructor(private pathname: string) {}

  static async create(id: string): Promise<Storage> {
    const pathname = path.join(getStoragesRoot(), await sha1(id))

    if (!pathnameToStorage.has(pathname)) {
      pathnameToStorage.set(pathname, new Storage(pathname))
    }

    return pathnameToStorage.get(pathname)!
  }

  async remove(): Promise<void> {
    await remove(this.pathname)
  }

  removeSync(): void {
    removeSync(this.pathname)
  }

  async lock<T>(fn: () => T): Promise<T> {
    return await this.mutex.acquire(fn)
  }

  getNotificationDigestDatabase(): NotificationDigestDatabase {
    const filename = path.join(this.pathname, 'notification-digests')
    return new NotificationDigestDatabase(filename, {
      shrinkTarget: 500
    , shrinkThreshold: 1000
    })
  }
}
