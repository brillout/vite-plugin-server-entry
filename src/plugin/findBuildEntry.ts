export { findBuildEntry }
export type { RollupBundle }

import { assert } from './utils'

// Subset of: `import type { OutputBundle } from 'rollup'`. (We use a subset to avoid mismatch upon different Rollup versions.)
type RollupBundle = Record<string, unknown>

function findBuildEntry(entryName: string, rollupBundle: RollupBundle) {
  let entryFound: undefined | string
  const entries = Object.keys(rollupBundle)
  for (const entry of entries) {
    if (entry.endsWith('.map')) continue // https://github.com/brillout/vite-plugin-ssr/issues/612
    assert(!entryName.includes('.'))
    if (entryName === entry.split('.')[0]) {
      assert(!entryFound)
      entryFound = entry
    }
  }
  if (!entryFound) {
    const entriesStr = entries.map((e) => `'${e}'`).join(', ')
    throw new Error(
      `Cannot find build entry '${entryName}'. Make sure your Rollup config doesn't change the entry name '${entryName}'. (Found entries: [${entriesStr}].)`
    )
  }
  return entryFound
}
