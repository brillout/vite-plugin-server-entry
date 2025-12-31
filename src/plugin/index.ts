export { serverProductionEntryPlugin }
export { serverEntryVirtualId }
export type { PluginConfigProvidedByUser as VitePluginServerEntryOptions }

import type { Plugin, ResolvedConfig as ConfigVite, Environment } from 'vite'
import {
  isYarnPnP,
  assert,
  assertPosixPath,
  isViteServerSide,
  isAbsolutePath,
  toPosixPath,
  projectInfo,
  objectAssign,
  joinEnglish,
  findRollupBundleEntry,
  assertUsage,
  isNotNullish,
  injectRollupInputs,
  normalizeRollupInput,
  deepEqual,
  escapeRegex,
} from './utils.js'
import path from 'path'
import { writeFileSync, readFileSync } from 'fs'
import type { AutoImporterCleared } from '../runtime/AutoImporter.js'
import { serverEntryFileNameBase, serverEntryFileNameBaseAlternative } from '../shared/serverEntryFileNameBase.js'
import { debugLogsBuildtime } from './debugLogsBuildTime.js'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const importMetaUrl: string =
  // @ts-ignore import.meta is shimmed at dist/cjs by dist-cjs-fixup.js
  import.meta.url +
  // trick to avoid `@vercel/ncc` to glob import
  (() => '')()
const __dirname_ = toPosixPath(path.dirname(fileURLToPath(importMetaUrl)))
const isCJSEnv = 'import.meta.resolve' === ('require.resolve' as string) // see dist-cjs-fixup.js
const require_ = createRequire(importMetaUrl)

const autoImporterFilePath = toPosixPath(require_.resolve('../runtime/autoImporter.js'))
const serverEntryVirtualId = 'virtual:@brillout/vite-plugin-server-entry:serverEntry'
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const virtualIdPrefix = '\0'
// Using the semver major to determine compatible versions is a much inferior solution. Because, for example, when the user updates Vike > @brillout/vite-plugin-server-entry from version 0.4.8 (`apiVersion===4`) to 0.4.10 (`apiVersion===5`) then things just works because Telefunc > @brillout/vite-plugin-server-entry also updates to `0.4.10`. On the other hand, when the user updates Vike > @brillout/vite-plugin-server-entry to 0.5.0 then this won't update Telefunc > @brillout/vite-plugin-server-entry which is stuck to 0.4.x and the user is forced to update Telefunc.
const apiVersion = 5

// Config set by library using @brillout/vite-plugin-server-entry (e.g. Vike or Telefunc)
type PluginConfigProvidedByLibrary = {
  getServerProductionEntry: () => string
  libraryName: string
}
// Config set by:
// - vike-server
// - End user (although to my knowledge no user is using this)
type PluginConfigProvidedByUser = {
  inject?: boolean // No functionality whatsoever: only used to communicate between Vike and vike-server.
  disableAutoImport?: boolean
  disableServerEntryEmit?: boolean
}
// The resolved aggregation of the config set by the user, and all the configs set by libraries (e.g. the config set by Vike and the config set by Telefunc).
type PluginConfigResolved = {
  libraries: Library[]
  apiVersion: number
  inject: boolean
  disableAutoImport: boolean
  disableServerEntryEmit: boolean
}
type Library = {
  libraryName: string
  apiVersion: number
  pluginVersion: string
  getServerProductionEntry: () => string
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
 *  - Generates a "auto importer" file at `node_modules/@brillout/vite-plugin-server-entry/dist/runtime/autoImporter.js`.
 *
 * See https://github.com/brillout/vite-plugin-server-entry#what-it-does for more information.
 */
function serverProductionEntryPlugin(pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary): Plugin_[] {
  const pluginName =
    `@brillout/vite-plugin-server-entry:${pluginConfigProvidedByLibrary.libraryName.toLowerCase()}` as const
  let config: ConfigResolved
  const { libraryName } = pluginConfigProvidedByLibrary
  assert(libraryName)
  let isNotLeaderInstance: boolean | undefined
  let librariesLength: undefined | number
  const skip = (viteEnv: Environment | undefined) => {
    assert('boolean' === typeof isNotLeaderInstance)
    const isServerSide = isViteServerSide(config, viteEnv)
    return isNotLeaderInstance || !isServerSide
  }
  return [
    {
      name: `${pluginName}:config:pre`,
      apply: 'build',
      // We must run the pre-hook configResolved() of *all* libraries before any post-hook configResolved() hook is called (otherwise isLeaderPluginInstance() will miss libraries and won't work)
      enforce: 'pre',
      configResolved: {
        order: 'pre',
        handler(configUnresolved: ConfigUnresolved) {
          config = resolveConfig(configUnresolved, libraryName, pluginConfigProvidedByLibrary)
          assert(config._vitePluginServerEntry.libraries.find((l) => l.libraryName === libraryName))
        },
      },
    },
    {
      name: `${pluginName}:config:post`,
      apply: 'build',
      // We need to run this plugin after other plugin instances, so that assertApiVersions() works also for libraries using older plugin versions
      enforce: 'post',
      configResolved: {
        order: 'post',
        handler() {
          assertUsage(
            typeof config.build.ssr !== 'string',
            "Setting the server build entry over the Vite configuration `build.ssr` (i.e. `--ssr path/to/entry.js`) isn't supported (because of a Vite bug), see workaround at https://github.com/brillout/vite-plugin-server-entry/issues/9#issuecomment-2027641624",
          )
          {
            const prev = librariesLength
            librariesLength = config._vitePluginServerEntry.libraries.length
            assert([undefined, librariesLength].includes(prev))
          }
          {
            const prev = isNotLeaderInstance
            isNotLeaderInstance = !isLeaderPluginInstance(config, libraryName)
            assert([undefined, isNotLeaderInstance].includes(prev))
          }
          if (skip(undefined)) return

          assertApiVersions(config, pluginConfigProvidedByLibrary.libraryName)

          applyPluginConfigProvidedByUser(config)

          if (!config._vitePluginServerEntry.disableServerEntryEmit) {
            const serverEntryName = getServerEntryName(config)
            config.build.rollupOptions.input = injectRollupInputs({ [serverEntryName]: serverEntryVirtualId }, config)
          }
        },
      },
    },
    {
      name: `${pluginName}:hooks`,
      apply: 'build',
      buildStart: {
        handler() {
          if (skip(this.environment)) return

          clearAutoImporter(config)
        },
      },
      resolveId: {
        filter: {
          id: new RegExp(`^${escapeRegex(serverEntryVirtualId)}$`),
        },
        handler(id) {
          if (skip(this.environment)) return

          if (id === serverEntryVirtualId) {
            return virtualIdPrefix + serverEntryVirtualId
          }
        },
      },
      load: {
        filter: {
          id: new RegExp(`^${escapeRegex(virtualIdPrefix + serverEntryVirtualId)}$`),
        },
        handler(id) {
          if (skip(this.environment)) return

          assert(id !== serverEntryVirtualId)
          if (id === virtualIdPrefix + serverEntryVirtualId) {
            const serverProductionEntry = getServerProductionEntryAll(config, this.environment)
            return serverProductionEntry
          }
        },
      },
      generateBundle: {
        handler(_rollupOptions, bundle) {
          if (skip(this.environment)) return
          if (this.environment && this.environment.name !== 'ssr') return

          // Write node_modules/@brillout/vite-plugin-server-entry/dist/autoImporter.js
          if (!isAutoImportDisabled(config)) {
            const entry = findServerEntry(bundle, getOutDir(config, this.environment))
            assert(entry)
            const entryFileName = entry.fileName
            if (!entryFileName) assert(false, { entry })
            setAutoImporter(config, this.environment, entryFileName)
          } else {
            debugLogsBuildtime({ disabled: true, paths: null })
          }
        },
      },
    },
  ] as Plugin[]
}
// Avoid multiple Vite versions mismatch
type Plugin_ = any

function resolveConfig(
  configUnresolved: ConfigUnresolved,
  libraryName: string,
  pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary,
) {
  assert(pluginConfigProvidedByLibrary.libraryName === libraryName)

  const pluginConfigResolved: PluginConfigResolved = configUnresolved._vitePluginServerEntry ?? {
    libraries: [],
    apiVersion,
    inject: false,
    disableAutoImport: false,
    disableServerEntryEmit: false,
  }
  objectAssign(configUnresolved, {
    _vitePluginServerEntry: pluginConfigResolved,
  })

  const libraryNew = {
    getServerProductionEntry: pluginConfigProvidedByLibrary.getServerProductionEntry,
    libraryName,
    pluginVersion: projectInfo.projectVersion,
    apiVersion,
  }
  const libraryFound = pluginConfigResolved.libraries.find((l) => l.libraryName === libraryName)
  if (!libraryFound) {
    pluginConfigResolved.libraries.push(libraryNew)
  } else {
    assert(deepEqual(libraryNew, libraryFound))
  }

  const config: ConfigResolved = configUnresolved

  return config
}
function applyPluginConfigProvidedByUser(config: ConfigResolved & ConfigUnresolved) {
  const pluginConfigResolved: PluginConfigResolved = config._vitePluginServerEntry
  const pluginConfigProvidedByUser = config.vitePluginServerEntry ?? {}
  if (pluginConfigProvidedByUser.inject !== undefined) {
    pluginConfigResolved.inject = pluginConfigProvidedByUser.inject
  }
  if (pluginConfigProvidedByUser.disableAutoImport !== undefined) {
    pluginConfigResolved.disableAutoImport = pluginConfigProvidedByUser.disableAutoImport
  }
  if (pluginConfigProvidedByUser.disableServerEntryEmit !== undefined) {
    pluginConfigResolved.disableServerEntryEmit = pluginConfigProvidedByUser.disableServerEntryEmit
  }
}

function isLeaderPluginInstance(config: ConfigResolved, libraryName: string) {
  const { libraries } = config._vitePluginServerEntry
  const pluginVersionCurrent = projectInfo.projectVersion
  const library = libraries.find((l) => l.libraryName === libraryName)
  assert(library)
  const isNotUsingNewestPluginVersion = libraries.some((lib) => {
    // Can be undefined when set by an older @brillout/vite-plugin-dist-importer version
    if (!lib.pluginVersion) return false
    return isHigherVersion(lib.pluginVersion, pluginVersionCurrent)
  })
  if (isNotUsingNewestPluginVersion) return false
  const librariesUsingNewestPluginVersion = libraries.filter((lib) => lib.pluginVersion === pluginVersionCurrent)
  return librariesUsingNewestPluginVersion[0] === library
}

function getServerProductionEntryAll(config: ConfigResolved, viteEnv: Environment) {
  assert(isViteServerSide(config, viteEnv))
  const serverProductionEntry = [
    '// Generated by https://github.com/brillout/vite-plugin-server-entry',
    ...config._vitePluginServerEntry.libraries.map((library) => {
      // Should be true because of assertApiVersions()
      assert(getLibraryApiVersion(library) === apiVersion)
      const entryCode = (
        library.getServerProductionEntry ??
        // Support old `getServerProductionEntry()` name: it was previously called `getImporterCode()`.
        // TODO/api-version-bump: We'll be able to remove this next time we bump `apiVersion`.
        // @ts-expect-error
        library.getImporterCode
      )()
      return entryCode
    }),
  ].join('\n')
  return serverProductionEntry
}

function setAutoImporter(config: ConfigResolved, viteEnv: Environment, entryFileName: string) {
  const { distServerPathRelative, distServerPathAbsolute } = getDistServerPathRelative(config, viteEnv)
  const serverEntryFilePathRelative = path.posix.join(distServerPathRelative, entryFileName)
  const serverEntryFilePathAbsolute = path.posix.join(distServerPathAbsolute, entryFileName)
  const { root } = config
  assertPosixPath(root)
  assert(!isAutoImportDisabled(config))
  assert(!isYarnPnP())
  writeAutoImporterFile(({ autoImporterFilePathResolved, exportStatement, isCJS }) =>
    [
      `${exportStatement}status = 'SET';`,
      `${exportStatement}pluginVersion = ${JSON.stringify(projectInfo.projectVersion)};`,
      `${exportStatement}loadServerEntry = async () => { await import(${JSON.stringify(serverEntryFilePathRelative)}); };`,
      `${exportStatement}paths = {`,
      `  autoImporterFilePathOriginal: ${JSON.stringify(autoImporterFilePathResolved)},`,
      `  autoImporterFilePathActual: (() => { try { return ${isCJS ? '__filename' : 'import.meta.url'} } catch { return null } })(),`,
      `  serverEntryFilePathRelative: ${JSON.stringify(serverEntryFilePathRelative)},`,
      `  serverEntryFilePathOriginal: ${JSON.stringify(serverEntryFilePathAbsolute)},`,
      `  serverEntryFilePathResolved: () => ${isCJS ? 'require' : 'import.meta'}.resolve(${JSON.stringify(serverEntryFilePathRelative)}),`,
      '};',
      '',
    ].join('\n'),
  )
}
function clearAutoImporter(config: ConfigResolved) {
  if (isYarnPnP()) return
  const status: AutoImporterCleared['status'] = isAutoImportDisabled(config) ? 'DISABLED' : 'BUILDING'
  writeAutoImporterFile(({ exportStatement }) => [`${exportStatement}status = '${status}';`, ''].join('\n'))
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

function getOutDir(config: ConfigVite, viteEnv: Environment | undefined): string {
  const outDir = !viteEnv
    ? // Vite 5
      config.build.outDir
    : // Vite 6 or above
      viteEnv.config.build.outDir
  assert(outDir)
  return outDir
}
function getDistServerPathRelative(config: ConfigVite, viteEnv: Environment | undefined) {
  assert(isViteServerSide(config, viteEnv))
  const { root } = config
  const importerDir = __dirname_
  assertPosixPath(importerDir)
  assert(isAbsolutePath(importerDir))
  assertPosixPath(root)
  assert(isAbsolutePath(root))
  const rootRelative = path.posix.relative(importerDir, root) // To `require()` an absolute path doesn't seem to work on Vercel
  let outDir = getOutDir(config, viteEnv)
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
    paths: { importerDir, root, rootRelative, outDir, distServerPathRelative, distServerPathAbsolute },
  })
  return { distServerPathRelative, distServerPathAbsolute }
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
      `Update ${libs} to its latest version and try again: ${currentLibraryName} requires a newer version of ${libs}.`,
    )
  }
}

function getLibraryApiVersion(library: Library) {
  // library.apiVersion can be undefined when set by an older @brillout/vite-plugin-server-entry version
  const apiVersionLib = library.apiVersion ?? 1
  return apiVersionLib
}

function findServerEntry<OutputBundle extends Record<string, { name: string | undefined }>>(
  bundle: OutputBundle,
  outDir: string,
): OutputBundle[string] {
  const entry =
    findRollupBundleEntry(serverEntryFileNameBaseAlternative, bundle, outDir) ||
    findRollupBundleEntry(serverEntryFileNameBase, bundle, outDir)

  assertUsage(
    entry,
    errMsgEntryRemoved(
      [
        //
        serverEntryFileNameBase,
        serverEntryFileNameBaseAlternative,
      ],
      Object.keys(bundle),
      Object.values(bundle)
        .map((entry) => entry.name)
        .filter(isNotNullish),
    ),
  )

  return entry
}

function errMsgEntryRemoved(entriesMissing: string[], entryKeys: string[], entryNames: string[]) {
  const list = (items: string[]) => '[' + items.map((e) => `'${e}'`).join(', ') + ']'
  return [
    entriesMissing.length === 1
      ? `Cannot find build server entry '${entriesMissing[0]!}'.`
      : `Cannot find build server entry, searching for:  ${list(entriesMissing)} (none of them exist, but one of these should exist).`,
    `Make sure your Vite config (or that of a Vite plugin) doesn't remove/overwrite server build entries.`,
    `(Found entry names: ${list(entryNames)}, found entry keys: ${list(entryKeys)}.)`,
  ].join(' ')
}

function isAutoImportDisabled(config: ConfigResolved): boolean {
  const { disableAutoImport } = config._vitePluginServerEntry
  return isYarnPnP() || disableAutoImport
}

function getServerEntryName(config: ConfigResolved) {
  const entries = normalizeRollupInput(config.build.rollupOptions.input)
  assert(
    entries[serverEntryFileNameBase] !== serverEntryVirtualId &&
      entries[serverEntryFileNameBaseAlternative] !== serverEntryVirtualId,
  )
  const serverEntryName = !entries[serverEntryFileNameBase]
    ? serverEntryFileNameBase
    : serverEntryFileNameBaseAlternative
  assert(!entries[serverEntryName])
  return serverEntryName
}

function writeAutoImporterFile(
  getFileContent: (args: { autoImporterFilePathResolved: string; exportStatement: string; isCJS: boolean }) => string,
) {
  {
    const { isCJS } = analyzeDistPath(autoImporterFilePath)
    assert(isCJS === isCJSEnv)
  }

  const autoImporterFilePathEsm = autoImporterFilePath.replace('/dist/cjs/', '/dist/esm/')
  const autoImporterFilePathCjs = autoImporterFilePath.replace('/dist/esm/', '/dist/cjs/')
  ;[autoImporterFilePathEsm, autoImporterFilePathCjs].forEach((autoImporterFilePathResolved) => {
    const { exportStatement, isCJS } = analyzeDistPath(autoImporterFilePathResolved)
    const fileContentNew = getFileContent({ autoImporterFilePathResolved, exportStatement, isCJS })
    const fileContentOld = readFileSync(autoImporterFilePathResolved, 'utf8')
    // Write to filesystem only if required
    // https://github.com/vikejs/vike/issues/3006
    if (fileContentNew.trim() !== fileContentOld.trim()) {
      writeFileSync(autoImporterFilePathResolved, fileContentNew)
    }
  })
}

function analyzeDistPath(autoImporterFilePath: string) {
  assertPosixPath(autoImporterFilePath)

  const isCJS = autoImporterFilePath.includes('/dist/cjs/')
  const isESM = autoImporterFilePath.includes('/dist/esm/')
  if (isCJS) assert(autoImporterFilePath.split('/dist/cjs/').length === 2)
  if (isESM) assert(autoImporterFilePath.split('/dist/esm/').length === 2)
  assert(isCJS || isESM)
  assert(!(isCJS && isESM))

  const exportStatement = isCJS ? 'exports.' : 'export const '
  return { isCJS, exportStatement }
}
