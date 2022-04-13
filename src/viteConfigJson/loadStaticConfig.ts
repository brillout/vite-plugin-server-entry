export { loadStaticConfig }
export type { ConfigStatic }

import { assert, getCwd, isCloudflareWorkersAlike, lookupFile, toPosixPath } from '../utils'
import path from 'path'
import fs from 'fs'

type ConfigStatic = {
  configFile: null | string // vite.config.json
  rootFile: string // vite.config.json / vite.config.js / package.json
  root: string
  cwd: string
  build: { outDir: string }
} & Record<string, unknown>

const outDirDefaultValue = 'dist'

function loadStaticConfig(): null | ConfigStatic {
  const cwd = getCwd()
  if (!cwd) {
    // Environments that don't have `process.cwd()` nor `readFileSync()` such as Cloudflare Workers
    assert(isCloudflareWorkersAlike())
    return null
  }

  const configFile = lookupFile(cwd, ['vite.config.json'])
  if (!configFile) {
    const { root, rootFile } = findRoot(cwd)
    return { configFile: null, cwd, root, rootFile, build: { outDir: outDirDefaultValue } }
  }

  const jsonConfig: Record<string, unknown> = JSON.parse(fs.readFileSync(configFile, 'utf-8'))

  let root = toPosixPath(path.dirname(configFile))
  if (jsonConfig.root) {
    if (typeof jsonConfig.root !== 'string') {
      throw new Error('vite.config.json#root should be a string')
    }
    if (jsonConfig.root.includes('\\')) {
      throw new Error(`vite.config.json#root is a windows path, but it should be a posix path instead.`)
    }
    root = path.posix.join(root, jsonConfig.root)
  }

  const outDir = (jsonConfig?.build as undefined | Record<string, unknown>)?.outDir ?? outDirDefaultValue
  if (typeof outDir !== 'string') {
    throw new Error('vite.config.json#build.outDir should be a string')
  }

  return { ...jsonConfig, configFile, cwd, root, rootFile: configFile, build: { outDir } }
}

function findRoot(cwd: string) {
  const rootFile = lookupFile(cwd, [
    'vite.config.js',
    'vite.config.cjs',
    'vite.config.mjs',
    'vite.config.ts',
    'package.json'
  ])
  if (!rootFile)
    throw new Error(
      `The current directoy ${cwd} does not seem to be part of an app: no \`package.json\` nor \`vite.config.js\` file found in the current, parent, and ancestor directories.`
    )
  const root = toPosixPath(path.dirname(rootFile))
  return { root, rootFile }
}
