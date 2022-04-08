import { normalizePath } from 'vite'
import { getSrcDir, rebasePath } from './utils'

export { load }

function load(opts: {
  root: string
  outDir: string
  assert: (condition: unknown, debugInfo?: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
}) {
  const moduleExports: {
    status: string
    dirname: string
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
    }
    {
      const outDirBuild = normalizePath(moduleExports.outDir)
      const outDirCurrent = normalizePath(opts.outDir)
      const sameOutDir = outDirCurrent === outDirBuild
      const rootCurrent = normalizePath(opts.root)
      const rootBuild = normalizePath(rebasePath(moduleExports.root, moduleExports.dirname, getSrcDir()))
      const sameRoot = rootCurrent === rootBuild
      assertUsage(
        sameRoot && sameOutDir,
        [
          'Your build seem outdated; rebuild your app.',
          !sameOutDir
            ? `(Your current \`outDir\` is '${outDirCurrent}' while your build has \`outDir === '${outDirBuild}'\`.)`
            : `(Your current \`root\` is '${rootCurrent}' while your build has \`root === '${rootBuild}'\`.)`
        ].join('\n')
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
