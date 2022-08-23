export default importBuildPlugin
export { importBuildPlugin }

import type { Plugin, ResolvedConfig } from 'vite'
import type { EmitFile, NormalizedOutputOptions, OutputBundle } from 'rollup'
import { isYarnPnP, assert, assertPosixPath, getImporterDir, isSSR, isAbsolutePath, hasDefinedProp } from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from './importBuildFileName'
const autoImporterFile = require.resolve('./autoImporter')
const configVersion = '0.2' // SemVer major of `npm info vite-plugin-import-build`

type PluginConfig = {
  libraries: Library[]
  importerAlreadyGenerated: boolean
  disableAutoImporter: null | boolean
  configVersion: string
}
type Config = ResolvedConfig & { vitePluginDistImporter: PluginConfig }
type ConfigPristine = ResolvedConfig & { vitePluginDistImporter?: PluginConfig }
type RollupInfo = { options: NormalizedOutputOptions; bundle: OutputBundle }
type GetImporterCode = (args: { rollup: RollupInfo }) => string
type Library = {
  libraryName: string
  getImporterCode: GetImporterCode
}

function importBuildPlugin(options: {
  getImporterCode: GetImporterCode
  disableAutoImporter?: boolean
  libraryName: string
}): Plugin_ {
  let config: Config
  return {
    name: `vite-plugin-import-build:${options.libraryName}`,
    apply: (config, env) => env.command === 'build' && isSSR(config),
    configResolved(config_: ConfigPristine) {
      config = resolveConfig(config_)
    },
    buildStart() {
      resetAutoImporter()
    },
    generateBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      const emitFile = this.emitFile.bind(this)
      const rollup = { options, bundle }
      generateImporter(emitFile, rollup)
    }
  } as Plugin

  function resolveConfig(config: ConfigPristine): Config {
    assert(isSSR(config))
    config.vitePluginDistImporter = config.vitePluginDistImporter ?? {
      importerAlreadyGenerated: false,
      disableAutoImporter: null,
      configVersion,
      libraries: []
    }
    if (config.vitePluginDistImporter.configVersion !== configVersion) {
      const otherLibrary = config.vitePluginDistImporter.libraries[0]
      assert(otherLibrary)
      assert(otherLibrary.libraryName !== options.libraryName)
      throw new Error(`Conflict between ${options.libraryName} and ${otherLibrary.libraryName}`)
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

  function generateImporter(emitFile: EmitFile, rollup: RollupInfo) {
    if (config.vitePluginDistImporter.importerAlreadyGenerated) return
    config.vitePluginDistImporter.importerAlreadyGenerated = true

    const source = config.vitePluginDistImporter.libraries
      .map(({ getImporterCode }) => getImporterCode({ rollup }))
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
    const distImporterFile = path.posix.join(getDistPathRelative(config), 'server', importBuildFileName)
    const { root } = config
    assertPosixPath(root)
    writeFileSync(
      autoImporterFile,
      ["exports.status = 'SET';", `exports.load = () => { require('${distImporterFile}') };`, ''].join('\n')
    )
  }
  function resetAutoImporter() {
    try {
      writeFileSync(autoImporterFile, ["exports.status = 'UNSET';", ''].join('\n'))
    } catch {}
  }

  function autoImporterIsDisabled() {
    const { disableAutoImporter } = config.vitePluginDistImporter
    assert([true, false, null].includes(disableAutoImporter))
    return disableAutoImporter ?? isYarnPnP()
  }
}

function getDistPathRelative(config: ResolvedConfig) {
  assert(isSSR(config))
  const { root } = config
  assertPosixPath(root)
  const rootRelative = path.posix.relative(getImporterDir(), root) // To `require()` an absolute path doesn't seem to work on Vercel
  let outDir = getOutDir(config)
  if (isAbsolutePath(outDir)) {
    outDir = path.posix.relative(root, outDir)
    assert(!isAbsolutePath(outDir))
  }
  const distPathRelative = path.posix.join(rootRelative, outDir)
  return distPathRelative
}

function getOutDir(config: ResolvedConfig) {
  const {
    build: { outDir: outDirServer }
  } = config
  assert(outDirServer.endsWith('/server'))
  assertPosixPath(outDirServer)
  const outDir = path.posix.join(outDirServer, '..')
  return outDir
}

type Plugin_ = any
