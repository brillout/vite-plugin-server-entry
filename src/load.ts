import { getImporterDir, normalizePath } from './utils'
import path from 'path'

export { load }

function load(opts: {
  distPath: null | {
    root: string
    outDir: string
  }
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
}) {
  const moduleExports: {
    status: string
    importerDir: string
    root: string
    outDir: string
    load: () => void
  } = require('./autoImporter')
  assertStatus()
  moduleExports.load()

  return

  function assertStatus() {
    {
      const { status } = moduleExports
      assert(['UNSET', 'RESETING', 'SET'].includes(status), { status })
      assert(status === 'SET', { status })
    }
    if (opts.distPath) {
      const outDirBuild = normalizePath(moduleExports.outDir)
      const outDirCurrent = normalizePath(opts.distPath.outDir)
      const sameOutDir = outDirCurrent === outDirBuild
      const rootCurrent = normalizePath(opts.distPath.root)
      const rootBuild = normalizePath(moduleExports.root)
      const sameRoot =
        path.posix.relative(getImporterDir(), rootCurrent) ===
        path.posix.relative(moduleExports.importerDir, rootCurrent)
      assertUsage(
        sameRoot && sameOutDir,
        [
          'Your build seem outdated; rebuild your app.',
          !sameOutDir
            ? `(Your current \`vite.config.js#build.outDir\` is '${outDirCurrent}' while your build has \`outDir === '${outDirBuild}'\`.)`
            : `(Your current \`vite.config.js#root\` is '${rootCurrent}' while your build has \`root === '${rootBuild}'\`.)`
        ].join(' ')
      )
    }
  }

  // Circumvent TS bug
  // https://github.com/microsoft/TypeScript/issues/36931
  function assert(condition: unknown, debugInfo?: unknown): asserts condition {
    opts.assert(condition, debugInfo)
  }
  function assertUsage(condition: unknown, msg: string): asserts condition {
    opts.assertUsage(condition, msg)
  }
}
