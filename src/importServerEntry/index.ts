export { importServerEntry }

import { getCwd, assert, assertUsage, toPosixPath, assertPosixPath, requireResolve } from './utils'
import { import_ } from '@brillout/import'
import type { AutoImporter, AutoImporterPaths } from './AutoImporter'
import { debugLogsRuntimePost, debugLogsRuntimePre } from './debugLogsRuntime'
import { serverEntryImportPromise } from '../shared/serverEntryImportPromise'
import { serverEntryFileNameBase, serverEntryFileNameBaseAlternative } from '../shared/serverEntryFileNameBase'
import { DEBUG } from '../shared/debug'

async function importServerEntry(outDir?: string): Promise<void | undefined> {
  const autoImporter: AutoImporter = require('./autoImporter.js')

  debugLogsRuntimePre(autoImporter)

  assertUsage(
    autoImporter.status !== 'DISABLED',
    "As a library author, make sure your library doesn't call importServerEntry() when using `inject: true`"
  )

  let success = false
  let requireError: unknown
  let isOutsideOfCwd: boolean | null = null
  if (autoImporter.status === 'SET') {
    try {
      await autoImporter.loadServerEntry()
      await (globalThis as any)[serverEntryImportPromise]
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
  } else {
    assert(
      // Yarn PnP
      autoImporter.status === 'UNSET' ||
        // Build was aborted
        autoImporter.status === 'BUILDING' ||
        // User sets config.vitePluginServerEntry._testCrawler
        autoImporter.status === 'TEST_CRAWLER'
    )
  }

  if (!success) {
    success = await crawlServerEntryFileWithNodeJs(outDir)
  }

  // We don't handle the following case:
  //  - When the user directly imports dist/server/entry.js because we assume that Vike and Telefunc don't call importServerEntry() in that case

  debugLogsRuntimePost({ success, requireError, isOutsideOfCwd, outDir })
  assertUsage(
    success,
    'Cannot find server entry. (Re-)build your app and try again. If you still get this error, then you may need to manually import the server entry, see https://github.com/brillout/vite-plugin-server-entry#manual-import'
  )
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

async function crawlServerEntryFileWithNodeJs(outDir?: string): Promise<boolean> {
  const cwd = getCwd()
  if (!cwd) return false

  let path: typeof import('path')
  let fs: typeof import('fs')
  try {
    path = await import_('path')
    fs = await import_('fs')
  } catch {
    return false
  }

  const isPathAbsolute = (p: string) => {
    if (process.platform === 'win32') {
      return path.win32.isAbsolute(p)
    } else {
      return p.startsWith('/')
    }
  }

  if (outDir) {
    // Only pre-rendering has access to config.build.outDir
    assertPosixPath(outDir)
    assert(isPathAbsolute(outDir), outDir)
  } else {
    // The SSR server doesn't have access to config.build.outDir so we shoot in the dark by trying with 'dist/'
    outDir = path.posix.join(cwd, 'dist')
  }
  const serverEntryFileDir = path.posix.join(outDir, 'server')
  if (!fs.existsSync(serverEntryFileDir)) return false

  let filename: string
  try {
    filename = __filename
  } catch {
    // __filename isn't defined when this file is being bundled into an ESM bundle
    return false
  }

  let serverEntryFilePath: string | null = null
  const entryFileCandidates = [
    `${serverEntryFileNameBase}.mjs`,
    `${serverEntryFileNameBase}.js`,
    `${serverEntryFileNameBase}.cjs`,
    `${serverEntryFileNameBaseAlternative}.mjs`,
    `${serverEntryFileNameBaseAlternative}.js`,
    `${serverEntryFileNameBaseAlternative}.cjs`
  ]
  for (const entryFileName of entryFileCandidates) {
    const serverEntryFilePathSpeculative = path.posix.join(serverEntryFileDir, entryFileName)
    try {
      serverEntryFilePath = await requireResolve(serverEntryFilePathSpeculative, filename)
    } catch {}
  }
  assertUsage(
    serverEntryFilePath,
    `Cannot find server entry. If you use rollupOptions.output.entryFileNames then make sure to not rename the server entry file. Make sure that one of the following exists: \n${entryFileCandidates.map((e) => `  ${e}`).join('\n')}`
  )

  // webpack couldn't have properly resolved distImporterPath (since there is not static import statement)
  if (isWebpackResolve(serverEntryFilePath)) {
    return false
  }

  await import_(serverEntryFilePath)
  await (globalThis as any)[serverEntryImportPromise]
  return true
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}
