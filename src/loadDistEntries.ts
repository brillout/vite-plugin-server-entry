import { getCwd, isCloudflareWorkersAlike } from './utils'
import { importBuildFileName } from './importBuildFileName'
import path from 'path'
import fs from 'fs'

export { loadDistEntries }

function loadDistEntries(options: {
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
  importBuildDocLink: string
}) {
  const importer: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require('./autoImporter')

  if (importer.status === 'SET') {
    importer.load()
  } else if (importer.status === 'UNSET') {
    // Yarn PnP or disabled
    loadWithNodejs()
  } else {
    const { status } = importer
    assert(false, { status })
  }

  return

  function loadWithNodejs() {
    const root = getCwd()
    const errMsg = `Cannot find production build. Use \`${importBuildFileName}\`, see ${options.importBuildDocLink}`
    if (!root) {
      assert(isCloudflareWorkersAlike())
      assertUsage(false, errMsg)
    }
    const filePath = path.posix.join(root, 'dist', 'server', importBuildFileName)
    const fileDir = path.posix.dirname(filePath)
    try {
      require.resolve(filePath)
    } catch (err) {
      assert(!fs.existsSync(fileDir), { filePath })
      assertUsage(false, errMsg)
    }
    assert(filePath.endsWith('.cjs')) // Ensure ESM compability
    require(filePath)
  }

  // Circumvent TS bug
  // https://github.com/microsoft/TypeScript/issues/36931
  function assert(condition: unknown, debugInfo?: unknown): asserts condition {
    options.assert(condition, debugInfo)
  }
  function assertUsage(condition: unknown, msg: string): asserts condition {
    options.assertUsage(condition, msg)
  }
}
