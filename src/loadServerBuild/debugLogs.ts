import { getCwd, projectInfo } from './utils'
import type { Importer } from './Importer'

const DEBUG = false

export function debugLogs(importer: Importer): undefined | void {
  if (!DEBUG) return
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
    log('importer.paths.importBuildFilePathOriginal', importer.paths.importBuildFilePathOriginal)
    log('importer.paths.importBuildFilePathRelative', importer.paths.importBuildFilePathRelative)
    try {
      log('importer.paths.importBuildFilePathResolved()', importer.paths.importBuildFilePathResolved())
    } catch (err) {
      log('importer.paths.importBuildFilePathResolved() error:', err)
      log('importer.paths.importBuildFilePathResolved()', 'ERRORED')
    }
  }
}

function log(...msgs: unknown[]) {
  console.log(`[${projectInfo.projectName}][DEBUG]`, ...msgs)
}
