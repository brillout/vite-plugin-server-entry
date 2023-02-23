export { debugLogs1 }
export { debugLogs2 }

import { getCwd, logLabel } from './utils'
import type { Importer } from '../loadServerBuild/Importer'

const DEBUG = false

function debugLogs1(importer: Importer): undefined | void {
  if (!DEBUG) return
  log('DEBUG_LOGS_RUNTIME')
  try {
    log('process.platform', JSON.stringify(process.platform))
  } catch {
    log('process.platform', 'undefined')
  }
  // https://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js/35813135#35813135
  try {
    log('process.release', JSON.stringify(process.release))
  } catch {
    log('process.release', 'undefined')
  }
  // https://github.com/cloudflare/workers-sdk/issues/1481 - Feature Request: Detect whether code is being run in Cloudflare Workers (or Node.js)
  try {
    log('navigator', JSON.stringify(navigator))
  } catch {
    log('navigator', 'undefined')
  }
  log('cwd', getCwd())
  log('importer.status', importer.status)
  if (importer.status === 'SET') {
    log('importer.paths.autoImporterFilePathOriginal', importer.paths.autoImporterFilePathOriginal)
    log('importer.paths.autoImporterFileDirActual', importer.paths.autoImporterFileDirActual)
    log('importer.paths.importBuildFilePathRelative', importer.paths.importBuildFilePathRelative)
    log('importer.paths.importBuildFilePathOriginal', importer.paths.importBuildFilePathOriginal)
    try {
      log('importer.paths.importBuildFilePathResolved()', importer.paths.importBuildFilePathResolved())
    } catch (err) {
      log('importer.paths.importBuildFilePathResolved() error:', err)
      log('importer.paths.importBuildFilePathResolved()', 'ERRORED')
    }
  }
}

function debugLogs2(paths: Record<string, string>): undefined | void {
  if (!DEBUG) return
  log('DEBUG_LOGS_BUILD_TIME')
  Object.entries(paths).forEach(([key, val]) => {
    log(key, val)
  })
}

function log(...msgs: unknown[]) {
  console.log(`${logLabel}[DEBUG]`, ...msgs)
}