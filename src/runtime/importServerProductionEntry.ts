export { importServerProductionEntry }
export { importServerProductionIndex }

import { getCwdSafe, assertUsage, assertWarning, toPosixPath, assertPosixPath, isWebpackResolve } from './utils.js'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter.js'
import { debugLogsRuntimeEnd, debugLogsRuntimeBegin } from './debugLogsRuntime.js'
import {
  serverEntryFileNameBase,
  serverEntryFileNameBaseAlternative,
  serverIndexFileNameBase,
} from '../shared/serverEntryFileNameBase.js'
import { crawlOutDir } from './crawlOutDir.js'
import { import_ } from '@brillout/import'

const wrongUsageNotBuilt =
  'The server production entry is missing. (Re-)build your app and try again. If you still get this error, then you need to manually import the server production entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import'

/**
 * This should be used only for implementing a preview CLI (e.g. `$ vike preview`).
 *
 * This merely `import()` the file `${outDir}/server/index.{js,mjs,cjs}` — it's a standalone utility that can be used independently of `@brillout/vite-plugin-server-entry`. (You can use it even if you don't use anything else about `@brillout/vite-plugin-server-entry`.)
 */
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

  debugLogsRuntimeBegin(autoImporter)

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
        // Don't crash: the autoImporter can legitimately point to a server entry that doesn't exist anymore:
        //  - Vike removes dist/server/ after pre-rendering fully pre-renderable apps
        //  - The build output was removed (e.g. `$ git clean`) or belongs to a stale branch
        //  - In a monorepo, the autoImporter can have been (over)written by another project sharing node_modules
        // => fall back to crawling outDir below (and let the caller's own fallback kick in, e.g. Telefunc's
        //    telefunction registration).
        requireError = err
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

  warnRequireError(requireError, success)

  // We don't handle the following case:
  //  - When the user directly imports dist/server/entry.js because we assume that Vike and Telefunc don't call importServerProductionEntry() in that case

  debugLogsRuntimeEnd({ success, requireError, isOutsideOfCwd, ...args })
  if (args.tolerateDoesNotExist) {
    return success
  } else {
    assertUsage(success, wrongUsageNotBuilt)
    return null
  }
}

let requireErrorAlreadyWarned = false
function warnRequireError(requireError: unknown, success: boolean) {
  if (!requireError) return
  // importServerProductionEntry() can be called over and over again (e.g. Telefunc calls it upon each HTTP request) => warn only once
  if (requireErrorAlreadyWarned) return
  requireErrorAlreadyWarned = true
  assertWarning(
    false,
    [
      "The server production entry auto-import points to a file that couldn't be loaded",
      success
        ? '(recovered by crawling the build output directory instead)'
        : '— (re-)build your app to fix the auto-import',
      `— load failure: ${String(requireError)}`,
    ].join(' '),
  )
}

// dist/server/entry.js might not belong to process.cwd() in a monorepo => autoImporter.js can be shared between multiple projects
function isServerEntryOutsideOfCwd(paths: AutoImporterPaths): boolean | null {
  const cwd = getCwdSafe()

  // We cannot check edge environments. Upon edge deployment the server code is usually bundled right after `$ vite build`, so it's unlikley that the resolved serverEntryFilePath doesn't belong to cwd
  if (!cwd) return null

  let serverEntryFilePath = paths.serverEntryFilePathAbsolute

  if (isWebpackResolve(serverEntryFilePath, cwd)) return null

  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  assertPosixPath(cwd)
  return !serverEntryFilePath.startsWith(cwd.endsWith('/') ? cwd : cwd + '/')
}
