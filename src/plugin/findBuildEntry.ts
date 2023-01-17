export { findBuildEntry }
export type { RollupOptions, RollupBundle }

import { assert, assertPosixPath, viteIsSSR, rollupIsEsm } from './utils'

// Subset of: `import type { NormalizedOutputOptions } from 'rollup'` (to avoid mismatch upon different Rollup versions)
type RollupOptions = { entryFileNames: string | ((chunkInfo: any) => string); format: string }
// Subset of: `import type { OutputBundle } from 'rollup'` (to avoid mismatch upon different Rollup versions)
type RollupBundle = Record<string, unknown>
// Subset of: `import type { ResolvedConfig } from 'vite'` (to avoid mismatch upon different Vite versions)
type ViteConfig = {
  build: { outDir: string; ssr: boolean | string }
}

function findBuildEntry(
  entryName: string,
  rollupOptions: RollupOptions,
  rollupBundle: RollupBundle,
  config: ViteConfig
) {
  assert(viteIsSSR(config))
  const fileExt = getFileExt(rollupOptions)
  assert(fileExt !== 'mjs' || rollupIsEsm(rollupOptions))
  const entryFileName = `${entryName}.${fileExt}`
  assertEntryExistence(entryFileName, rollupBundle, config)
  return entryFileName
}

function assertEntryExistence(entryFileName: string, rollupBundle: RollupBundle, config: ViteConfig) {
  const bundleFiles = Object.keys(rollupBundle)
  const { outDir } = config.build
  assertPosixPath(outDir)
  if (!bundleFiles.includes(entryFileName)) {
    throw new Error(
      `\`${outDir}/${entryFileName}\` is missing: make sure your Rollup config doesn't change the name of the file \`${entryFileName}\``
    )
  }
}

function getFileExt(rollupOptions: RollupOptions): 'js' | 'mjs' {
  const { entryFileNames } = rollupOptions
  const fileExt = typeof entryFileNames === 'string' && entryFileNames.endsWith('.mjs') ? 'mjs' : 'js'
  return fileExt
}
