export { importServerProductionEntry }

import { getCwd, assertUsage, toPosixPath, assertPosixPath, isWebpackResolve } from './utils'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter'
import { debugLogsRuntimePost, debugLogsRuntimePre } from './debugLogsRuntime'
import { DEBUG } from '../shared/debug'
import { crawlServerEntry } from './crawlServerEntry'

async function importServerProductionEntry({
  tolerateNotFound,
  outDir
}: { tolerateNotFound?: true; outDir?: string } = {}): Promise<null | boolean> {
  const autoImporter: AutoImporter = require('./autoImporter.js')

  debugLogsRuntimePre(autoImporter)

  assertUsage(
    autoImporter.status !== 'DISABLED_BY_INJECT',
    "As a library author, make sure your library doesn't call importServerProductionEntry() when using `inject: true`"
  )

  let success = false
  let requireError: unknown
  let isOutsideOfCwd: boolean | null = null
  if (autoImporter.status === 'SET') {
    try {
      await autoImporter.loadServerEntry()
      success = true
    } catch (err) {
      if (DEBUG) {
        requireError = err
      } else {
        throw err
      }
    }
    isOutsideOfCwd = isServerEntryOutsideOfCwd(autoImporter.paths)
    if (isOutsideOfCwd) {
      success = false
    }
  }

  if (!success) {
    success = await crawlServerEntry(outDir)
  }

  // We don't handle the following case:
  //  - When the user directly imports dist/server/entry.js because we assume that Vike and Telefunc don't call importServerProductionEntry() in that case

  debugLogsRuntimePost({ success, requireError, isOutsideOfCwd, outDir })
  if (tolerateNotFound) {
    return success
  } else {
    assertUsage(
      success,
      'The server production entry is missing. (Re-)build your app and try again. If you still get this error, then you need to manually import the server production entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import'
    )
    return null
  }
}

// dist/server/entry.js may not belong to process.cwd() if e.g. Vike is linked => autoImporter.js can potentially be shared between multiple projects
function isServerEntryOutsideOfCwd(paths: AutoImporterPaths): boolean | null {
  const cwd = getCwd()

  // We cannot check edge environments. Upon edge deployment the server code is usually bundled right after `$ vite build`, so it's unlikley that the resolved serverEntryFilePath doesn't belong to cwd
  if (!cwd) return null

  let serverEntryFilePath: string
  try {
    serverEntryFilePath = paths.serverEntryFilePathResolved()
  } catch {
    // Edge environments usually(/always?) don't support require.resolve()
    //  - This code block is called for edge environments that return a dummy process.cwd(), e.g. Cloudflare Workers: process.cwd() === '/'
    return null
  }

  if (isWebpackResolve(serverEntryFilePath)) return null

  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  assertPosixPath(cwd)
  return !serverEntryFilePath.startsWith(cwd)
}
