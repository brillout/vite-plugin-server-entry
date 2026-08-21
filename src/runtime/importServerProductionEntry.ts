export { importServerProductionEntry }
export { importServerProductionIndex }

import { getCwdSafe, assertUsage, toPosixPath, assertPosixPath, isWebpackResolve, isObject } from './utils.js'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter.js'
import { debugLogsRuntimeEnd, debugLogsRuntimeBegin } from './debugLogsRuntime.js'
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
  let serverEntryFileMissing = false

  if (autoImporter.status === 'SET') {
    // In a monorepo, the autoImporter might belong to another project => don't use it
    isOutsideOfCwd = isServerEntryOutsideOfCwd(autoImporter.paths)
    if (isOutsideOfCwd === false || isOutsideOfCwd === null) {
      try {
        await autoImporter.loadServerEntry()
        success = true
      } catch (err) {
        if (isServerEntryMissingError(err, autoImporter.paths)) {
          // The autoImporter is stale: it points to a server entry file that doesn't exist anymore => fall back to crawling outDir (and, e.g. for Telefunc, args.tolerateDoesNotExist). For example:
          //  - Vike removes dist/server/ after pre-rendering fully pre-renderable apps (https://vike.dev/prerender#keepDistServer) — the autoImporter then dangles until the next build.
          //  - The user removed the build directory (e.g. `$ rm -rf dist/`) without re-building.
          //  - The user moved the project directory.
          serverEntryFileMissing = true
          requireError = err
        } else if (!isDebug) {
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

  debugLogsRuntimeEnd({ success, requireError, isOutsideOfCwd, serverEntryFileMissing, ...args })
  if (args.tolerateDoesNotExist) {
    return success
  } else {
    assertUsage(success, wrongUsageNotBuilt)
    return null
  }
}

// Whether `err` is about the server entry file itself not existing — as opposed to an error thrown by the server entry's code (e.g. one of its own imports failing), which must keep propagating.
function isServerEntryMissingError(err: unknown, paths: AutoImporterPaths): boolean {
  if (!isObject(err)) return false
  // - Node.js ESM: 'ERR_MODULE_NOT_FOUND'
  // - Node.js CJS and bundlers such as webpack: 'MODULE_NOT_FOUND'
  if (err.code !== 'ERR_MODULE_NOT_FOUND' && err.code !== 'MODULE_NOT_FOUND') return false
  const moduleMissing = getModuleMissing(err)
  if (!moduleMissing) return false
  const candidates = getServerEntryCandidates(paths)
  return candidates.includes(normalizePathForComparison(moduleMissing))
}
// The module that couldn't be found
function getModuleMissing(err: Record<string, unknown>): string | null {
  // Node.js ESM sets `err.url` to the file:// URL of the module that couldn't be found
  if (typeof err.url === 'string') return err.url
  // Node.js CJS and bundlers only set `err.message`
  if (typeof err.message === 'string') {
    const match = /Cannot find module '([^']+)'/.exec(err.message)
    if (match) return match[1]!
  }
  return null
}
// All the ways the server entry file can be referred to by a module-not-found error
function getServerEntryCandidates(paths: AutoImporterPaths): string[] {
  const candidates = [
    // File path (Node.js CJS, bundlers)
    paths.serverEntryFilePathAbsolute,
    // Raw import specifier (some bundlers)
    paths.serverEntryFilePathRelative,
  ]
  // file:// URL (Node.js ESM) — it's exactly what Node.js resolved when the autoImporter called import(serverEntryFilePathRelative)
  const { autoImporterFilePathActual } = paths
  // autoImporterFilePathActual can be null at runtime (the autoImporter file returns null if import.meta.url is unavailable, e.g. webpack)
  if (typeof autoImporterFilePathActual === 'string' && autoImporterFilePathActual.startsWith('file://')) {
    try {
      candidates.push(new URL(paths.serverEntryFilePathRelative, autoImporterFilePathActual).href)
    } catch {}
  }
  return candidates.map(normalizePathForComparison)
}
function normalizePathForComparison(path: string): string {
  // We don't use toPosixPath() because it assert()s — `path` can be an err.message extract which we shouldn't make any assumption about
  return path.split('\\').join('/')
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
