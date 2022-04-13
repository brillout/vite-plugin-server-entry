import { assertPosixPath, getImporterDir, isCloudflareWorkersAlike, normalizePath } from './utils'
import { loadStaticConfig } from './viteConfigJson/loadStaticConfig'
import { importBuildFileName } from './importBuildFileName'
import path from 'path'
import fs from 'fs'

export { loadDistEntries }

function loadDistEntries(options: {
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
  yarnDocLink: string
}) {
  const importer: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require('./autoImporter')

  const configStatic = loadStaticConfig()
  if (importer.status === 'SET') {
    assertDistPath()
    importer.load()
  } else if (importer.status === 'UNSET') {
    // Yarn PnP or disabled
    loadWithNodejs()
  } else {
    const { status } = importer
    assert(false, { status })
  }

  return

  function assertDistPath() {
    if (configStatic === null) {
      assert(isCloudflareWorkersAlike())
      // There is no way to check whether `autoImporter.js` is importing the `dist/` of another project
      return
    }
    const { root } = configStatic
    const rootCurrent = normalizePath(root)
    const rootBuild = normalizePath(importer.root)
    const sameRoot =
      path.posix.relative(getImporterDir(), rootCurrent) === path.posix.relative(importer.importerDir, rootBuild)
    assertUsage(
      sameRoot,
      [
        'Rebuild your app.',
        `(Your app's \`root\` is ${rootCurrent} while your build has \`root === '${rootBuild}'\`.)`
      ].join(' ')
    )
  }

  function loadWithNodejs() {
    assertUsage(
      !isCloudflareWorkersAlike(),
      `When using Yarn PnP and a serverless platform, such as Cloudflare Workers, the file \`${importBuildFileName}\` needs to be imported. See ${options.yarnDocLink} for more information.`
    )
    assert(configStatic)
    const {
      root,
      build: { outDir }
    } = configStatic
    assertPosixPath(root)
    assertPosixPath(outDir)
    const filePath = path.posix.join(root, outDir, 'server', importBuildFileName)
    const fileDir = path.posix.dirname(filePath)
    try {
      require.resolve(filePath)
    } catch (err) {
      assert(!fs.existsSync(fileDir), { filePath })
      assertUsage(
        false,
        `You did not build your app. (The directory ${fileDir} is missing.) Make sure to build your app before running it for production.`
      )
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
