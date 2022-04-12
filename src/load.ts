import { getImporterDir, normalizePath } from './utils'
import path from 'path'

export { load }

function load(options: {
  distPath: null | {
    root: string
    outDir: string
  }
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
}) {
  const importer: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require('./autoImporter')

  if (importer.status === 'UNSET') {
    loadWithoutImporter()
  } else {
    assert(importer.status === 'SET', { status: importer.status })
    assertStatus()
    importer.load()
  }

  return

  function assertStatus() {
    {
      const { status } = importer
      assert(['UNSET', 'SET'].includes(status), { status })
    }
    if (options.distPath) {
      const outDirBuild = normalizePath(importer.outDir)
      const outDirCurrent = normalizePath(options.distPath.outDir)
      const sameOutDir = outDirCurrent === outDirBuild
      const rootCurrent = normalizePath(options.distPath.root)
      const rootBuild = normalizePath(importer.root)
      const sameRoot =
        path.posix.relative(getImporterDir(), rootCurrent) === path.posix.relative(importer.importerDir, rootBuild)
      assertUsage(
        sameRoot && sameOutDir,
        [
          'Rebuild your app.',
          !sameOutDir
            ? `(Your app's \`vite.config.js#build.outDir\` is '${outDirCurrent}' while your build has \`outDir === '${outDirBuild}'\`.)`
            : `(Your app's \`root\` is '${rootCurrent}' while your build has \`root === '${rootBuild}'\`.)`
        ].join(' ')
      )
    }
  }

  function loadWithoutImporter() {
    assertUsage(false, 'TODO')
    /*
  let root: string
  const root = process.cwd()
  const outDir = 'dist'

  assertUsage()
  */
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
