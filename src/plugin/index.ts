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
  normalizeRollupInput,
  findRollupBundleEntry,
  assertUsage
} from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from '../shared/importBuildFileName'
import { debugLogsBuildtime } from '../shared/debugLogs'
import type { AutoImporterCleared } from '../loadServerBuild/AutoImporter'
import { importBuildPromise } from '../loadServerBuild/importBuildPromise'
type Bundle = Rollup.OutputBundle
type Options = Rollup.NormalizedOutputOptions

const autoImporterFilePath = require.resolve('../autoImporter')
const inputName = 'importBuild'
const importBuildVirtualId = 'virtual:@brillout/vite-plugin-import-build:importBuild'
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const virtualIdPrefix = '\0'
const apiVersion = 2

// Config set by library using @brillout/vite-plugin-import-build (e.g. Vike or Telefunc)
type PluginConfigProvidedByLibrary = {
  getImporterCode: () => string
  libraryName: string
  inject?: boolean
}
// Config set by end user (e.g. Vike or Telefunc user)
type PluginConfigProvidedByUser = {
  // Only used by https://github.com/brillout/vite-plugin-ssr/blob/70ab60b502a685e39e65417a011c134fed1b5bd5/test/disableAutoImporter/vite.config.js#L7
  _testCrawler?: boolean
}
// The resolved aggregation of the config set by the user, and all the configs set by libraries (e.g. the config set by Vike and the config set by Telefunc).
type PluginConfigResolved = {
  libraries: Library[]
  apiVersion: number
  testCrawler: boolean
  inject: boolean
}
type Library = {
  libraryName: string
  apiVersion: number
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
  let serverEntryFilePath: string | null
  let library: Library
  let skip: boolean
  let injectDone = false
  return {
    name: `@brillout/vite-plugin-import-build:${pluginConfigProvidedByLibrary.libraryName.toLowerCase()}`,
    apply: 'build',
    configResolved(configUnresolved: ConfigUnresolved) {
      // Upon the server-side build (`$ vite build --ssr`), we need to override the previous `skip` value set by the client-side build (`$ vite build`).
      skip = !viteIsSSR(configUnresolved)
      if (skip) return

      const resolved = resolveConfig(configUnresolved, pluginConfigProvidedByLibrary)
      config = resolved.config
      library = resolved.library
      // We can't use isLeader() for the following but it's fine: running the following multiple times isn't a problem.
      config.build.rollupOptions.input = injectRollupInputs({ [inputName]: importBuildVirtualId }, config)
    },
    buildStart() {
      if (skip) return
      if (!isLeaderPluginInstance(config, library)) {
        skip = true
        return
      }

      serverEntryFilePath = config._vitePluginImportBuild.inject ? getServerEntryFilePath(config) : null
      assertApiVersions(config, pluginConfigProvidedByLibrary.libraryName)
      clearAutoImporterFile({ status: 'RESET' })
    },
    resolveId(id) {
      if (skip) return

      if (id === importBuildVirtualId) {
        return virtualIdPrefix + importBuildVirtualId
      }
    },
    load(id) {
      if (skip) return

      assert(id !== importBuildVirtualId)
      if (id === virtualIdPrefix + importBuildVirtualId) {
        const importBuildFileContent = getImportBuildFileContent(config)
        return importBuildFileContent
      }
    },
    generateBundle(_rollupOptions, bundle) {
      if (skip) return

      if (config._vitePluginImportBuild.inject) {
        assert(injectDone)
      }

      // Write node_modules/@brillout/vite-plugin-import-build/dist/autoImporter.js
      const { testCrawler } = config._vitePluginImportBuild
      const doNotAutoImport = config._vitePluginImportBuild.inject || isYarnPnP() || testCrawler
      if (!doNotAutoImport) {
        writeAutoImporterFile(config)
      } else {
        const status = testCrawler ? 'TEST_CRAWLER' : 'DISABLED'
        clearAutoImporterFile({ status })
        debugLogsBuildtime({ disabled: true, paths: null })
      }

      // Write dist/server/importBuild.cjs (legacy/deprecated entry file name)
      // TODO: add deprecation warning
      {
        const fileName = 'importBuild.cjs'
        const fileNameActual = findRollupBundleEntry(inputName, bundle).fileName
        if (fileNameActual !== fileName)
          this.emitFile({
            fileName,
            type: 'asset',
            source: `globalThis.${importBuildPromise} = import('./${fileNameActual}')`
          })
      }
    },
    transform(code, id) {
      if (skip) return

      if (!config._vitePluginImportBuild.inject) return
      assert(serverEntryFilePath)
      if (id !== serverEntryFilePath) return
      {
        const moduleInfo = this.getModuleInfo(id)
        assert(moduleInfo?.isEntry)
      }
      injectDone = true
      code = [
        // Convenience so that the user doesn't have to set manually set it, while the user can easily override it (this is the very first line of the server code).
        "process.env.NODE_ENV = 'production';",
        // Imports the entry of each tool, e.g. the Vike entry and the Telefunc entry.
        `import '${importBuildVirtualId}';`,
        code
      ].join(
        ''
        /* We don't insert new lines, otherwise we break the source map.
        '\n'
        */
      )
      return code
    }
  } as Plugin
}

function resolveConfig(
  configUnresolved: ConfigUnresolved,
  pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary
) {
  assert(viteIsSSR(configUnresolved))
  const pluginConfigProvidedByUser = configUnresolved.vitePluginImportBuild

  const pluginConfigResolved: PluginConfigResolved = configUnresolved._vitePluginImportBuild ?? {
    libraries: [],
    apiVersion,
    testCrawler: false,
    inject: false
  }
  if (pluginConfigProvidedByLibrary.inject) {
    pluginConfigResolved.inject = true
  }
  if (pluginConfigProvidedByUser?._testCrawler) {
    pluginConfigResolved.testCrawler = true
  }
  // @ts-expect-error workaround for previously broken api version assertion
  pluginConfigResolved.configVersion = 1

  const library = {
    getImporterCode: pluginConfigProvidedByLibrary.getImporterCode,
    libraryName: pluginConfigProvidedByLibrary.libraryName,
    vitePluginImportBuildVersion: projectInfo.projectVersion,
    apiVersion
  }
  pluginConfigResolved.libraries.push(library)

  objectAssign(configUnresolved, {
    _vitePluginImportBuild: pluginConfigResolved
  })
  const config: ConfigResolved = configUnresolved

  return { config, library }
}

function isLeaderPluginInstance(config: ConfigResolved, library: Library) {
  const { libraries } = config._vitePluginImportBuild
  const pluginVersion = projectInfo.projectVersion
  assert(libraries.includes(library))
  const isNotUsingNewestPluginVersion = libraries.some((lib) => {
    // Can be undefined when set by an older @brillout/vite-plugin-import-build version
    if (!lib.vitePluginImportBuildVersion) return false
    return isHigherVersion(lib.vitePluginImportBuildVersion, pluginVersion)
  })
  if (isNotUsingNewestPluginVersion) return false
  const librariesUsingNewestPluginVersion = libraries.filter(
    (lib) => lib.vitePluginImportBuildVersion === pluginVersion
  )
  return librariesUsingNewestPluginVersion[0] === library
}

function getImportBuildFileContent(config: ConfigResolved) {
  assert(viteIsSSR(config))
  const importBuildFileContent = [
    '// Generated by https://github.com/brillout/vite-plugin-import-build',
    ...config._vitePluginImportBuild.libraries.map((library) => {
      // Should be true becasue of assertApiVersions()
      assert(getLibraryApiVersion(library) === apiVersion)
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

/** Is `semver1` higher than `semver2`?*/
function isHigherVersion(semver1: string, semver2: string): boolean {
  const parsed1 = parseSemver(semver1)
  const parsed2 = parseSemver(semver2)
  for (let i = 0; i <= parsed1.parts.length - 1; i++) {
    if (parsed1.parts[i] !== parsed2.parts[i]) {
      return parsed1.parts[i]! > parsed2.parts[i]!
    }
  }
  if (parsed1.isPreRelease !== parsed2.isPreRelease) {
    return parsed1.isPreRelease
  }
  return false
}
function parseSemver(semver: string): { parts: number[]; isPreRelease: boolean } {
  let isPreRelease = false
  if (semver.includes('-')) {
    isPreRelease = true
    semver = semver.split('-')[0]! // '0.2.16-commit-89bbe89' => '0.2.16'
  }
  assert(/^[0-9\.]+$/.test(semver))
  const partsStr = semver.split('.')
  assert(partsStr.length === 3)
  const parts = partsStr.map((n) => parseInt(n, 10))
  return { parts, isPreRelease }
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

function assertApiVersions(config: ConfigResolved, currentLibraryName: string) {
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
    const apiVersionLib = getLibraryApiVersion(library)
    if (apiVersionLib < apiVersion) {
      librariesNeedingUpdate.push(library.libraryName)
    } else {
      // Should be true because of isUsingOlderVitePluginImportBuildVersion() call above
      assert(apiVersionLib === apiVersion)
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

function getLibraryApiVersion(library: Library) {
  // library.apiVersion can be undefined when set by an older @brillout/vite-plugin-import-build version
  const apiVersionLib = library.apiVersion ?? 1
  return apiVersionLib
}

// Avoid multiple Vite versions mismatch
type Plugin_ = any

function findImportBuildBundleEntry(bundle: Bundle /*, options: Options*/): Bundle[string] {
  return findRollupBundleEntry(inputName, bundle)
}

function getServerEntryFilePath(config: ConfigVite): string {
  const entries = normalizeRollupInput(config.build.rollupOptions.input)
  const entryName = 'index'
  let serverEntryFilePath = entries[entryName]
  if (!serverEntryFilePath) {
    const entryNames = Object.keys(entries)
      .map((e) => `'${e}'`)
      .join(', ')
    assertUsage(
      false,
      `Cannot find server build entry '${entryName}'. Make sure your Rollup config doesn't remove the entry '${entryName}' of your server build ${config.build.outDir}. (Found server build entries: [${entryNames}].)`
    )
  }
  serverEntryFilePath = require.resolve(serverEntryFilePath)
  // Needs to be absolute, otherwise it won't match the `id` in `transform(id)`
  assert(path.isAbsolute(serverEntryFilePath))
  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  return serverEntryFilePath
}
