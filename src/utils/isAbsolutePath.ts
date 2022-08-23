export { isAbsolutePath }

import path from 'path'
import { assertPosixPath } from './filesystemPathHandling'
import { assert } from './assert'

function isAbsolutePath(p: string) {
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
