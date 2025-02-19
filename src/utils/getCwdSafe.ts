export { getCwdSafe }

import { toPosixPath } from './filesystemPathHandling.js'

function getCwdSafe(): string | null {
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return toPosixPath(process.cwd())
}
