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
    if (
      // Workaround weird randomness of entry being included twice: https://github.com/brillout/vite-plugin-server-entry/issues/20
      // It also makes sense: the output file is expected to be dist/server/entry.{js,mjs,cjs}
      key.startsWith('entry.') &&
      (name === 'entry' ||
        // https://github.com/brillout/vite-plugin-server-entry/issues/18
        !name)
    ) {
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
