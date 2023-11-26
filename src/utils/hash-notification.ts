import { sha256 } from 'npm:extra-compatible@^0.2.2'
import { INotification } from '@src/script.ts'

export async function hashNotification(notification: INotification): Promise<string> {
  const text = JSON.stringify([
    notification.title ?? null
  , notification.message ?? null
  , notification.id ?? null
  ])

  return await sha256(text)
}
