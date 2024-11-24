export { crawlServerEntry }

import { getCwdSafe, assert, assertUsage, assertPosixPath, requireResolve, isWebpackResolve } from './utils'
import { import_ } from '@brillout/import'
import { serverEntryFileNameBase, serverEntryFileNameBaseAlternative } from '../shared/serverEntryFileNameBase'

// Use Node.js to search for the file dist/server/entry.js which we use only as fallback if:
// - the server entry isn't injected (the setting `inject` is `false`), and
// - the auto importer doesn't work.
async function crawlServerEntry(outDir?: string): Promise<boolean> {
  let path: typeof import('path')
  let fs: typeof import('fs')
  try {
    path = await import_('path')
    fs = await import_('fs')
  } catch {
    return false
  }

  const isPathAbsolute = (p: string) => {
    if (process.platform === 'win32') {
      return path.win32.isAbsolute(p)
    } else {
      return p.startsWith('/')
    }
  }

  if (outDir) {
    // Only pre-rendering has access to config.build.outDir
    assertPosixPath(outDir)
    assert(isPathAbsolute(outDir), outDir)
  } else {
    const cwd = getCwdSafe()
    if (!cwd) return false
    // The SSR server doesn't have access to config.build.outDir so the only option we've left is to shoot in the dark by trying with 'dist/'
    outDir = path.posix.join(cwd, 'dist')
  }
  const serverEntryFileDir = path.posix.join(outDir, 'server')
  if (!fs.existsSync(serverEntryFileDir)) return false

  let filename: string | undefined
  try {
    filename = __filename
  } catch {
    // __filename isn't defined when this file is bundled into an ESM bundle
  }
  /* There doens't seem to be a way to safely/conditionally access `import.meta`.
   * - The try-catch below doesn't work as the following is still thrown:
   *   ```
   *   SyntaxError: Cannot use 'import.meta' outside a module
   *   ```
  try {
    // import.meta.filename is defined when this file is bundled into an ESM module
    // @ts-ignore
    filename = import.meta.filename
  } catch {}
  */
  if (!filename) {
    return false
  }

  let serverEntryFilePath: string | null = null
  const entryFileCandidates = [
    `${serverEntryFileNameBase}.mjs`,
    `${serverEntryFileNameBase}.js`,
    `${serverEntryFileNameBase}.cjs`,
    `${serverEntryFileNameBaseAlternative}.mjs`,
    `${serverEntryFileNameBaseAlternative}.js`,
    `${serverEntryFileNameBaseAlternative}.cjs`
  ]
  for (const entryFileName of entryFileCandidates) {
    const serverEntryFilePathSpeculative = path.posix.join(serverEntryFileDir, entryFileName)
    try {
      serverEntryFilePath = await requireResolve(serverEntryFilePathSpeculative, filename)
    } catch {}
  }
  assertUsage(
    serverEntryFilePath,
    `Cannot find server entry. If you use rollupOptions.output.entryFileNames then make sure to not rename the server entry file. Make sure that one of the following exists: \n${entryFileCandidates.map((e) => `  ${e}`).join('\n')}`
  )

  // webpack couldn't have properly resolved distImporterPath (since there is not static import statement)
  if (isWebpackResolve(serverEntryFilePath)) {
    return false
  }

  await import_(serverEntryFilePath)
  return true
}
