export { isWebpackResolve }

import { toPosixPath } from './filesystemPathHandling.js'

function isWebpackResolve(moduleResolve: string, cwd: string) {
  return (
    // Upon `require.resolve()` webpack returns a number
    typeof moduleResolve === 'number' ||
    // Upon `import.meta.resolve()` webpack returns a path such as /test/webpack/dist/server/entry.mjs which seems to be relative to the monorepo root
    getFirstDir(moduleResolve) !== getFirstDir(cwd)
  )
}

function getFirstDir(path: string): string {
  return toPosixPath(path).split('/').filter(Boolean)[0]!
}
