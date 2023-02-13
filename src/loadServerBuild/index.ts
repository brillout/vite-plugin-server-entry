export { loadServerBuild }
export { importBuildFileName }

import {
  getCwd,
  isCloudflareWorkersAlike,
  assert,
  assertUsage,
  toPosixPath,
  assertPosixPath,
  requireResolve,
  isNodeJS
} from './utils'
import { importBuildFileName } from '../shared/importBuildFileName'
import { import_ } from '@brillout/import'

const DEBUG = false

type Importer =
  | { status: 'UNSET' }
  | {
      status: 'SET'
      loadImportBuild: () => void
      paths: ImporterPaths
    }
type ImporterPaths = {
  importBuildFilePathRelative: string
  importBuildFilePathResolved: () => string
  importBuildFilePathOriginal: string
  autoImporterFilePathOriginal: string
}

const userHint =
  'Cannot find server build. (Re-)build your app (`$ vite build`) and try again. Note that you need the build your app (`$ vite build`) *after* installing your dependencies (`$ npm install`). Alternatively, manually import your server build, see https://github.com/brillout/vite-plugin-import-build#importbuildcjs'

async function loadServerBuild(): Promise<void | undefined> {
  const importer: Importer = require('../autoImporter')

  debugLogs(importer)

  if (importer.status === 'SET') {
    assertImporterFilePath(importer.paths)
    try {
      importer.loadImportBuild()
    } catch {
      assertUsage(false, userHint)
    }
  } else {
    // Yarn PnP or disabled
    assert(importer.status === 'UNSET')
    const success = await loadWithNodejs()
    // We don't implement assertUsage() for importBuild.cjs because we assume that vite-plugin-ssr and Telefunc don't try to loadServerBuild() if the users imports importBuild.cjs
    // We don't implement assertUsage() for disableAutoImporter because I don't remember who uses it (maybe Joel's vite-plugin-vercel?)
    assertUsage(success, userHint)
  }
}

function assertImporterFilePath(paths: ImporterPaths) {
  const cwd = getCwd()

  // For edge environments, the server code is usually bunlded right after `$ vite build`, so it's unlikley that importerFilePath doesn't/didn't belong to cwd
  if (!cwd) return
  assert(isNodeJS())

  // importerFilePath may not belong to cwd if e.g. vite-plugin-ssr is linked and therefore autoImporter.js is potentially shared between multiple projects
  let importerFilePath: string
  try {
    importerFilePath = paths.importBuildFilePathResolved()
  } catch (err) {
    if (DEBUG) console.log('err', err)
    assert(isNodeJS())
    assertUsage(false, userHint)
  }
  importerFilePath = toPosixPath(importerFilePath)
  assertPosixPath(cwd)
  assertUsage(importerFilePath.startsWith(cwd), userHint)
}

function debugLogs(importer: Importer) {
  if (!DEBUG) return
  console.log('Is Edge Deployment?', isCloudflareWorkersAlike())
  console.log('cwd', getCwd())
  console.log('importer.status', importer.status)
  if (importer.status === 'SET') {
    console.log('importer.paths.autoImporterFilePathOriginal', importer.paths.autoImporterFilePathOriginal)
    console.log('importer.paths.importBuildFilePathOriginal', importer.paths.importBuildFilePathOriginal)
    console.log('importer.paths.importBuildFilePathRelative', importer.paths.importBuildFilePathRelative)
    try {
      console.log('importer.paths.importBuildFilePathResolved', importer.paths.importBuildFilePathResolved())
    } catch (err) {
      console.log(err)
      console.log('importer.paths.importBuildFilePathResolved', 'FAILED')
    }
  }
}

async function loadWithNodejs(): Promise<boolean> {
  const cwd = getCwd()
  if (!cwd) {
    assert(isCloudflareWorkersAlike())
    return false
  }

  assert(isNodeJS())
  const path: typeof import('path') = await import_('path')
  const fs: typeof import('fs') = await import_('fs')

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
