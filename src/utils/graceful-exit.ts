import { SyncDestructor } from 'https://esm.sh/extra-defer@0.2.8'
import { platform } from 'node:os'

export const appDestructor = new SyncDestructor()

globalThis.addEventListener('unhandledrejection', gracefulExit)
globalThis.addEventListener('unload', gracefulExit)

Deno.addSignalListener('SIGINT', gracefulExit)
if (platform() === 'win32') {
  Deno.addSignalListener('SIGBREAK', gracefulExit)
} else {
  Deno.addSignalListener('SIGTERM', gracefulExit)
}

function gracefulExit(): void {
  appDestructor.execute()
  Deno.exit()
}
