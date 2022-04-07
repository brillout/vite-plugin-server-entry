export function toPosixPath(p: string) {
  return p.split('\\').join('/')
}

export function assert(condition: unknown): asserts condition {
  if (condition) return

  throw new Error(
    [
      '[vite-plugin-import-build][Bug] You stumbled upon a bug in the source code of vite-plugin-import-build.',
      'Reach out at https://github.com/brillout/vite-plugin-import-build/issues/new and include this error stack (the error stack is usually enough to fix the problem).'
    ].join(' ')
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
