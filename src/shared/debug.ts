export { DEBUG }
export { logDebug }

import { logLabel } from './utils.js'

const DEBUG: boolean = false

function logDebug(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}
