export { importBuild }
export { findImportBuildBundleEntry }

import type { Plugin, ResolvedConfig as ConfigVite, Rollup } from 'vite'
import {
  isYarnPnP,
  assert,
  assertPosixPath,
  viteIsSSR,
  isAbsolutePath,
  toPosixPath,
  projectInfo,
  objectAssign,
  joinEnglish,
  injectRollupInputs,
  findRollupBundleEntry
} from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from '../shared/importBuildFileName'
import { debugLogsBuildtime } from '../shared/debugLogs'
import type { AutoImporterCleared } from '../loadServerBuild/AutoImporter'
type Bundle = Rollup.OutputBundle
type Options = Rollup.NormalizedOutputOptions

const autoImporterFilePath = require.resolve('../autoImporter')
const inputName = 'importBuild'
const importBuildVirtualId = 'virtual:@brillout/vite-plugin-import-build:importBuild'
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const virtualIdPrefix = '\0'
const configVersion = 2

// Config set by library using @brillout/vite-plugin-import-build (e.g. Vike or Telefunc)
type PluginConfigProvidedByLibrary = {
  getImporterCode: () => string
  libraryName: string
  disableAutoImporter?: boolean
}
// Config set by end user (e.g. Vike or Telefunc user)
type PluginConfigProvidedByUser = {
  // Only used by https://github.com/brillout/vite-plugin-ssr/blob/70ab60b502a685e39e65417a011c134fed1b5bd5/test/disableAutoImporter/vite.config.js#L7
  _testCrawler?: boolean
}
// The resolved aggregation of the config set by the user, and all the configs set by libraries (e.g. the config set by Vike and the config set by Telefunc).
type PluginConfigResolved = {
  libraries: Library[]
  filesAlreadyWritten: boolean
  configVersion: number
  disableAutoImporter: boolean
  testCrawler: boolean
}
type Library = {
  libraryName: string
  configVersion: number
  vitePluginImportBuildVersion: string
  getImporterCode: () => string
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
 *  - Generates an "auto importer" file at `node_modules/@brillout/vite-plugin-import-build/dist/autoImporter.js`.
 *
 * See https://github.com/brillout/vite-plugin-import-build#what-it-does for more information.
 */
function importBuild(pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary): Plugin_ {
  let config: ConfigResolved
  let isServerSideBuild = false
  return {
    name: `@brillout/vite-plugin-import-build:${pluginConfigProvidedByLibrary.libraryName.toLowerCase()}`,
    apply: 'build',
    configResolved(configUnresolved: ConfigUnresolved) {
      isServerSideBuild = viteIsSSR(configUnresolved)
      if (!isServerSideBuild) return
      config = resolveConfig(configUnresolved, pluginConfigProvidedByLibrary)
      config.build.rollupOptions.input = injectRollupInputs({ [inputName]: importBuildVirtualId }, config)
    },
    buildStart() {
      if (!isServerSideBuild) return
      assertConfigVersions(config, pluginConfigProvidedByLibrary.libraryName)
      clearAutoImporterFile({ status: 'RESET' })
    },
    resolveId(id) {
      if (!isServerSideBuild) return
      if (id === importBuildVirtualId) {
        return virtualIdPrefix + importBuildVirtualId
      }
      return null
    },
    load(id) {
      if (!isServerSideBuild) return
      assert(id !== importBuildVirtualId)
      if (id === virtualIdPrefix + importBuildVirtualId) {
        const importBuildFileContent = getImportBuildFileContent(config)
        return importBuildFileContent
      }
    },
    generateBundle(_rollupOptions, bundle) {
      if (!isServerSideBuild) return

      // Let the newest @brillout/vite-plugin-import-build version write files
      if (isUsingOlderVitePluginImportBuildVersion(config)) return
      if (config._vitePluginImportBuild.filesAlreadyWritten) return
      config._vitePluginImportBuild.filesAlreadyWritten = true

      // Write node_modules/@brillout/vite-plugin-import-build/dist/autoImporter.js
      const { testCrawler } = config._vitePluginImportBuild
      const autoImporterDisabled = config._vitePluginImportBuild.disableAutoImporter || isYarnPnP() || testCrawler
      if (!autoImporterDisabled) {
        writeAutoImporterFile(config)
      } else {
        const status = testCrawler ? 'TEST_CRAWLER' : 'DISABLED'
        clearAutoImporterFile({ status })
        debugLogsBuildtime({ disabled: true, paths: null })
      }

      // Write dist/server/importBuild.cjs
      {
        const fileName = 'importBuild.cjs'
        const fileNameActual = findRollupBundleEntry(inputName, bundle).fileName
        if (fileNameActual !== fileName)
          this.emitFile({
            fileName,
            type: 'asset',
            source: `import('./${fileNameActual}')`
          })
      }
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
    disableAutoImporter: false,
    testCrawler: false
  }
  if (pluginConfigProvidedByLibrary.disableAutoImporter) {
    pluginConfigResolved.disableAutoImporter = true
  }
  if (pluginConfigProvidedByUser?._testCrawler) {
    pluginConfigResolved.testCrawler = true
  }

  pluginConfigResolved.libraries.push({
    getImporterCode: pluginConfigProvidedByLibrary.getImporterCode,
    libraryName: pluginConfigProvidedByLibrary.libraryName,
    vitePluginImportBuildVersion: projectInfo.projectVersion,
    configVersion
  })

  objectAssign(configUnresolved, {
    _vitePluginImportBuild: pluginConfigResolved
  })
  const configResolved: ConfigResolved = configUnresolved
  return configResolved
}

function getImportBuildFileContent(config: ConfigResolved) {
  assert(viteIsSSR(config))
  const importBuildFileContent = [
    '// Generated by https://github.com/brillout/vite-plugin-import-build',
    ...config._vitePluginImportBuild.libraries.map((library) => {
      // Should be true becasue of assertConfigVersions()
      assert(getLibraryConfigVersion(library) === configVersion)
      const entryCode = library.getImporterCode()
      return entryCode
    })
  ].join('\n')
  return importBuildFileContent
}

function writeAutoImporterFile(config: ConfigResolved) {
  const { distServerPathRelative, distServerPathAbsolute } = getDistServerPathRelative(config)
  const importBuildFilePathRelative = path.posix.join(distServerPathRelative, importBuildFileName)
  const importBuildFilePathAbsolute = path.posix.join(distServerPathAbsolute, importBuildFileName)
  const { root } = config
  assertPosixPath(root)
  assert(!isYarnPnP())
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
      // Support old version vite-plugin-import-build@0.1.12 which is needed, e.g. if user uses a Telefunc version using 0.1.12 with a vite-plugin-ssr version using 0.2.0
      `exports.load = exports.loadImportBuild;`,
      ''
    ].join('\n')
  )
}
function clearAutoImporterFile(autoImporter: AutoImporterCleared) {
  if (isYarnPnP()) return
  writeFileSync(autoImporterFilePath, [`exports.status = '${autoImporter.status}';`, ''].join('\n'))
}

function isUsingOlderVitePluginImportBuildVersion(config: ConfigResolved): boolean {
  return config._vitePluginImportBuild.libraries.some((library) => {
    // Can be undefined when set by an older @brillout/vite-plugin-import-build version
    if (!library.vitePluginImportBuildVersion) return false
    return isHigherVersion(library.vitePluginImportBuildVersion, projectInfo.projectVersion)
  })
}

function isHigherVersion(semver1: string, semver2: string): boolean {
  const semver1Parts = parseSemver(semver1)
  const semver2Parts = parseSemver(semver2)
  for (let i = 0; i <= semver1Parts.length - 1; i++) {
    if (semver1Parts[i] === semver2Parts[i]) continue
    return semver1Parts[i]! > semver2Parts[i]!
  }
  return false
}

function parseSemver(semver: string): number[] {
  semver = semver.split('-')[0]! // '0.2.16-commit-89bbe89' => '0.2.16'
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

function assertConfigVersions(config: ConfigResolved, currentLibraryName: string) {
  // Let the newest @brillout/vite-plugin-import-build version show the error
  if (isUsingOlderVitePluginImportBuildVersion(config)) return

  const librariesNeedingUpdate: string[] = []

  // Very old versions used to define config.vitePluginDistImporter
  if ('vitePluginDistImporter' in config) {
    const dataOld: any = (config as Record<string, any>).vitePluginDistImporter
    dataOld.libraries.forEach((lib: any) => {
      assert(lib.libraryName)
      librariesNeedingUpdate.push(lib.libraryName)
    })
  }

  const pluginConfigResolved = config._vitePluginImportBuild
  pluginConfigResolved.libraries.forEach((library) => {
    const configVersionLib = getLibraryConfigVersion(library)
    if (configVersionLib < configVersion) {
      librariesNeedingUpdate.push(library.libraryName)
    } else {
      // Should be true because of isUsingOlderVitePluginImportBuildVersion() call above
      assert(configVersionLib === configVersion)
    }
  })

  if (librariesNeedingUpdate.length > 0) {
    const libs = joinEnglish(librariesNeedingUpdate, 'and')
    // We purposely use `throw new Error()` instead of `assertUsage()`, in order to not confuse the user with superfluous information
    throw new Error(
      `Update ${libs} to its latest version and try again: ${currentLibraryName} requires a newer version of ${libs}.`
    )
  }
}

function getLibraryConfigVersion(library: Library) {
  // library.configVersion can be undefined when set by an older @brillout/vite-plugin-import-build version
  const configVersionLib = library.configVersion ?? 1
  return configVersionLib
}

// Avoid multiple Vite versions mismatch
type Plugin_ = any

function findImportBuildBundleEntry(bundle: Bundle /*, options: Options*/): Bundle[string] {
  return findRollupBundleEntry(inputName, bundle)
}
