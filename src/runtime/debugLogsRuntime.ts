export { debugLogsRuntimePre }
export { debugLogsRuntimePost }

import { getCwdSafe } from '../shared/utils'
import type { AutoImporter } from './AutoImporter'
import { DEBUG, logDebug } from '../shared/debug'

function debugLogsRuntimePre(autoImporter: AutoImporter): undefined | void {
  if (!DEBUG) return
  logDebug('DEBUG_LOGS_RUNTIME [begin]')
  try {
    logDebug('process.platform', JSON.stringify(process.platform))
  } catch {
    logDebug('process.platform', 'undefined')
  }
  // https://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js/35813135#35813135
  try {
    logDebug('process.release', JSON.stringify(process.release))
  } catch {
    logDebug('process.release', 'undefined')
  }
  // https://github.com/cloudflare/workers-sdk/issues/1481 - Feature Request: Detect whether code is being run in Cloudflare Workers (or Node.js)
  try {
    logDebug('navigator', JSON.stringify(navigator))
  } catch {
    logDebug('navigator', 'undefined')
  }
  logDebug('cwd', getCwdSafe())
  logDebug('importer.status', autoImporter.status)
  if (autoImporter.status === 'SET') {
    logDebug('importer.paths.autoImporterFilePathOriginal', autoImporter.paths.autoImporterFilePathOriginal)
    logDebug('importer.paths.autoImporterFileDirActual', autoImporter.paths.autoImporterFileDirActual)
    logDebug('importer.paths.serverEntryFilePathRelative', autoImporter.paths.serverEntryFilePathRelative)
    logDebug('importer.paths.serverEntryFilePathOriginal', autoImporter.paths.serverEntryFilePathOriginal)
    try {
      logDebug('importer.paths.serverEntryFilePathResolved()', autoImporter.paths.serverEntryFilePathResolved())
    } catch (err) {
      logDebug('importer.paths.serverEntryFilePathResolved() error:', err)
      logDebug('importer.paths.serverEntryFilePathResolved()', 'ERRORED')
    }
  }
}

function debugLogsRuntimePost(info: Record<string, unknown>): undefined | void {
  if (!DEBUG) return
  for (var key in info) logDebug(key, info[key])
  logDebug('DEBUG_LOGS_RUNTIME [end]')
}
