import { assert } from 'https://esm.sh/@blackglory/prelude@0.3.4'
import { Mutex } from 'https://esm.sh/extra-promise@6.0.8'

export class MutexHub {
  private keyToMutex = new Map<string, Mutex>()

  async acquire<T>(key: string, fn: () => T): Promise<T> {
    if (!this.keyToMutex.has(key)) {
      this.keyToMutex.set(key, new Mutex())
    }

    const mutex = this.keyToMutex.get(key)
    assert(mutex)

    return await mutex.acquire(fn)
  }
}
