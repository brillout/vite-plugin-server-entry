export { isViteServerSide }

import type { Environment } from 'vite'
import { assert } from './assert.js'

function isViteServerSide(
  config: { build?: { ssr?: boolean | string } },
  viteEnv:
    | Environment
    // Vite 5
    | undefined,
): boolean {
  if (!viteEnv) return !!config?.build?.ssr
  const { consumer } = viteEnv.config
  assert(consumer === 'server' || consumer === 'client')
  return consumer === 'server'
}
