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
      distImporterPath = require.resolve(distImporterPathRelative)
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
    require(distImporterPath)
    return { success: true, distImporterFilePath: distImporterPath }
  }

  function getImporterFilePath() {
    let autoImporterFilePath: string | null = null

    try {
      autoImporterFilePath = require.resolve('../autoImporter')
    } catch {
      return null
    }

    if (isWebpackResolve(autoImporterFilePath)) {
      return null
    }

    assert(require(autoImporterFilePath) === importer)
    return autoImporterFilePath
  }
}

function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}
