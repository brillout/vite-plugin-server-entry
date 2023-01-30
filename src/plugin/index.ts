export { importBuild }

import type { Plugin, ResolvedConfig } from 'vite'
import type { EmitFile } from 'rollup'
import { isYarnPnP, assert, assertPosixPath, viteIsSSR, isAbsolutePath, toPosixPath, hasDefinedProp } from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from '../shared/importBuildFileName'
import { findBuildEntry, RollupBundle } from './findBuildEntry'
const autoImporterFilePath = require.resolve('../autoImporter')
const configVersion = 1

type PluginConfig = {
  libraries: Library[]
  importerAlreadyGenerated: boolean
  disableAutoImporter: null | boolean
  configVersion: number
}
type Config = ResolvedConfig & { vitePluginDistImporter: PluginConfig }
type ConfigPristine = ResolvedConfig & { vitePluginDistImporter?: PluginConfig }
type GetImporterCode = (args: { findBuildEntry: (entryName: string) => string }) => string
type Library = {
  libraryName: string
  getImporterCode: GetImporterCode
}

function importBuild(options: {
  getImporterCode: GetImporterCode
  disableAutoImporter?: boolean
  libraryName: string
}): Plugin_ {
  let config: Config
  let isSSR = false
  return {
    name: `@brillout/vite-plugin-import-build:${options.libraryName}`,
    apply: (_config, env) => env.command === 'build',
    configResolved(config_: ConfigPristine) {
      isSSR = viteIsSSR(config_)
      if (!isSSR) return
      config = resolveConfig(config_)
    },
    buildStart() {
      if (!isSSR) return
      resetAutoImporter()
    },
    generateBundle(_rollupOptions, rollupBundle) {
      if (!isSSR) return
      const emitFile = this.emitFile.bind(this)
      generateImporter(emitFile, rollupBundle)
    }
  } as Plugin

  function resolveConfig(config: ConfigPristine): Config {
    assert(viteIsSSR(config))
    config.vitePluginDistImporter = config.vitePluginDistImporter ?? {
      libraries: [],
      importerAlreadyGenerated: false,
      disableAutoImporter: null,
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
      libraryName: options.libraryName
    })

    if (options.disableAutoImporter !== undefined) {
      config.vitePluginDistImporter.disableAutoImporter =
        config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
      assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
    }

    assert(hasDefinedProp(config, 'vitePluginDistImporter'))
    return config
  }

  function generateImporter(emitFile: EmitFile, rollupBundle: RollupBundle) {
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
    const distImporterFile = path.posix.join(getDistPathRelative(config), importBuildFileName)
    const { root } = config
    assertPosixPath(root)
    writeFileSync(
      autoImporterFilePath,
      ["exports.status = 'SET';", `exports.load = () => { require('${distImporterFile}') };`, ''].join('\n')
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

function getDistPathRelative(config: ResolvedConfig) {
  assert(viteIsSSR(config))
  const { root } = config
  assertPosixPath(root)
  const importerDir = getImporterDir()
  const rootRelative = path.posix.relative(importerDir, root) // To `require()` an absolute path doesn't seem to work on Vercel
  let { outDir } = config.build
  assertPosixPath(outDir)
  if (isAbsolutePath(outDir)) {
    outDir = path.posix.relative(root, outDir)
    assert(!isAbsolutePath(outDir))
  }
  const distPathRelative = path.posix.join(rootRelative, outDir)
  // console.log(`root: ${root}, importerDir: ${importerDir}, rootRelative: ${rootRelative}, outDir: ${outDir}, distPathRelative: ${distPathRelative}`)
  return distPathRelative
}

function getImporterDir() {
  const currentDir = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  return path.posix.join(currentDir, '..')
}

type Plugin_ = any
