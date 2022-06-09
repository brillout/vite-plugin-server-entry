import { getCwd, isCloudflareWorkersAlike, assert } from './utils'
import { importBuildFileName } from './importBuildFileName'
import path from 'path'
import fs from 'fs'

export { loadDistEntries }

async function loadDistEntries() {
  const autoImporterFilePath = require.resolve('./autoImporter')

  const importer: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require(autoImporterFilePath)

  if (importer.status === 'SET') {
    importer.load()
    return {
      success: true,
      entryFile: autoImporterFilePath,
      importBuildFileName
    }
  } else if (importer.status === 'UNSET') {
    // Yarn PnP or disabled
    const { success, distImporterFilePath } = loadWithNodejs()
    return {
      success,
      entryFile: distImporterFilePath,
      importBuildFileName
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
    const distImporterFilePath = path.posix.join(root, 'dist', 'server', importBuildFileName)
    const fileDir = path.posix.dirname(distImporterFilePath)
    let success: boolean
    try {
      require.resolve(distImporterFilePath)
      success = true
    } catch (err) {
      success = false
      assert(!fs.existsSync(fileDir), { distImporterFilePath })
    }
    assert(distImporterFilePath.endsWith('.cjs')) // Ensure ESM compability
    require(distImporterFilePath)
    return { success, distImporterFilePath }
  }
}
