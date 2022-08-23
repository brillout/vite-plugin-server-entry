import { getCwd } from './getCwd'

export function isCloudflareWorkersAlike() {
  return getCwd() === null
}
