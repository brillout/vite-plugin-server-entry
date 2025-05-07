export { debugLogsBuildtime }

import { isDebug, logDebug } from '../shared/debug.js'

function debugLogsBuildtime({
  disabled,
  paths,
}: { disabled: true; paths: null } | { disabled: false; paths: Record<string, string> }): undefined | void {
  if (!isDebug) return
  logDebug('DEBUG_LOGS_BUILD_TIME [begin]')
  if (disabled) {
    logDebug('disabled: true')
  } else {
    Object.entries(paths).forEach(([key, val]) => {
      logDebug(key, val)
    })
  }
  logDebug('DEBUG_LOGS_BUILD_TIME [end]')
}
