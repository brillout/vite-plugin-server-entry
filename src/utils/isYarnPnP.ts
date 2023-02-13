export function isYarnPnP(): boolean {
  try {
    require('pnpapi')
    return true
  } catch {
    return false
  }
}
