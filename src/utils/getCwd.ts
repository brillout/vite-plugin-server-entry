import { toPosixPath } from './filesystemPathHandling'

export function getCwd() {
  // No `process.cwd()` in Cloudflare Worker
  if (typeof process == 'undefined' || !('cwd' in process)) return null
  return toPosixPath(process.cwd())
}
