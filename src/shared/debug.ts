export { DEBUG }
export { logDebug }

import { logLabel } from './utils'

const DEBUG = false

function logDebug(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}
