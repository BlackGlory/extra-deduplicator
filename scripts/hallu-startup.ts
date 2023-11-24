// @name Hallu startup notification
import { script, NotificationFilter } from '@src/script.ts'

export default script(
  () => ({
    id: Date.now()
  , title: 'Hallu started'
  })
, { filter: NotificationFilter.Passthrough }
)
