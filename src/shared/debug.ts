export { isDebug }
export { logDebug }

import { logLabel } from './utils.js'

const isDebug: boolean = false

function logDebug(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}
