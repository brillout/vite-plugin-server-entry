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

const wrongUsageWithInject =
  `Execute the server entry built for production (e.g. ${pc.cyan('$ node dist/server/index.mjs')}). Don't execute the original server entry (e.g. ${pc.cyan('$ ts-node server/index.ts')}) nor run ${pc.cyan('$ vike preview')}.` as const

// Use Node.js to search for the file dist/server/entry.js which we use only as fallback if:
// - the server entry isn't injected (the setting `inject` is `false`), and
// - the auto importer doesn't work.
async function crawlServerEntry({
  outDir,
  tolerateNotFound,
  doNotLoadServer,
}: { outDir?: string; tolerateNotFound?: boolean; doNotLoadServer?: boolean }): Promise<boolean> {
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
  const outDirServer = path.posix.join(outDir, 'server')
  const outDirServerExists: boolean = fs.existsSync(outDirServer)
  if (!outDirServerExists) return false

  const outFileNames = [
    `${serverEntryFileNameBase}.mjs`,
    `${serverEntryFileNameBase}.js`,
    `${serverEntryFileNameBase}.cjs`,
    `${serverEntryFileNameBaseAlternative}.mjs`,
    `${serverEntryFileNameBaseAlternative}.js`,
    `${serverEntryFileNameBaseAlternative}.cjs`,
  ]
  if (!doNotLoadServer) {
    outFileNames.push(
      ...[
        //
        `${serverIndexFileNameBase}.mjs`,
        `${serverIndexFileNameBase}.js`,
        `${serverIndexFileNameBase}.cjs`,
      ],
    )
  }

  let outFilePathFound: string | undefined
  let outFileNameFound: (typeof outFileNames)[number] | undefined
  const getDistFilePath = (outFileName: string) => path.posix.join(outDirServer, outFileName)
  for (const outFileName of outFileNames) {
    const outFilePath = getDistFilePath(outFileName)
    assert(isPathAbsolute(outFilePath))
    try {
      outFilePathFound = await requireResolve(
        outFilePath,
        // Since `outFilePath` is absolute, we can pass a wrong `currentFilePath` argument value.
        // - We avoid using `__filename` because it isn't defined when this file is included in an ESM bundle.
        // - We cannot use `import.meta.filename` (nor `import.meta.url`) because there doesn't seem to be a way to safely/conditionally access `import.meta`.
        cwd,
      )
      outFileNameFound = outFileName
      break
    } catch {}
  }

  if (!outFilePathFound) {
    if (tolerateNotFound) return false
    assert(outDirServerExists)
    assertUsage(
      false,
      `The server production entry is missing. If you are using rollupOptions.output.entryFileNames then make sure you don't change the file name of the production server entry. One of the following is expected to exist: \n${outFileNames.map((outFileName) => `  ${getDistFilePath(outFileName)}`).join('\n')}`,
    )
  }
  assert(outFileNameFound)
  assert(
    [serverIndexFileNameBase, serverEntryFileNameBase, serverEntryFileNameBaseAlternative].some((fileNameBase) =>
      outFileNameFound.startsWith(fileNameBase),
    ),
  )
  if (outFileNameFound.startsWith(serverIndexFileNameBase)) {
    if (tolerateNotFound) return false
    assertUsage(false, wrongUsageWithInject)
  }

  // webpack couldn't have properly resolved `outFilePathFound` since there isn't any static import statement importing `outFilePathFound`
  if (isWebpackResolve(outFilePathFound)) {
    return false
  }

  await import_(outFilePathFound)
  return true
}
