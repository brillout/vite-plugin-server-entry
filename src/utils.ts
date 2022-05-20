export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}

export function assertPosixPath(filePath: string) {
  assert(!filePath.includes('\\'), `non-posix file path \`${filePath}\`.`)
}

export function getImporterDir() {
  return toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
}

export function isCloudflareWorkersAlike() {
  return getCwd() === null
}

export function assert(condition: unknown, debugInfo?: unknown): asserts condition {
  if (condition) return

  const debugStr = debugInfo && (typeof debugInfo === 'string' ? debugInfo : '`' + JSON.stringify(debugInfo) + '`')

  throw new Error(
    [
      '[vite-plugin-dist-importer][Bug] You stumbled upon a bug in the source code of vite-plugin-import-build.',
      'Reach out at https://github.com/brillout/vite-plugin-dist-importer/issues/new and include this error stack',
      '(the error stack is usually enough to fix the problem).',
      debugStr && `(Debug info for the maintainers: ${debugStr})`
    ]
      .filter(Boolean)
      .join(' ')
  )
}

export function isSSR(config: { build?: { ssr?: boolean | string } }): boolean {
  return !!config?.build?.ssr
}

// Same as `Object.assign()` but with type inference
export function objectAssign<Obj, ObjAddendum>(obj: Obj, objAddendum: ObjAddendum): asserts obj is Obj & ObjAddendum {
  Object.assign(obj, objAddendum)
}

export function isYarnPnP() {
  try {
    require('pnpapi')
    return true
  } catch {
    return false
  }
}

export function getCwd() {
  // No `process.cwd()` in Cloudflare Worker
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return toPosixPath(process.cwd())
}

import path from 'path'
export function isAbsolutePath(p: string) {
  const testPath = 'E:/Projects/vite-ssr-test/dist/server'
  assertPosixPath(testPath)
  assertPosixPath(p)
  // ```
  // const p = 'E:/Projects/vite-ssr-test/dist/server'
  // assertPosixPath(p)
  // assert(path.posix.isAbsolute(p)===false)
  // assert(path.win32.isAbsolute(p)===true)
  // ```
  if (process.platform === 'win32') {
    assert(path.win32.isAbsolute(testPath))
    return path.win32.isAbsolute(p)
  } else {
    return path.posix.isAbsolute(p)
  }
}
