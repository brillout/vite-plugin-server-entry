export { importBuild }

import type { Plugin, ResolvedConfig as ConfigVite } from 'vite'
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
import type { AutoImporterCleared } from '../loadServerBuild/AutoImporter'
const autoImporterFilePath = require.resolve('../autoImporter')
const configVersion = 1

// Config set by library using @brillout/vite-plugin-import-build (e.g. Vike or Telefunc)
type PluginConfigProvidedByLibrary = {
  getImporterCode: GetImporterCode
  libraryName: string
  disableAutoImporter?: boolean
}
// Config set by end user (e.g. Vike or Telefunc user)
//  - Currently only used by https://github.com/brillout/vite-plugin-ssr/blob/70ab60b502a685e39e65417a011c134fed1b5bd5/test/disableAutoImporter/vite.config.js#L7
type PluginConfigProvidedByUser = {
  _disableAutoImporter?: boolean
}
// The resolved aggregation of the config set by the user, and all the configs set by libraries (e.g. the config set by Vike and the config set by Telefunc).
type PluginConfigResolved = {
  libraries: {
    libraryName: string
    vitePluginImportBuildVersion?: string // can be undefined when set by an older vite-plugin-import-build version
    getImporterCode: GetImporterCode
  }[]
  filesAlreadyWritten: boolean
  configVersion: number
  disableAutoImporter: boolean
}

type ConfigUnresolved = ConfigVite & {
  vitePluginImportBuild?: PluginConfigProvidedByUser
  _vitePluginImportBuild?: PluginConfigResolved
}
type ConfigResolved = ConfigVite & {
  _vitePluginImportBuild: PluginConfigResolved
}

/**
 * The Vite plugin `importBuild()` does two things:
 *  - Generates an "import build" file at `dist/server/importBuild.cjs`.
 *  - Generates an "auto importer" file at `node_modules/vite-plugin-import-build/dist/autoImporter.js`.
 *
 * See https://github.com/brillout/vite-plugin-import-build#what-it-does for more information.
 */
function importBuild(pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary): Plugin_ {
  let config: ConfigResolved
  let isServerSideBuild = false
  return {
    name: `@brillout/vite-plugin-import-build:${pluginConfigProvidedByLibrary.libraryName}`,
    apply: (_, env) => env.command === 'build',
    configResolved(configUnresolved: ConfigUnresolved) {
      isServerSideBuild = viteIsSSR(configUnresolved)
      if (!isServerSideBuild) return
      config = resolveConfig(configUnresolved, pluginConfigProvidedByLibrary)
    },
    buildStart() {
      if (!isServerSideBuild) return
      assertOnlyNewerVersions(config)
      clearAutoImporterFile({ status: 'RESET' })
    },
    generateBundle(_rollupOptions, rollupBundle) {
      if (!isServerSideBuild) return
      // Let the newest vite-plugin-import-build version generate autoImporter.js
      if (isUsingOlderVitePluginImportBuildVersion(config)) return
      if (config._vitePluginImportBuild.filesAlreadyWritten) return
      config._vitePluginImportBuild.filesAlreadyWritten = true
      // Write dist/server/importBuild.cjs
      writeImportBuildFile(this.emitFile.bind(this), rollupBundle, config)
      // Write node_modules/vite-plugin-import-build/dist/autoImporter.js
      writeAutoImporterFile(config)
    }
  } as Plugin
}

function resolveConfig(
  configUnresolved: ConfigUnresolved,
  pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary
): ConfigResolved {
  assert(viteIsSSR(configUnresolved))
  const pluginConfigProvidedByUser = configUnresolved.vitePluginImportBuild

  const pluginConfigResolved: PluginConfigResolved = configUnresolved._vitePluginImportBuild ?? {
    libraries: [],
    filesAlreadyWritten: false,
    configVersion,
    disableAutoImporter: false
  }
  if (pluginConfigProvidedByLibrary.disableAutoImporter || pluginConfigProvidedByUser?._disableAutoImporter) {
    pluginConfigResolved.disableAutoImporter = true
  }

  assert(configVersion === 1)
  assert(pluginConfigResolved.configVersion === 1)
  if (pluginConfigResolved.configVersion !== configVersion) {
    // We don't use this yet: configVersion never had another value than `1`
    assert(false)
    /*
    const otherLibrary = pluginConfigResolved.libraries[0]
    assert(otherLibrary)
    assert(otherLibrary.libraryName !== pluginConfigProvidedByLibrary.libraryName)
    throw new Error(
      `Conflict between ${pluginConfigProvidedByLibrary.libraryName} and ${otherLibrary.libraryName}. Update both to their latest version and try again.`
    )
    */
  }

  pluginConfigResolved.libraries.push({
    getImporterCode: pluginConfigProvidedByLibrary.getImporterCode,
    libraryName: pluginConfigProvidedByLibrary.libraryName,
    vitePluginImportBuildVersion: projectInfo.projectVersion
  })

  objectAssign(configUnresolved, {
    _vitePluginImportBuild: pluginConfigResolved
  })
  const configResolved: ConfigResolved = configUnresolved
  return configResolved
}

type GetImporterCode = (args: { findBuildEntry: (entryName: string) => string }) => string
function writeImportBuildFile(emitFile: EmitFile, rollupBundle: RollupBundle, config: ConfigResolved) {
  assert(viteIsSSR(config))
  const source = [
    '// File generated by https://github.com/brillout/vite-plugin-import-build',
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
}

function writeAutoImporterFile(config: ConfigResolved) {
  if (autoImporterIsDisabled(config)) {
    debugLogsBuildtime({ disabled: true, paths: null })
    return
  }
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
function clearAutoImporterFile(autoImporter: AutoImporterCleared) {
  try {
    writeFileSync(autoImporterFilePath, [`exports.status = '${autoImporter.status}';`, ''].join('\n'))
  } catch {}
}

function autoImporterIsDisabled(config: ConfigResolved): boolean {
  return config._vitePluginImportBuild.disableAutoImporter ?? isYarnPnP()
}

function isUsingOlderVitePluginImportBuildVersion(config: ConfigResolved): boolean {
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
  semver = semver.split('-')[0] // '0.2.16-commit-89bbe89' => '0.2.16'
  assert(/^[0-9\.]+$/.test(semver))
  const parts = semver.split('.')
  assert(parts.length === 3)
  return parts.map((n) => parseInt(n, 10))
}

function getDistServerPathRelative(config: ConfigVite) {
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
  debugLogsBuildtime({
    disabled: false,
    paths: { importerDir, root, rootRelative, outDir, distServerPathRelative, distServerPathAbsolute }
  })
  return { distServerPathRelative, distServerPathAbsolute }
}

function getImporterDir() {
  const currentDir = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  return path.posix.join(currentDir, '..')
}

function assertOnlyNewerVersions(config: ConfigResolved) {
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
