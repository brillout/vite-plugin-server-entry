export { importServerProductionEntry }
export { importServerProductionIndex }

import { getCwdSafe, assertUsage, toPosixPath, assertPosixPath, isWebpackResolve } from './utils'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter'
import { debugLogsRuntimePost, debugLogsRuntimePre } from './debugLogsRuntime'
import { DEBUG } from '../shared/debug'
import {
  serverEntryFileNameBase,
  serverEntryFileNameBaseAlternative,
  serverIndexFileNameBase,
} from '../shared/serverEntryFileNameBase'
import { crawlServerEntry } from './crawlServerEntry'
import { import_ } from '@brillout/import'

/** To be used only for `$ vike preview`. */
async function importServerProductionIndex(args: { outDir?: string }): Promise<boolean> {
  // We don't need autoImporter — we can just crawl dist/server/index.mjs as we have both `outDir` and `node:fs`. Because `$ vike preview` isn't supposed to be called in edge environments, we can load Node.js as well as Vite (thus we know `outDir`).
  const outFilePath = await crawlServerEntry({
    ...args,
    outFileSearch: [serverIndexFileNameBase],
  })
  if (!outFilePath) return false
  await import_(outFilePath)
  return true
}

async function importServerProductionEntry(
  args: {
    // Used by Telefunc, since Telefunc doesn't know whether the user is using Vite.
    tolerateDoesNotExist?: boolean
    outDir?: string
  } = {},
): Promise<null | boolean> {
  const autoImporter: AutoImporter = require('./autoImporter.js')

  debugLogsRuntimePre(autoImporter)

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
    const outFilePath = await crawlServerEntry({
      ...args,
      outFileSearch: [serverEntryFileNameBase, serverEntryFileNameBaseAlternative],
    })
    if (outFilePath) {
      await import_(outFilePath)
      success = true
    }
  }

  // We don't handle the following case:
  //  - When the user directly imports dist/server/entry.js because we assume that Vike and Telefunc don't call importServerProductionEntry() in that case

  debugLogsRuntimePost({ success, requireError, isOutsideOfCwd, ...args })
  if (args.tolerateDoesNotExist) {
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
