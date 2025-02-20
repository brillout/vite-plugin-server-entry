export function removeFilePrefix(filePath: string) {
  console.log('removeFilePrefix 1', filePath)
  const filePrefix = process.platform === 'win32' ? 'file:///' : 'file://'
  if (filePath.startsWith(filePrefix)) filePath = filePath.slice(filePrefix.length)
  console.log('removeFilePrefix 2', filePath)
  return filePath
}
