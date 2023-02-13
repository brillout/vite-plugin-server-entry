export { isYarnPnP }

import { import_ } from '@brillout/import'

async function isYarnPnP(): Promise<boolean> {
  try {
    // We could as well simply `require('pnpapi')` since this file isn't incuded in the server runtime
    await import_('pnpapi')
    return true
  } catch {
    return false
  }
}
