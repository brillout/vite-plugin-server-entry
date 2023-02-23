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
  hasDefinedProp,
  projectInfo
} from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from '../shared/importBuildFileName'
import { findBuildEntry, RollupBundle } from './findBuildEntry'
import { debugLogs2 } from '../shared/debugLogs'
const autoImporterFilePath = require.resolve('../autoImporter')
// TODO: rename config.vitePluginDistImporter => config.vitePluginImportBuild upon next configVersion
const configVersion = 1

type PluginConfig = {
  libraries: Library[]
  importerAlreadyGenerated: boolean
  disableAutoImporter: null | boolean
  configVersion: number
}
// We can't rename config.vitePluginDistImporter without updating configVersion
type Config = ResolvedConfig & { vitePluginDistImporter: PluginConfig }
type ConfigPristine = ResolvedConfig & {
  vitePluginDistImporter?: PluginConfig
  vitePluginImportBuild?: {
    // Only for https://github.com/brillout/vite-plugin-ssr/tree/main/test/disableAutoImporter
    _disableAutoImporter: boolean
  }
}
type GetImporterCode = (args: { findBuildEntry: (entryName: string) => string }) => string
type Library = {
  libraryName: string
  vitePluginImportBuildVersion?: string // can be undefined when set by an older vite-plugin-import-build version
  getImporterCode: GetImporterCode
}

function importBuild(options: {
  getImporterCode: GetImporterCode
  disableAutoImporter?: boolean
  libraryName: string
}): Plugin_ {
  let config: Config
  let isServerSide = false
  return {
    name: `@brillout/vite-plugin-import-build:${options.libraryName}`,
    apply: (_config, env) => env.command === 'build',
    configResolved(config_: ConfigPristine) {
      isServerSide = viteIsSSR(config_)
      if (!isServerSide) return
      config = resolveConfig(config_)
    },
    buildStart() {
      if (!isServerSide) return
      resetAutoImporter()
    },
    async generateBundle(_rollupOptions, rollupBundle) {
      if (!isServerSide) return
      const emitFile = this.emitFile.bind(this)
      await generateImporter(emitFile, rollupBundle)
    }
  } as Plugin

  function resolveConfig(config: ConfigPristine): Config {
    assert(viteIsSSR(config))
    config.vitePluginDistImporter = config.vitePluginDistImporter ?? {
      libraries: [],
      importerAlreadyGenerated: false,
      disableAutoImporter: config.vitePluginImportBuild?._disableAutoImporter ?? null,
      configVersion
    }

    if (config.vitePluginDistImporter.configVersion !== configVersion) {
      const otherLibrary = config.vitePluginDistImporter.libraries[0]
      assert(otherLibrary)
      assert(otherLibrary.libraryName !== options.libraryName)
      throw new Error(
        `Conflict between ${options.libraryName} and ${otherLibrary.libraryName}. Updating both to their latest version will likely solve the problem.`
      )
    }

    config.vitePluginDistImporter.libraries.push({
      getImporterCode: options.getImporterCode,
      libraryName: options.libraryName,
      vitePluginImportBuildVersion: projectInfo.projectVersion
    })

    if (options.disableAutoImporter !== undefined) {
      config.vitePluginDistImporter.disableAutoImporter =
        config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
      assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
    }

    assert(hasDefinedProp(config, 'vitePluginDistImporter'))
    return config
  }

  async function generateImporter(emitFile: EmitFile, rollupBundle: RollupBundle) {
    // Let the newest vite-plugin-import-build version generate autoImporter.js
    if (isUsingOlderVitePluginImportBuildVersion(config)) return
    if (config.vitePluginDistImporter.importerAlreadyGenerated) return
    config.vitePluginDistImporter.importerAlreadyGenerated = true

    assert(viteIsSSR(config)) // rollupBundle should be the server-side one
    const source = config.vitePluginDistImporter.libraries
      .map(({ getImporterCode }) =>
        getImporterCode({
          findBuildEntry: (entryName: string) => findBuildEntry(entryName, rollupBundle)
        })
      )
      .join('\n')

    emitFile({
      fileName: importBuildFileName,
      type: 'asset',
      source
    })

    setAutoImporter()
  }

  function setAutoImporter() {
    if (autoImporterIsDisabled()) return
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
        '  autoImporterFileDirActual: __dirname,',
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

  function autoImporterIsDisabled() {
    const { disableAutoImporter } = config.vitePluginDistImporter
    assert([true, false, null].includes(disableAutoImporter))
    return disableAutoImporter ?? isYarnPnP()
  }
}

function isUsingOlderVitePluginImportBuildVersion(config: Config): boolean {
  return config.vitePluginDistImporter.libraries.some((library) => {
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
  debugLogs2({ importerDir, root, rootRelative, outDir, distServerPathRelative, distServerPathAbsolute })
  return { distServerPathRelative, distServerPathAbsolute }
}

function getImporterDir() {
  const currentDir = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  return path.posix.join(currentDir, '..')
}

type Plugin_ = any
