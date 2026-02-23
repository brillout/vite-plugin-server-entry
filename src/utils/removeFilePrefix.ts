export { removeFilePrefix }

import { assert } from './assert.js'

// Needed for import.meta.resolve()
function removeFilePrefix(filePath: string) {
  assert(process) // We are in a Node.js-like environment
  const filePrefix = process.platform === 'win32' ? 'file:///' : 'file://'
  if (filePath.startsWith(filePrefix)) filePath = filePath.slice(filePrefix.length)
  return filePath
}
