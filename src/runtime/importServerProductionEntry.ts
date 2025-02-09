export { importServerProductionEntry }

import { getCwdSafe, assertUsage, toPosixPath, assertPosixPath, isWebpackResolve } from './utils'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter'
import { debugLogsRuntimePost, debugLogsRuntimePre } from './debugLogsRuntime'
import { DEBUG } from '../shared/debug'
import { crawlServerEntry } from './crawlServerEntry'

async function importServerProductionEntry(
  args: {
    // Used by Telefunc, since Telefunc cannot assume/know whether the user is using Vite.
    tolerateNotFound?: boolean
    outDir?: string
  } = {},
): Promise<null | boolean> {
  const autoImporter: AutoImporter = require('./autoImporter.js')

  debugLogsRuntimePre(autoImporter)

  /* TODO/now
  assertUsage(
    autoImporter.status !== 'DISABLED_BY_INJECT' ||
      // Bypass this assertUsage() upon pre-rendering:
      //  - Upon pre-rendering Vike doesn't load dist/server/index.mjs but loads dist/server/entry.mjs instead: the server shouldn't start when pre-rendering starts.
      //  - Upon pre-rendering Vite is loaded and thus we know `outDir` and, consequently, we don't need the whole autoImporter.js logic: we can just crawl dist/server/entry.mjs as we have both `outDir` and `node:fs`.
      //    - This may change once we allow users to implement ISR in a Cloudflare Worker by using the Vike API `prerender()` without needing to load Vite.
      doNotLoadServer,
    wrongUsageWithInject,
  )
  */

  let success = false
  let requireError: unknown
  let isOutsideOfCwd: boolean | null = null

  if (autoImporter.status === 'SET') {
    // In a monorepo the autoImporter can be that of another project => don't use autoImporter if it's that case
    isOutsideOfCwd = isServerEntryOutsideOfCwd(autoImporter.paths)
    if (isOutsideOfCwd === false || isOutsideOfCwd === null) {
      try {
        await autoImporter.loadServerEntry()
        success = true
      } catch (err) {
        if (!DEBUG) {
          throw err
        } else {
          requireError = err
        }
      }
    }
  }

  if (!success) {
    success = await crawlServerEntry(args)
  }

  // We don't handle the following case:
  //  - When the user directly imports dist/server/entry.js because we assume that Vike and Telefunc don't call importServerProductionEntry() in that case

  debugLogsRuntimePost({ success, requireError, isOutsideOfCwd, ...args })
  if (args.tolerateNotFound) {
    return success
  } else {
    assertUsage(
      success,
      'The server production entry is missing. (Re-)build your app and try again. If you still get this error, then you need to manually import the server production entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import',
    )
    return null
  }
}

// dist/server/entry.js may not belong to process.cwd() if e.g. Vike is linked => autoImporter.js can potentially be shared between multiple projects
function isServerEntryOutsideOfCwd(paths: AutoImporterPaths): boolean | null {
  const cwd = getCwdSafe()

  // We cannot check edge environments. Upon edge deployment the server code is usually bundled right after `$ vite build`, so it's unlikley that the resolved serverEntryFilePath doesn't belong to cwd
  if (!cwd) return null

  let serverEntryFilePath: string
  try {
    serverEntryFilePath = paths.serverEntryFilePathResolved()
  } catch {
    // serverEntryFilePathResolved() calls require.resolve()
    // - Edge environments don't support require.resolve()
    // - This code block is executed on edge environments that implement a dummy `process.cwd()` e.g. on Cloudflare Workers `process.cwd() === '/'`
    return null
  }

  if (isWebpackResolve(serverEntryFilePath)) return null

  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  assertPosixPath(cwd)
  return !serverEntryFilePath.startsWith(cwd)
}
