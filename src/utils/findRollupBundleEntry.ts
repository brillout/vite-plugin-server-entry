export { findRollupBundleEntry }

function findRollupBundleEntry<OutputBundle extends Record<string, { name: string | undefined }>>(
  entryName: string,
  bundle: OutputBundle
): OutputBundle[string] | null {
  for (const key in bundle) {
    if (key.endsWith('.map')) continue // https://github.com/brillout/vite-plugin-ssr/issues/612
    const entry = bundle[key]!
    if (entry.name === entryName) return entry
  }
  return null
}
