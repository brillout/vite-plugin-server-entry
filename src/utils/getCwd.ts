export { getCwd }

import { toPosixPath } from './filesystemPathHandling'

function getCwd(): string | null {
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return toPosixPath(process.cwd())
}
