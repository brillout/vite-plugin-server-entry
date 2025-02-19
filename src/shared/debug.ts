export { DEBUG }
export { logDebug }

import { logLabel } from './utils.js'

const DEBUG: boolean = true

function logDebug(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}
