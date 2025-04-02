export { findRollupBundleEntry }

import { assert } from './assert.js'
import { isNotNullish } from './isNullish.js'

function findRollupBundleEntry<OutputBundle extends Record<string, { name: string | undefined }>>(
  entryName: string,
  bundle: OutputBundle,
): OutputBundle[string] | null {
  let found: OutputBundle[string] | null = null
  for (const key in bundle) {
    if (key.endsWith('.map')) continue // https://github.com/brillout/vite-plugin-ssr/issues/612
    const entry = bundle[key]!
    const { name } = entry
    const entryNames = [
      entryName,
      // https://github.com/brillout/vite-plugin-server-entry/issues/18
      entryName + '.js',
    ]
    if ((name && entryNames.includes(name)) || entryNames.includes(key)) {
      if (found) {
        assert(false, {
          entryName,
          names: Object.values(bundle)
            .map((entry) => entry.name)
            .filter(isNotNullish),
          keys: Object.keys(bundle),
        })
      }
      found = entry
    }
  }
  return found
}
