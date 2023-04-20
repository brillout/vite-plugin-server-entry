export { importBuild }

import type { Plugin, ResolvedConfig } from 'vite'
import type { EmitFile } from 'rollup'
import {
  isYarnPnP,
  assert,
  assertPosixPath,
  viteIsSSR,
  isAbsolutePath,
  toPosixPath,
  projectInfo,
  objectAssign
} from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from '../shared/importBuildFileName'
import { findBuildEntry, RollupBundle } from './findBuildEntry'
import { debugLogsBuildtime } from '../shared/debugLogs'
const autoImporterFilePath = require.resolve('../autoImporter')
const configVersion = 1

type Options = { getImporterCode: GetImporterCode; libraryName: string }
type Data = {
  libraries: Library[]
  importerAlreadyGenerated: boolean
  configVersion: number
  disableAutoImporter: boolean
}
type Config = ResolvedConfig & {
  _vitePluginImportBuild: Data
}
type ConfigUnprocessed = ResolvedConfig & {
  // Public (not really public though since it only has a single config which is private)
  vitePluginImportBuild?: {
    // This flag is only used by https://github.com/brillout/vite-plugin-ssr/tree/main/test/disableAutoImporter
    _disableAutoImporter?: boolean
  }
  // Private
  _vitePluginImportBuild?: Data
}
type GetImporterCode = (args: { findBuildEntry: (entryName: string) => string }) => string
type Library = {
  libraryName: string
  vitePluginImportBuildVersion?: string // can be undefined when set by an older vite-plugin-import-build version
  getImporterCode: GetImporterCode
}

function importBuild(options: Options): Plugin_ {
  let config: Config
  let isServerSide = false
  return {
    name: `@brillout/vite-plugin-import-build:${options.libraryName}`,
    apply: (_, env) => env.command === 'build',
    configResolved(configUnprocessed: ConfigUnprocessed) {
      isServerSide = viteIsSSR(configUnprocessed)
      if (!isServerSide) return
      config = resolveConfig(configUnprocessed, options)
    },
    buildStart() {
      if (!isServerSide) return
      assertOnlyNewerVersions(config)
      resetAutoImporter()
    },
    async generateBundle(_rollupOptions, rollupBundle) {
      if (!isServerSide) return
      const emitFile = this.emitFile.bind(this)
      await generateImporter(emitFile, rollupBundle, config)
    }
  } as Plugin
}

function resolveConfig(configUnprocessed: ConfigUnprocessed, options: Options): Config {
  assert(viteIsSSR(configUnprocessed))
  const data: Data = configUnprocessed._vitePluginImportBuild ?? {
    libraries: [],
    importerAlreadyGenerated: false,
    configVersion,
    disableAutoImporter: false
  }

  assert(data.configVersion === 1)
  assert(configVersion === 1)
  if (data.configVersion !== configVersion) {
    // We don't use this yet (IIRC configVersion never had another value than `1`)
    assert(1 === 1 + 1)
    const otherLibrary = data.libraries[0]
    assert(otherLibrary)
    assert(otherLibrary.libraryName !== options.libraryName)
    throw new Error(
      `Conflict between ${options.libraryName} and ${otherLibrary.libraryName}. Update both to their latest version and try again.`
    )
  }

  data.libraries.push({
    getImporterCode: options.getImporterCode,
    libraryName: options.libraryName,
    vitePluginImportBuildVersion: projectInfo.projectVersion
  })

  objectAssign(configUnprocessed, {
    _vitePluginImportBuild: data
  })
  return configUnprocessed
}

async function generateImporter(emitFile: EmitFile, rollupBundle: RollupBundle, config: Config) {
  // Let the newest vite-plugin-import-build version generate autoImporter.js
  if (isUsingOlderVitePluginImportBuildVersion(config)) return
  if (config._vitePluginImportBuild.importerAlreadyGenerated) return
  config._vitePluginImportBuild.importerAlreadyGenerated = true

  assert(viteIsSSR(config)) // rollupBundle should be the server-side one
  const source = [
    ...config._vitePluginImportBuild.libraries.map(({ getImporterCode }) =>
      getImporterCode({
        findBuildEntry: (entryName: string) => findBuildEntry(entryName, rollupBundle, config)
      })
    )
  ].join('\n')

  emitFile({
    fileName: importBuildFileName,
    type: 'asset',
    source
  })

  setAutoImporter(config)
}

function setAutoImporter(config: Config) {
  if (autoImporterIsDisabled(config)) return
  const { distServerPathRelative, distServerPathAbsolute } = getDistServerPathRelative(config)
  const importBuildFilePathRelative = path.posix.join(distServerPathRelative, importBuildFileName)
  const importBuildFilePathAbsolute = path.posix.join(distServerPathAbsolute, importBuildFileName)
  const { root } = config
  assertPosixPath(root)
  writeFileSync(
    autoImporterFilePath,
    [
      "exports.status = 'SET';",
      `exports.loadImportBuild = () => { require(${JSON.stringify(importBuildFilePathRelative)}) };`,
      'exports.paths = {',
      `  autoImporterFilePathOriginal: ${JSON.stringify(autoImporterFilePath)},`,
      '  autoImporterFileDirActual: (() => { try { return __dirname } catch { return null } })(),',
      `  importBuildFilePathRelative: ${JSON.stringify(importBuildFilePathRelative)},`,
      `  importBuildFilePathOriginal: ${JSON.stringify(importBuildFilePathAbsolute)},`,
      `  importBuildFilePathResolved: () => require.resolve(${JSON.stringify(importBuildFilePathRelative)}),`,
      '};',
      // Support old vite-plugin-import-build@0.1.12 version, which is needed e.g. if user uses a Telefunc version using 0.1.12 while using a VPS version using 0.2.0
      `exports.load = exports.loadImportBuild;`,
      ''
    ].join('\n')
  )
}
function resetAutoImporter() {
  try {
    writeFileSync(autoImporterFilePath, ["exports.status = 'UNSET';", ''].join('\n'))
  } catch {}
}

function autoImporterIsDisabled(config: Config): boolean {
  return config._vitePluginImportBuild.disableAutoImporter ?? isYarnPnP()
}

function isUsingOlderVitePluginImportBuildVersion(config: Config): boolean {
  return config._vitePluginImportBuild.libraries.some((library) => {
    if (!library.vitePluginImportBuildVersion) return false
    return isHigherVersion(library.vitePluginImportBuildVersion, projectInfo.projectVersion)
  })
}

function isHigherVersion(semver1: string, semver2: string): boolean {
  const semver1Parts = parseSemver(semver1)
  const semver2Parts = parseSemver(semver2)
  for (let i = 0; i <= semver1Parts.length - 1; i++) {
    if (semver1Parts[i] === semver2Parts[i]) continue
    return semver1Parts[i] > semver2Parts[i]
  }
  return false
}

function parseSemver(semver: string): number[] {
  assert(/^[0-9\.]+$/.test(semver))
  const parts = semver.split('.')
  assert(parts.length === 3)
  return parts.map((n) => parseInt(n, 10))
}

function getDistServerPathRelative(config: ResolvedConfig) {
  assert(viteIsSSR(config))
  const { root } = config
  assertPosixPath(root)
  assert(isAbsolutePath(root))
  const importerDir = getImporterDir()
  const rootRelative = path.posix.relative(importerDir, root) // To `require()` an absolute path doesn't seem to work on Vercel
  let { outDir } = config.build
  // SvelteKit doesn't set config.build.outDir to a posix path
  outDir = toPosixPath(outDir)
  if (isAbsolutePath(outDir)) {
    outDir = path.posix.relative(root, outDir)
    assert(!isAbsolutePath(outDir))
  }
  const distServerPathRelative = path.posix.join(rootRelative, outDir)
  const distServerPathAbsolute = path.posix.join(root, outDir)
  debugLogsBuildtime({ importerDir, root, rootRelative, outDir, distServerPathRelative, distServerPathAbsolute })
  return { distServerPathRelative, distServerPathAbsolute }
}

function getImporterDir() {
  const currentDir = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  return path.posix.join(currentDir, '..')
}

function assertOnlyNewerVersions(config: Config) {
  if (!('vitePluginDistImporter' in config)) {
    return
  }
  const dataOld: any = (config as Record<string, any>).vitePluginDistImporter
  const libName = dataOld.libraries[0]!.libraryName
  assert(libName)
  // We purposely use `throw new Error()` instead of assertUsage()
  throw new Error(`update ${libName} to its latest version and try again`)
}

// Avoid multiple Vite versions mismatch
type Plugin_ = any
