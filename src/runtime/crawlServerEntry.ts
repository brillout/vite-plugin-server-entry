export { crawlServerEntry }
export { wrongUsageWithInject }

import { assert, assertUsage, assertPosixPath, requireResolve, isWebpackResolve } from './utils'
import { import_ } from '@brillout/import'
import {
  serverEntryFileNameBase,
  serverEntryFileNameBaseAlternative,
  serverIndexFileNameBase,
} from '../shared/serverEntryFileNameBase'
import pc from '@brillout/picocolors'

const wrongUsageWithInject = `Execute the server entry built for production (e.g. ${pc.cyan('$ node dist/server/index.mjs')}). Don't execute the original server entry (e.g. ${pc.cyan('$ ts-node server/index.ts')}) nor run ${pc.cyan('$ vike preview')}.`

// Use Node.js to search for the file dist/server/entry.js which we use only as fallback if:
// - the server entry isn't injected (the setting `inject` is `false`), and
// - the auto importer doesn't work.
async function crawlServerEntry(outDir?: string, tolerateNotFound?: boolean): Promise<boolean> {
  let path: typeof import('path')
  let fs: typeof import('fs')
  try {
    path = await import_('path')
    fs = await import_('fs')
  } catch {
    return false
  }
  const cwd = process.cwd()

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
    if (!cwd) return false
    // The SSR server doesn't have access to config.build.outDir so the only option left is to shoot in the dark by trying with 'dist/'
    outDir = path.posix.join(cwd, 'dist')
  }
  const serverEntryFileDir = path.posix.join(outDir, 'server')
  if (!fs.existsSync(serverEntryFileDir)) return false

  let distFilePathFound: string | undefined
  let distFileNameFound: (typeof distFileNames)[number] | undefined
  const distFileNames = [
    `${serverEntryFileNameBase}.mjs`,
    `${serverEntryFileNameBase}.js`,
    `${serverEntryFileNameBase}.cjs`,
    `${serverEntryFileNameBaseAlternative}.mjs`,
    `${serverEntryFileNameBaseAlternative}.js`,
    `${serverEntryFileNameBaseAlternative}.cjs`,
    `${serverIndexFileNameBase}.mjs`,
    `${serverIndexFileNameBase}.js`,
    `${serverIndexFileNameBase}.cjs`,
  ] as const
  for (const distFileName of distFileNames) {
    const distFilePath = path.posix.join(serverEntryFileDir, distFileName)
    assert(isPathAbsolute(distFilePath))
    try {
      distFilePathFound = await requireResolve(
        distFilePath,
        // Since `serverEntryFilePathSpeculative` is absolute, we can pass a wrong `currentFilePath` argument value.
        // - We avoid using `__filename` because it isn't defined when this file is included in an ESM bundle.
        // - We cannot use `import.meta.filename` (nor `import.meta.url`) because there doesn't seem to be a way to safely/conditionally access `import.meta`.
        cwd,
      )
      distFileNameFound = distFileName
      break
    } catch {}
  }
  if (!distFilePathFound) {
    if (tolerateNotFound) return false
    assertUsage(
      false,
      `Cannot find server production entry. If you are using rollupOptions.output.entryFileNames then make sure you don't change the name of the server entry file. One of the following is expected to exist: \n${distFileNames.map((e) => `  ${e}`).join('\n')}`,
    )
  }
  assert(
    distFileNameFound &&
      [serverIndexFileNameBase, serverEntryFileNameBase, serverEntryFileNameBaseAlternative].some((fileNameBase) =>
        distFileNameFound.startsWith(fileNameBase),
      ),
  )
  if (!distFileNameFound.startsWith(serverIndexFileNameBase)) {
    if (tolerateNotFound) return false
    assertUsage(false, wrongUsageWithInject)
  }

  // webpack couldn't have properly resolved `distFilePathFound` since there isn't any static import statement importing `distFilePathFound`
  if (isWebpackResolve(distFilePathFound)) {
    return false
  }

  await import_(distFilePathFound)
  return true
}
