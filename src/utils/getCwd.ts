import { toPosixPath } from './filesystemPathHandling'

export function getCwd(): string | null {
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return toPosixPath(process.cwd())
}
