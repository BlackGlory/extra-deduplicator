// @name Hallu startup notification
import { script, Mode } from '@src/script.ts'

export default script(
  () => ({
    salt: Date.now().toString()
  , title: 'Hallu started'
  })
, { mode: Mode.Passthrough }
)
