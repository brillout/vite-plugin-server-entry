export { isYarnPnP }

import { import_ } from '@brillout/import'

async function isYarnPnP(): Promise<boolean> {
  try {
    await import_('pnpapi')
    return true
  } catch {
    return false
  }
}
