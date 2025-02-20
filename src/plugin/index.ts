export { serverProductionEntryPlugin }
export type { ConfigVitePluginServerEntry }

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
  assertUsage,
} from './utils.js'
import path from 'path'
import { writeFileSync, readFileSync } from 'fs'
import type { AutoImporterCleared } from '../runtime/AutoImporter.js'
import {
  serverEntryFileNameBase,
  serverEntryFileNameBaseAlternative,
  serverIndexFileNameBase,
} from '../shared/serverEntryFileNameBase.js'
import { debugLogsBuildtime } from './debugLogsBuildTime.js'
import { sourceMapPassthrough } from '../utils/rollupSourceMap.js'
import { removeFilePrefix } from '../shared/removeFilePrefix.js'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const importMetaUrl: string =
  // @ts-ignore import.meta is shimmed by dist-cjs-fixup.js for CJS build.
  import.meta.url +
  // trick to avoid `@vercel/ncc` to glob import
  (() => '')()
const __dirname_ = path.dirname(fileURLToPath(importMetaUrl))
const isCJS = 'import.meta.resolve' === ('require.resolve' as string) // see dist-cjs-fixup.js
const exportStatement = isCJS ? 'exports.' : 'export const '
const require_ = createRequire(importMetaUrl)

const autoImporterFilePath = removeFilePrefix(
  // @ts-ignore import.meta is shimmed by dist-cjs-fixup.js for CJS build.
  import.meta.resolve('../runtime/autoImporter.js'),
)
console.log('autoImporterFilePath', autoImporterFilePath)
console.log('autoImporterFilePath - require.resolve()', require_.resolve('../runtime/autoImporter.js'))
const serverEntryVirtualId = 'virtual:@brillout/vite-plugin-server-entry:serverEntry'
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const virtualIdPrefix = '\0'
// Using the semver major to determine compatible versions is a much inferior solution. Because, for example, when the user updates Vike > @brillout/vite-plugin-server-entry from version 0.4.8 (`apiVersion===4`) to 0.4.10 (`apiVersion===5`) then things just works because Telefunc > @brillout/vite-plugin-server-entry also updates to `0.4.10`. On the other hand, when the user updates Vike > @brillout/vite-plugin-server-entry to 0.5.0 then this won't update Telefunc > @brillout/vite-plugin-server-entry which is stuck to 0.4.x and the user is forced to update Telefunc.
const apiVersion = 5

// Config set by library using @brillout/vite-plugin-server-entry (e.g. Vike or Telefunc)
type PluginConfigProvidedByLibrary = {
  getServerProductionEntry: () => string
  libraryName: string
  inject?: boolean | string[]
}
// Config set by end user (e.g. Vike or Telefunc user)
type PluginConfigProvidedByUser = {
  autoImport?: boolean
  inject?: boolean | string[]
}
// The resolved aggregation of the config set by the user, and all the configs set by libraries (e.g. the config set by Vike and the config set by Telefunc).
type PluginConfigResolved = {
  libraries: Library[]
  apiVersion: number
  autoImport: boolean
  inject: boolean | string[]
}
type Library = {
  libraryName: string
  apiVersion: number
  pluginVersion: string
  getServerProductionEntry: () => string
}
type ConfigVitePluginServerEntry = {
  vitePluginServerEntry?: PluginConfigProvidedByUser
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
  const pluginName = `@brillout/vite-plugin-server-entry:${pluginConfigProvidedByLibrary.libraryName.toLowerCase()}`
  let config: ConfigResolved
  let injectEntries: string[] | null
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

        applyPluginConfigProvidedByUser(config)

        // We always generate dist/server/entry.mjs even if `inject: true` because it's needed for pre-rendering: the server shouldn't start when pre-rendering starts.
        const serverEntryName = getServerEntryName(config)
        config.build.rollupOptions.input = injectRollupInputs({ [serverEntryName]: serverEntryVirtualId }, config)
      },
      buildStart() {
        if (skip) return

        injectEntries = config._vitePluginServerEntry.inject ? getInjectEntries(config) : null
        clearAutoImporter(config)
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
          const serverProductionEntry = getServerProductionEntryAll(config)
          return serverProductionEntry
        }
      },
      generateBundle(_rollupOptions, bundle) {
        if (skip) return

        const { inject } = config._vitePluginServerEntry
        if (inject) {
          assert(injectDone)
        }

        // Write node_modules/@brillout/vite-plugin-server-entry/dist/autoImporter.js
        if (!isAutoImportDisabled(config)) {
          const entry = findServerEntry(bundle)
          assert(!inject && entry)
          const entryFileName = entry.fileName
          writeAutoImporterFile(config, entryFileName)
        } else {
          debugLogsBuildtime({ disabled: true, paths: null })
        }
      },
      transform(code, id) {
        if (skip) return

        if (!config._vitePluginServerEntry.inject) return
        assert(injectEntries)
        if (!injectEntries.includes(id)) return
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
          code,
        ].join(
          '',
          /* We don't insert new lines, otherwise we break the source map.
        '\n'
        */
        )
        return sourceMapPassthrough(code)
      },
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
          "Setting the server build entry over the Vite configuration `build.ssr` (i.e. `--ssr path/to/entry.js`) isn't supported (because of a Vite bug), see workaround at https://github.com/brillout/vite-plugin-server-entry/issues/9#issuecomment-2027641624",
        )
        const resolved = resolveConfig(configUnresolved, pluginConfigProvidedByLibrary)
        config = resolved.config
        library = resolved.library
      },
    },
  ] as Plugin[]
}
// Avoid multiple Vite versions mismatch
type Plugin_ = any

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

function resolveConfig(
  configUnresolved: ConfigUnresolved,
  pluginConfigProvidedByLibrary: PluginConfigProvidedByLibrary,
) {
  assert(viteIsSSR(configUnresolved))

  const pluginConfigResolved: PluginConfigResolved = configUnresolved._vitePluginServerEntry ?? {
    libraries: [],
    apiVersion,
    autoImport: true,
    inject: false,
  }
  resolveInjectConfig(pluginConfigResolved, pluginConfigProvidedByLibrary.inject)

  const library = {
    getServerProductionEntry: pluginConfigProvidedByLibrary.getServerProductionEntry,
    libraryName: pluginConfigProvidedByLibrary.libraryName,
    pluginVersion: projectInfo.projectVersion,
    apiVersion,
  }
  pluginConfigResolved.libraries.push(library)

  objectAssign(configUnresolved, {
    _vitePluginServerEntry: pluginConfigResolved,
  })
  const config: ConfigResolved = configUnresolved

  return { config, library }
}
function applyPluginConfigProvidedByUser(config: ConfigResolved & ConfigUnresolved) {
  const pluginConfigResolved: PluginConfigResolved = config._vitePluginServerEntry
  const pluginConfigProvidedByUser = config.vitePluginServerEntry ?? {}
  resolveInjectConfig(pluginConfigResolved, pluginConfigProvidedByUser.inject)
  if (pluginConfigProvidedByUser.autoImport !== undefined) {
    pluginConfigResolved.autoImport = pluginConfigProvidedByUser.autoImport
  }
}
function resolveInjectConfig(pluginConfigResolved: PluginConfigResolved, inject?: boolean | string[]) {
  if (!inject) return
  if (inject === true) {
    if (!pluginConfigResolved.inject) {
      pluginConfigResolved.inject = true
    }
    return
  }
  if (!Array.isArray(pluginConfigResolved.inject)) {
    pluginConfigResolved.inject = []
  }
  pluginConfigResolved.inject.push(...inject)
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

function getServerProductionEntryAll(config: ConfigResolved) {
  assert(viteIsSSR(config))
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

function writeAutoImporterFile(config: ConfigResolved, entryFileName: string) {
  const { distServerPathRelative, distServerPathAbsolute } = getDistServerPathRelative(config)
  const serverEntryFilePathRelative = path.posix.join(distServerPathRelative, entryFileName)
  const serverEntryFilePathAbsolute = path.posix.join(distServerPathAbsolute, entryFileName)
  const { root } = config
  assertPosixPath(root)
  assert(!isAutoImportDisabled(config))
  assert(!isYarnPnP())
  writeFileSync(
    autoImporterFilePath,
    [
      `${exportStatement}status = 'SET';`,
      `${exportStatement}loadServerEntry = async () => { await import(${JSON.stringify(serverEntryFilePathRelative)}); };`,
      `${exportStatement}paths = {`,
      `  autoImporterFilePathOriginal: ${JSON.stringify(autoImporterFilePath)},`,
      '  autoImporterFileDirActual: (() => { try { return __dirname } catch { return null } })(),',
      `  serverEntryFilePathRelative: ${JSON.stringify(serverEntryFilePathRelative)},`,
      `  serverEntryFilePathOriginal: ${JSON.stringify(serverEntryFilePathAbsolute)},`,
      `  serverEntryFilePathResolved: () => import.meta.resolve(${JSON.stringify(serverEntryFilePathRelative)}),`,
      '};',
      '',
    ].join('\n'),
  )
}
function clearAutoImporter(config: ConfigResolved) {
  let status: AutoImporterCleared['status']
  if (!isAutoImportDisabled(config)) {
    status = 'BUILDING'
  } else {
    const { inject, autoImport } = config._vitePluginServerEntry
    if (isYarnPnP()) {
      return
    } else if (!autoImport) {
      status = 'DISABLED_BY_USER'
    } else {
      assert(inject)
      status = 'DISABLED_BY_INJECT'
    }
  }
  assert(status)
  const autoImporterContent = readFileSync(autoImporterFilePath)
  if (autoImporterContent.includes(status)) return
  assert(!isYarnPnP())
  writeFileSync(autoImporterFilePath, [`${exportStatement}status = '${status}';`, ''].join('\n'))
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
  const importerDir = __dirname_
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
): OutputBundle[string] {
  const entry =
    findRollupBundleEntry(serverEntryFileNameBaseAlternative, bundle) ||
    findRollupBundleEntry(serverEntryFileNameBase, bundle)

  assertUsage(
    entry,
    errMsgEntryRemoved(
      [
        //
        serverEntryFileNameBase,
        serverEntryFileNameBaseAlternative,
      ],
      Object.keys(bundle),
    ),
  )

  return entry
}

function getInjectEntries(config: ConfigResolved): string[] {
  assert(config._vitePluginServerEntry.inject !== false)
  const entries = normalizeRollupInput(config.build.rollupOptions.input)
  const injectEntryNames =
    config._vitePluginServerEntry.inject === true ? [serverIndexFileNameBase] : config._vitePluginServerEntry.inject
  const injectEntries = injectEntryNames
    .map((entryName) => {
      let entryFilePath = entries[entryName]
      if (!entryFilePath) return null
      console.log('entryFilePath 1', entryFilePath)
      console.log('entryFilePath 2 - require.resolve', require_.resolve(entryFilePath))
      entryFilePath = removeFilePrefix(
        // @ts-ignore import.meta is shimmed by dist-cjs-fixup.js for CJS build.
        import.meta.resolve(entryFilePath),
      )
      console.log('entryFilePath 3', entryFilePath)
      // Needs to be absolute, otherwise it won't match the `id` in `transform(id)`
      assert(path.isAbsolute(entryFilePath))
      entryFilePath = toPosixPath(entryFilePath)
      return entryFilePath
    })
    .filter((e) => e !== null)
  if (injectEntries.length === 0) {
    const entryNames = Object.keys(entries)
    assertUsage(false, errMsgEntryRemoved(injectEntryNames, entryNames))
  }
  return injectEntries
}

function errMsgEntryRemoved(entriesMissing: string[], entriesExisting: string[]) {
  const list = (items: string[]) => '[' + items.map((e) => `'${e}'`).join(', ') + ']'
  return [
    entriesMissing.length === 1
      ? `Cannot find build server entry '${entriesMissing[0]!}'.`
      : `Cannot find build server entry, searching for:  ${list(entriesMissing)} (none of them exist, but one of these should exist).`,
    `Make sure your Vite config (or that of a Vite plugin) doesn't remove/overwrite server build entries.`,
    `(Found server entries: ${list(entriesExisting)}.)`,
  ].join(' ')
}

function isAutoImportDisabled(config: ConfigResolved): boolean {
  const { inject, autoImport } = config._vitePluginServerEntry
  return isYarnPnP() || !!inject || !autoImport
}
