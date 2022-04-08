export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}

export function assertPosixPath(filePath: string) {
  assert(!filePath.includes('\\'), `Non-posix file path: \`${filePath}\``)
}

export function getImporterDir() {
  return toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
}

export function normalizePath(p: string) {
  assertPosixPath(p)
  let pn = p.split('/').filter(Boolean).join('/')
  if (p.startsWith('/')) {
    pn = '/' + pn
  }
  return pn
}

export function assert(condition: unknown, debugInfo?: unknown): asserts condition {
  if (condition) return

  const debugStr = typeof debugInfo === 'string' ? debugInfo : '`' + JSON.stringify(debugInfo) + '`'

  throw new Error(
    [
      '[vite-plugin-import-build][Bug] You stumbled upon a bug in the source code of vite-plugin-import-build.',
      'Reach out at https://github.com/brillout/vite-plugin-import-build/issues/new and include this error stack',
      '(the error stack is usually enough to fix the problem).',
      debugStr && `(Debug info for the maintainers: \`${debugStr}\`.)`
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

export function isRunningWithYarnPnp() {
  try {
    require('pnpapi')
    return true
  } catch {
    return false
  }
}

export function applyDev(_config: unknown, { command, mode }: { command: string; mode: string }): boolean {
  assert(command)
  assert(mode)
  return command === 'serve' && mode === 'development'
}
