export { debugLogsBuildtime }

import { DEBUG, logDebug } from '../shared/debug'

function debugLogsBuildtime({
  disabled,
  paths
}: { disabled: true; paths: null } | { disabled: false; paths: Record<string, string> }): undefined | void {
  if (!DEBUG) return
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
