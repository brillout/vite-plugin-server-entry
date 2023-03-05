export { findBuildEntry }
export type { RollupBundle }

import type { ResolvedConfig } from 'vite'
import { assert, assertUsage } from './utils'

// Subset of: `import type { OutputBundle } from 'rollup'`. (We use a subset to avoid mismatch upon different Rollup versions.)
type RollupBundle = Record<string, unknown>

function findBuildEntry(entryName: string, rollupBundle: RollupBundle, config: ResolvedConfig) {
  let entryFound: undefined | string
  const entries = Object.keys(rollupBundle)
  for (const name of entries) {
    if (name.endsWith('.map')) continue // https://github.com/brillout/vite-plugin-ssr/issues/612
    assert(!entryName.includes('.'))
    assert(!entryName.includes('-'))
    const nameWithoutHash = name.split('.')[0].split('-')[0]
    if (entryName === nameWithoutHash) {
      assert(!entryFound)
      entryFound = name
    }
  }
  if (!entryFound) {
    const entriesStr = entries.map((e) => `'${e}'`).join(', ')
    assertUsage(
      false,
      `Cannot find server build entry '${entryName}'. Make sure your Rollup config doesn't change the entry name '${entryName}' of your server build ${config.build.outDir}. (Found server build entries: [${entriesStr}].)`
    )
  }
  return entryFound
}
