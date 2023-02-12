import { getCwd } from './getCwd'

export function isNodeJS() {
  return getCwd() !== null
}
