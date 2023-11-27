// @name Hallu startup notification
import { script, Mode } from '@src/script.ts'

export default script(
  () => ({
    id: Date.now()
  , title: 'Hallu started'
  })
, { mode: Mode.Passthrough }
)
