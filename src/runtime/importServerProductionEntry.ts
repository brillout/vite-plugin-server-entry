export { importServerProductionEntry }
export { importServerProductionIndex }

import { getCwdSafe, assertUsage, toPosixPath, assertPosixPath, isWebpackResolve, removeFilePrefix } from './utils.js'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter.js'
import { debugLogsRuntimePost, debugLogsRuntimePre } from './debugLogsRuntime.js'
import { isDebug } from '../shared/debug.js'
import {
  serverEntryFileNameBase,
  serverEntryFileNameBaseAlternative,
  serverIndexFileNameBase,
} from '../shared/serverEntryFileNameBase.js'
import { crawlOutDir } from './crawlOutDir.js'
import { import_ } from '@brillout/import'

const wrongUsageNotBuilt =
  'The server production entry is missing. (Re-)build your app and try again. If you still get this error, then you need to manually import the server production entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import'

/** To be used only for `$ vike preview`. */
async function importServerProductionIndex(args: { outDir: string }): Promise<{ outServerIndex: string }> {
  // We don't need autoImporter — we can just crawl dist/server/index.mjs as we have both `outDir` and `node:fs`. Because `$ vike preview` isn't supposed to be called in edge environments, we can load Node.js as well as Vite (thus we know `outDir`).
  const outFilePath = await crawlOutDir({
    ...args,
    outFileSearch: [serverIndexFileNameBase],
  })
  assertUsage(outFilePath, wrongUsageNotBuilt)
  await import_(outFilePath)
  return { outServerIndex: outFilePath }
}

async function importServerProductionEntry(
  args: {
    // Used by Telefunc, since Telefunc doesn't know whether the user is using Vite.
    tolerateDoesNotExist?: boolean
    outDir?: string
  } = {},
): Promise<null | boolean> {
  const autoImporter: AutoImporter = (await import('./autoImporter.js')) as any

  debugLogsRuntimePre(autoImporter)

  let success = false
  let requireError: unknown
  let isOutsideOfCwd: boolean | null = null

  if (autoImporter.status === 'SET') {
    // In a monorepo, the autoImporter might belong to another project => don't use it
    isOutsideOfCwd = isServerEntryOutsideOfCwd(autoImporter.paths)
    if (isOutsideOfCwd === false || isOutsideOfCwd === null) {
      try {
        await autoImporter.loadServerEntry()
        success = true
      } catch (err) {
        if (!isDebug) {
          throw err
        } else {
          requireError = err
        }
      }
    }
  }

  if (!success) {
    const outFilePath = await crawlOutDir({
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
    assertUsage(success, wrongUsageNotBuilt)
    return null
  }
}

// dist/server/entry.js might not belong to process.cwd() in a monorepo => autoImporter.js can be shared between multiple projects
function isServerEntryOutsideOfCwd(paths: AutoImporterPaths): boolean | null {
  const cwd = getCwdSafe()

  // We cannot check edge environments. Upon edge deployment the server code is usually bundled right after `$ vite build`, so it's unlikley that the resolved serverEntryFilePath doesn't belong to cwd
  if (!cwd) return null

  let serverEntryFilePath: string
  try {
    serverEntryFilePath = paths.serverEntryFilePathResolvedRuntime()
  } catch {
    // serverEntryFilePathResolvedRuntime() calls import.meta.resolve() / require.resolve()
    // - Edge environments don't support import.meta.resolve() / require.resolve()
    return null
  }
  serverEntryFilePath = removeFilePrefix(serverEntryFilePath)

  if (isWebpackResolve(serverEntryFilePath, cwd)) return null

  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  assertPosixPath(cwd)
  return !serverEntryFilePath.startsWith(cwd)
}
