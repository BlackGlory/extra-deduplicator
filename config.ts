import { config } from '@src/config.ts'

export default config({
  getCookies() {
    return null
  }
, notify(notifications) {
    notifications.forEach(notification => console.info(notification))
  }
})
