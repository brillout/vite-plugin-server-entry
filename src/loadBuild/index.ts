export { loadBuild }
export { importBuildFileName }

import { getCwd, isCloudflareWorkersAlike, assert } from './utils'
import { importBuildFileName } from '../shared/importBuildFileName'
import path from 'path'
import fs from 'fs'
import { import_ } from '@brillout/import'

async function loadBuild(): Promise<boolean> {
  const importer: {
    status: string
    loadImportBuild: () => void
  } = require('../autoImporter')

  if (importer.status === 'SET') {
    importer.loadImportBuild()
    return true
  } else if (importer.status === 'UNSET') {
    // Yarn PnP or disabled
    const success = await loadWithNodejs()
    return success
  } else {
    assert(false)
  }

  async function getImporterFilePath() {
    let autoImporterFilePath: string | null = null

    try {
      autoImporterFilePath = require.resolve('../autoImporter')
    } catch {
      return null
    }

    if (isWebpackResolve(autoImporterFilePath)) {
      return null
    }

    assert((await require_(autoImporterFilePath)) === importer)
    return autoImporterFilePath
  }
}

async function loadWithNodejs(): Promise<boolean> {
  const root = getCwd()
  if (!root) {
    assert(isCloudflareWorkersAlike())
    return false
  }

  // The runtime doesn't have access to config.build.outDir so we try and shoot in the dark
  const distImporterPathRelative = path.posix.join(root, 'dist', 'server', importBuildFileName)
  const distImporterDir = path.posix.dirname(distImporterPathRelative)
  let distImporterPath: string
  try {
    distImporterPath = await requireResolve_(distImporterPathRelative)
  } catch (err) {
    assert(!fs.existsSync(distImporterDir), { distImporterDir, distImporterPathRelative })
    return false
  }

  if (isWebpackResolve(distImporterPath)) {
    return false
  }

  assert(distImporterPath.endsWith('.cjs')) // Ensure ESM compability
  await require_(distImporterPath)
  return true
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}

// Workaround for webpack static analysis warnings: (Some users use webpack to bundle their VPS app's server code.)
// ```
// Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
// Critical dependency: the request of a dependency is an expression
// ```
// Just `console.log(require)` already triggers the warnings, so the following seems to be the only way (using eval() shows a warning when using esbuild).
async function requireResolve_(id: string) {
  const req = await getRequire()
  return req.resolve(id)
}
async function require_(id: string) {
  const req = await getRequire()
  return req(id)
}
var req: undefined | typeof require
async function getRequire() {
  if (!req) {
    const { createRequire } = (await import_('module')) as typeof import('module')
    req = createRequire(__filename)
  }
  return req
}
/* Debug:
;(async () => {
  console.log('test webpack static analysis suppression trick')
  console.log(await requireResolve_('path'))
  console.log(await require('path'))
})()
//*/
