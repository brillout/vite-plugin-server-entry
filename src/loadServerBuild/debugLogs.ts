import { getCwd } from './utils'
import type { Importer } from './Importer'

const DEBUG = false

export function debugLogs(importer: Importer) {
  if (!DEBUG) return
  try {
    console.log('process.platform', JSON.stringify(process.platform))
  } catch {
    console.log('process.platform', 'FAILED')
  }
  // https://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js/35813135#35813135
  try {
    console.log('process.release', JSON.stringify(process.release))
  } catch {
    console.log('process.release', 'FAILED')
  }
  // https://github.com/cloudflare/workers-sdk/issues/1481 - Feature Request: Detect whether code is being run in Cloudflare Workers (or Node.js)
  try {
    console.log('navigator', JSON.stringify(navigator))
  } catch {
    console.log('navigator', 'FAILED')
  }
  console.log('cwd', getCwd())
  console.log('importer.status', importer.status)
  if (importer.status === 'SET') {
    console.log('importer.paths.autoImporterFilePathOriginal', importer.paths.autoImporterFilePathOriginal)
    console.log('importer.paths.importBuildFilePathOriginal', importer.paths.importBuildFilePathOriginal)
    console.log('importer.paths.importBuildFilePathRelative', importer.paths.importBuildFilePathRelative)
    try {
      console.log('importer.paths.importBuildFilePathResolved()', importer.paths.importBuildFilePathResolved())
    } catch (err) {
      console.log('importer.paths.importBuildFilePathResolved() error:', err)
      console.log('importer.paths.importBuildFilePathResolved()', 'FAILED')
    }
  }
}
