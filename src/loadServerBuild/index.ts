export { loadServerBuild }

import { getCwd, assert, assertUsage, toPosixPath, assertPosixPath, requireResolve } from './utils'
import { importBuildFileName } from '../shared/importBuildFileName'
import { import_ } from '@brillout/import'
import type { Importer, ImporterPaths } from './Importer'
import { debugLogsRuntimePost, debugLogsRuntimePre } from '../shared/debugLogs'

const userHint =
  'Cannot find server build. (Re-)build your app (`$ vite build`) and try again. If you still get this error, then you may need to manually import your server build, see https://github.com/brillout/vite-plugin-import-build#importbuildcjs'

async function loadServerBuild(): Promise<void | undefined> {
  const importer: Importer = require('../autoImporter')

  debugLogsRuntimePre(importer)

  let success = false
  let requireError: unknown
  if (importer.status === 'SET') {
    assertImporterFilePath(importer.paths)
    try {
      importer.loadImportBuild()
      success = true
    } catch (err) {
      requireError = err
    }
  } else {
    // Yarn PnP or disabled
    assert(importer.status === 'UNSET')
    success = await loadWithNodejs()
  }

  // We don't handle the following cases:
  //  - When the user directly imports importBuild.cjs, because we assume that vite-plugin-ssr and Telefunc don't call loadServerBuild() in that case
  //  - When disableAutoImporter is true, because I think no ones uses? (I don't remember why I implemented it - maybe for Joel's vite-plugin-vercel?)

  debugLogsRuntimePost({ success, requireError })
  assertUsage(success, userHint)
}

function assertImporterFilePath(paths: ImporterPaths) {
  const cwd = getCwd()

  // For edge environments, the server code is usually bunlded right after `$ vite build`, so it's unlikley that the resolved importBuildFilePath doesn't belong to cwd
  if (!cwd) return

  // importBuildFilePath may not belong to cwd if e.g. vite-plugin-ssr is linked and therefore autoImporter.js is potentially shared between multiple projects
  let importBuildFilePath: string
  try {
    importBuildFilePath = paths.importBuildFilePathResolved()
  } catch (err) {
    assert(err instanceof Error)
    // Cloudflare Workers returns a bogus cwd value of '/' while its node compat layer defines require() but not require.resolve() => `TypeError: __require.resolve is not a function`
    if (err.constructor === TypeError && err.message.includes('is not a function')) return
    assert((err as any as Record<string, unknown>).code === 'MODULE_NOT_FOUND')
    assertUsage(false, userHint)
  }
  importBuildFilePath = toPosixPath(importBuildFilePath)
  assertPosixPath(cwd)
  assertUsage(importBuildFilePath.startsWith(cwd), userHint)
}

async function loadWithNodejs(): Promise<boolean> {
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

  // The runtime doesn't have access to config.build.outDir so we try and shoot in the dark
  const distImporterPathRelative = path.posix.join(cwd, 'dist', 'server', importBuildFileName)
  const distImporterDir = path.posix.dirname(distImporterPathRelative)
  let distImporterPath: string
  try {
    distImporterPath = await requireResolve(distImporterPathRelative, __filename)
  } catch {
    assert(!fs.existsSync(distImporterDir), { distImporterDir, distImporterPathRelative })
    return false
  }

  // webpack couldn't have properly resolved distImporterPath (since there is not static import statement)
  if (isWebpackResolve(distImporterPath)) {
    return false
  }

  // Ensure ESM compability
  assert(distImporterPath.endsWith('.cjs'))
  await import_(distImporterPath)
  return true
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}
