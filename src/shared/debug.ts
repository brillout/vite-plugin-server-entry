export { DEBUG }
export { logDebug }

import { logLabel } from './utils'

const DEBUG: boolean = false

function logDebug(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}
