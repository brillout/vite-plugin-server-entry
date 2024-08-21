export { serverEntryPlugin }
export { findServerEntry }

import type { Plugin, ResolvedConfig as ConfigVite } from 'vite'
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
import type { AutoImporterCleared } from '../importServerEntry/AutoImporter'
import { serverEntryImportPromise } from '../shared/serverEntryImportPromise'
import { serverEntryFileNameBase, serverEntryFileNameBaseAlternative } from '../shared/serverEntryFileNameBase'
import { debugLogsBuildtime } from './debugLogsBuildTime'

const indexEntryName = 'index'
const autoImporterFilePath = require.resolve('../importServerEntry/autoImporter.js')
const serverEntryVirtualId = 'virtual:@brillout/vite-plugin-server-entry:serverEntry'
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const virtualIdPrefix = '\0'
const apiVersion = 4

// Config set by library using @brillout/vite-plugin-server-entry (e.g. Vike or Telefunc)
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
  pluginVersion: string
  getImporterCode: () => string
}

type ConfigUnresolved = ConfigVite & {
  vitePluginServerEntry?: PluginConfigProvidedByUser
  _vitePluginServerEntry?: PluginConfigResolved
}
type ConfigResolved = ConfigVite & {
  _vitePluginServerEntry: PluginConfigResolved
}

/**
 * This plugin does two things:
 *  - Generates a "server entry" file at `dist/server/entry.js`.
 *  - Generates a "auto importer" file at `node_modules/@brillout/vite-plugin-server-entry/dist/importServerEntry/autoImporter.js`.
 *
 * See https://github.com/brillout/vite-plugin-server-entry#what-it-does for more information.
 */
function serverEntryPlugin(pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary): Plugin_[] {
  const pluginName = `@brillout/vite-plugin-server-entry:${pluginConfigProvidedByLibrary.libraryName.toLowerCase()}`
  let config: ConfigResolved
  let serverIndexFilePath: string | null
  let library: Library
  let skip: boolean
  let injectDone = false
  return [
    {
      name: pluginName,
      apply: 'build',
      // We need to run this plugin after other plugin instances, so that assertApiVersions() works also for libraries using older plugin versions
      enforce: 'post',
      configResolved() {
        if (skip) return
        if (!isLeaderPluginInstance(config, library)) {
          skip = true
          return
        }

        assertApiVersions(config, pluginConfigProvidedByLibrary.libraryName)

        if (!config._vitePluginServerEntry.inject) {
          const entries = normalizeRollupInput(config.build.rollupOptions.input)
          assert(
            entries[serverEntryFileNameBase] !== serverEntryVirtualId &&
              entries[serverEntryFileNameBaseAlternative] !== serverEntryVirtualId
          )
          const fileNameBase = !entries[serverEntryFileNameBase]
            ? serverEntryFileNameBase
            : serverEntryFileNameBaseAlternative
          assert(!entries[fileNameBase])
          config.build.rollupOptions.input = injectRollupInputs({ [fileNameBase]: serverEntryVirtualId }, config)
        }
      },
      buildStart() {
        if (skip) return

        serverIndexFilePath = config._vitePluginServerEntry.inject ? getServerIndexFilePath(config) : null
        const isInject = config._vitePluginServerEntry.inject
        if (!isInject) clearAutoImporterFile({ status: 'BUILDING' }, config)
      },
      resolveId(id) {
        if (skip) return

        if (id === serverEntryVirtualId) {
          return virtualIdPrefix + serverEntryVirtualId
        }
      },
      load(id) {
        if (skip) return

        assert(id !== serverEntryVirtualId)
        if (id === virtualIdPrefix + serverEntryVirtualId) {
          const serverEntryFileContent = getServerEntryFileContent(config)
          return serverEntryFileContent
        }
      },
      generateBundle(_rollupOptions, bundle) {
        if (skip) return

        const isInject = config._vitePluginServerEntry.inject
        if (isInject) {
          assert(injectDone)
        }

        const entry = findServerEntry(bundle)

        // Write node_modules/@brillout/vite-plugin-server-entry/dist/autoImporter.js
        const isTestCrawler = config._vitePluginServerEntry.testCrawler
        const doNotAutoImport = isInject || isYarnPnP() || isTestCrawler
        if (!doNotAutoImport) {
          assert(!isInject && entry)
          const entryFileName = entry.fileName
          writeAutoImporterFile(config, entryFileName)
        } else {
          if (!isInject) {
            const status = isTestCrawler ? 'TEST_CRAWLER' : 'DISABLED'
            clearAutoImporterFile({ status }, config)
          }
          debugLogsBuildtime({ disabled: true, paths: null })
        }

        if (!isInject) {
          ;['importBuild.cjs', 'importBuild.mjs', 'importBuild.js'].forEach((fileName) => {
            assert(!isInject && entry)
            const entryFileName = entry.fileName
            this.emitFile({
              fileName,
              type: 'asset',
              source: [
                `globalThis.${serverEntryImportPromise} = import('./${entryFileName}');`,
                `console.warn("[Warning] The server entry has been renamed from dist/server/importBuild.{cjs,mjs,js} to dist/server/entry.{cjs,mjs,js} — update your import('../path/to/dist/server/importBuild.{cjs,mjs,js}') accordingly.");`
              ].join('\n')
            })
          })
        }
      },
      transform(code, id) {
        if (skip) return

        if (!config._vitePluginServerEntry.inject) return
        assert(serverIndexFilePath)
        if (id !== serverIndexFilePath) return
        {
          const moduleInfo = this.getModuleInfo(id)
          assert(moduleInfo?.isEntry)
        }
        injectDone = true
        code = [
          /* We don't do this, instead let Vike's CLI handle the default process.env.NODE_ENV value.
          "process.env.NODE_ENV = 'production';", */
          // Imports the entry of each tool, e.g. the Vike entry and the Telefunc entry.
          `import '${serverEntryVirtualId}';`,
          code
        ].join(
          ''
          /* We don't insert new lines, otherwise we break the source map.
        '\n'
        */
        )
        return code
      }
    },
    {
      name: `${pluginName}:config`,
      apply: 'build',
      // We need to run this plugin before in order to make isLeaderPluginInstance() work
      enforce: 'pre',
      configResolved(configUnresolved: ConfigUnresolved) {
        // Upon the server-side build (`$ vite build --ssr`), we need to override the previous `skip` value set by the client-side build (`$ vite build`).
        skip = !viteIsSSR(configUnresolved)
        if (skip) return
        assertUsage(
          typeof configUnresolved.build.ssr !== 'string',
          "Setting the server build entry over the Vite configuration `build.ssr` (i.e. `--ssr path/to/entry.js`) isn't supported (because of a Vite bug), see workaround at https://github.com/brillout/vite-plugin-server-entry/issues/9#issuecomment-2027641624"
        )
        const resolved = resolveConfig(configUnresolved, pluginConfigProvidedByLibrary)
        config = resolved.config
        library = resolved.library
      }
    }
  ] as Plugin[]
}
// Avoid multiple Vite versions mismatch
type Plugin_ = any

function resolveConfig(
  configUnresolved: ConfigUnresolved,
  pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary
) {
  assert(viteIsSSR(configUnresolved))
  const pluginConfigProvidedByUser = configUnresolved.vitePluginServerEntry

  const pluginConfigResolved: PluginConfigResolved = configUnresolved._vitePluginServerEntry ?? {
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
    pluginVersion: projectInfo.projectVersion,
    apiVersion
  }
  pluginConfigResolved.libraries.push(library)

  objectAssign(configUnresolved, {
    _vitePluginServerEntry: pluginConfigResolved
  })
  const config: ConfigResolved = configUnresolved

  return { config, library }
}

function isLeaderPluginInstance(config: ConfigResolved, library: Library) {
  const { libraries } = config._vitePluginServerEntry
  const pluginVersionCurrent = projectInfo.projectVersion
  assert(libraries.includes(library))
  const isNotUsingNewestPluginVersion = libraries.some((lib) => {
    // Can be undefined when set by an older @brillout/vite-plugin-dist-importer version
    if (!lib.pluginVersion) return false
    return isHigherVersion(lib.pluginVersion, pluginVersionCurrent)
  })
  if (isNotUsingNewestPluginVersion) return false
  const librariesUsingNewestPluginVersion = libraries.filter((lib) => lib.pluginVersion === pluginVersionCurrent)
  return librariesUsingNewestPluginVersion[0] === library
}

function getServerEntryFileContent(config: ConfigResolved) {
  assert(viteIsSSR(config))
  const serverEntryFileContent = [
    '// Generated by https://github.com/brillout/vite-plugin-server-entry',
    ...config._vitePluginServerEntry.libraries.map((library) => {
      // Should be true becasue of assertApiVersions()
      assert(getLibraryApiVersion(library) === apiVersion)
      const entryCode = library.getImporterCode()
      return entryCode
    })
  ].join('\n')
  return serverEntryFileContent
}

function writeAutoImporterFile(config: ConfigResolved, entryFileName: string) {
  const { distServerPathRelative, distServerPathAbsolute } = getDistServerPathRelative(config)
  const serverEntryFilePathRelative = path.posix.join(distServerPathRelative, entryFileName)
  const serverEntryFilePathAbsolute = path.posix.join(distServerPathAbsolute, entryFileName)
  const { root } = config
  assertPosixPath(root)
  assert(!isYarnPnP())
  assertIsNotInject(config)
  writeFileSync(
    autoImporterFilePath,
    [
      "exports.status = 'SET';",
      `exports.loadServerEntry = async () => { await import(${JSON.stringify(serverEntryFilePathRelative)}); };`,
      'exports.paths = {',
      `  autoImporterFilePathOriginal: ${JSON.stringify(autoImporterFilePath)},`,
      '  autoImporterFileDirActual: (() => { try { return __dirname } catch { return null } })(),',
      `  serverEntryFilePathRelative: ${JSON.stringify(serverEntryFilePathRelative)},`,
      `  serverEntryFilePathOriginal: ${JSON.stringify(serverEntryFilePathAbsolute)},`,
      `  serverEntryFilePathResolved: () => require.resolve(${JSON.stringify(serverEntryFilePathRelative)}),`,
      '};',
      ''
    ].join('\n')
  )
}
function clearAutoImporterFile(autoImporter: AutoImporterCleared, config: ConfigResolved) {
  if (isYarnPnP()) return
  assertIsNotInject(config)
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
  const importerDir = getDirname()
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

function getDirname() {
  const dirname = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  return dirname
}

function assertApiVersions(config: ConfigResolved, currentLibraryName: string) {
  const librariesNeedingUpdate: string[] = []

  // Old versions used to define:
  //  - config.vitePluginDistImporter
  //  - config._vitePluginImportBuild
  ;['vitePluginDistImporter', '_vitePluginImportBuild'].forEach((key) => {
    if (key in config) {
      const dataOld: any = (config as Record<string, any>)[key]
      dataOld.libraries.forEach((lib: any) => {
        assert(lib.libraryName)
        librariesNeedingUpdate.push(lib.libraryName)
      })
    }
  })

  const pluginConfigResolved = config._vitePluginServerEntry
  pluginConfigResolved.libraries.forEach((library) => {
    const apiVersionLib = getLibraryApiVersion(library)
    if (apiVersionLib < apiVersion) {
      librariesNeedingUpdate.push(library.libraryName)
    } else {
      // Should be true thanks to isLeaderPluginInstance()
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
  // library.apiVersion can be undefined when set by an older @brillout/vite-plugin-server-entry version
  const apiVersionLib = library.apiVersion ?? 1
  return apiVersionLib
}

function findServerEntry<OutputBundle extends Record<string, { name: string | undefined }>>(
  bundle: OutputBundle
): OutputBundle[string] {
  const entry =
    // prettier-ignore
    findRollupBundleEntry(serverEntryFileNameBaseAlternative, bundle) ||
    findRollupBundleEntry(serverEntryFileNameBase, bundle) ||
    findRollupBundleEntry(indexEntryName, bundle)

  assertUsage(
    entry,
    errMsgEntryRemoved(
      [
        //
        serverEntryFileNameBase,
        serverEntryFileNameBaseAlternative,
        indexEntryName
      ],
      Object.keys(bundle)
    )
  )

  return entry
}

function getServerIndexFilePath(config: ConfigVite): string {
  const entries = normalizeRollupInput(config.build.rollupOptions.input)
  let serverEntryFilePath = entries[indexEntryName]
  if (!serverEntryFilePath) {
    const entryNames = Object.keys(entries)
    assertUsage(false, errMsgEntryRemoved([indexEntryName], entryNames))
  }
  serverEntryFilePath = require.resolve(serverEntryFilePath)
  // Needs to be absolute, otherwise it won't match the `id` in `transform(id)`
  assert(path.isAbsolute(serverEntryFilePath))
  serverEntryFilePath = toPosixPath(serverEntryFilePath)
  return serverEntryFilePath
}

function errMsgEntryRemoved(entriesMissing: string[], entriesExisting: string[]) {
  const list = (items: string[]) => '[' + items.map((e) => `'${e}'`).join(', ') + ']'
  return [
    entriesMissing.length === 1
      ? `Cannot find build server entry '${entriesMissing[0]!}'.`
      : `Cannot find build server entry, searching for:  ${list(entriesMissing)} (none of them exist, but one of these should exist).`,
    `Make sure your Vite config (or that of a Vite plugin) doesn't remove/overwrite server build entries.`,
    `(Found server entries: ${list(entriesExisting)}.)`
  ].join(' ')
}

function assertIsNotInject(config: ConfigResolved) {
  const isInject = config._vitePluginServerEntry.inject
  assert(!isInject)
}
