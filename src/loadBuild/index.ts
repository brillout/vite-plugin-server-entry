export { loadBuild }
export { importBuildFileName }

import { getCwd, isCloudflareWorkersAlike, assert } from './utils'
import { importBuildFileName } from '../shared/importBuildFileName'
import path from 'path'
import fs from 'fs'

async function loadBuild() {
  const importer: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require('../autoImporter')

  if (importer.status === 'SET') {
    importer.load()
    return {
      success: true,
      entryFile: getImporterFilePath()
    }
  } else if (importer.status === 'UNSET') {
    // Yarn PnP or disabled
    const { success, distImporterFilePath } = loadWithNodejs()
    return {
      success,
      entryFile: distImporterFilePath
    }
  } else {
    const { status } = importer
    assert(false, { status })
  }

  function loadWithNodejs() {
    const root = getCwd()
    if (!root) {
      assert(isCloudflareWorkersAlike())
      return {
        success: false,
        distImporterFilePath: null
      }
    }

    // The runtime doesn't have access to config.build.outDir so we try and shoot in the dark
    const distImporterPathRelative = path.posix.join(root, 'dist', 'server', importBuildFileName)
    const distImporterDir = path.posix.dirname(distImporterPathRelative)
    let distImporterPath: string
    try {
      distImporterPath = requireResolve_(distImporterPathRelative)
    } catch (err) {
      assert(!fs.existsSync(distImporterDir), { distImporterDir, distImporterPathRelative })
      return {
        success: false,
        distImporterFilePath: null
      }
    }

    if (isWebpackResolve(distImporterPath)) {
      return {
        success: false,
        distImporterFilePath: null
      }
    }

    assert(distImporterPath.endsWith('.cjs')) // Ensure ESM compability
    require_(distImporterPath)
    return { success: true, distImporterFilePath: distImporterPath }
  }

  function getImporterFilePath() {
    let autoImporterFilePath: string | null = null

    try {
      autoImporterFilePath = requireResolve_('../autoImporter')
    } catch {
      return null
    }

    if (isWebpackResolve(autoImporterFilePath)) {
      return null
    }

    assert(require_(autoImporterFilePath) === importer)
    return autoImporterFilePath
  }
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}

// Workaround Next.js's (webpack?) static analysis warnings:
// ```
// Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
// ```
// ```
// Critical dependency: the request of a dependency is an expression
// ```
// The fact that Next.js transpiles this file is a Telefunc flaw that can/should be fixed. We still need this workaround for users who use wbepack to bundle their VPS app's server code.
// __non_webpack_require__ trick: https://github.com/webpack/webpack/issues/196#issuecomment-261573140
// If __non_webpack_require__ doesn't turn out to be reliable then use @brillout/import
function requireResolve_(id: string) {
  if (typeof __non_webpack_require__ === 'undefined') {
    const __non_webpack_require__ = require
    return __non_webpack_require__.resolve(id)
  }
  return __non_webpack_require__.resolve(id)
}
function require_(id: string) {
  if (typeof __non_webpack_require__ === 'undefined') {
    const __non_webpack_require__ = require
    return __non_webpack_require__(id)
  }
  return __non_webpack_require__(id)
}
declare global {
  var __non_webpack_require__: undefined | typeof require
}
