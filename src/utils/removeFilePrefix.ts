export function removeFilePrefix(filePath: string) {
  const filePrefix = process.platform === 'win32' ? 'file:///' : 'file://'
  if (filePath.startsWith(filePrefix)) filePath = filePath.slice(filePrefix.length)
  return filePath
}
