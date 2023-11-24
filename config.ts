import { config } from '@src/config.ts'
import { Notification } from 'https://deno.land/x/deno_notify@1.4.3/ts/mod.ts'

export default config({
  getCookies() {
    return null
  }
, notify(notifications) {
    notifications.forEach(notification => {
      const instance = new Notification()

      if (notification.title) {
        instance.title(notification.title)
      }

      if (notification.message) {
        instance.body(notification.message)
      }

      instance.show()
    })
  }
})
