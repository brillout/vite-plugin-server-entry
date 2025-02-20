export { isWebpackResolve }

import { toPosixPath } from './filesystemPathHandling.js'

function isWebpackResolve(moduleResolve: string, cwd: string) {
  console.log('isWebpackResolve', moduleResolve, cwd)
  return (
    // Upon `require.resolve()` webpack returns a number
    typeof moduleResolve === 'number' ||
    // Upon `import.meta.resolve()` webpack returns a path such as /test/webpack/dist/server/entry.mjs which seems to be relative to the monorepo root
    getFirstDir(moduleResolve) !== getFirstDir(cwd) ||
    // `import.meta.resolve()` + windows => webpack returns file:///D:/test/webpack/dist/server/entry.mjs
    (process.platform === 'win32' && getSecondDir(moduleResolve) !== getSecondDir(cwd))
  )
}

function getFirstDir(path: string) {
  return getDirs(path)[0]!
}
function getSecondDir(path: string) {
  return getDirs(path)[1]
}
function getDirs(path: string) {
  return toPosixPath(path).split('/').filter(Boolean)
}
