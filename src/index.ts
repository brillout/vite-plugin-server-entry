export default distImporter
export { distImporter }

import type { Plugin, ResolvedConfig } from 'vite'
import type { EmitFile, NormalizedOutputOptions, OutputBundle } from 'rollup'
import { isYarnPnP, assert, assertPosixPath, getImporterDir, isSSR, objectAssign, isAbsolutePath } from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
import { importBuildFileName } from './importBuildFileName'
const autoImporterFile = require.resolve('./autoImporter')

type PluginConfig = {
  alreadyGenerated: boolean
  importGetters: ImportGetter[]
  disableAutoImporter: null | boolean
}
type Config = ResolvedConfig & { vitePluginDistImporter: PluginConfig }
type ConfigPristine = ResolvedConfig & { vitePluginDistImporter?: PluginConfig }
type RollupInfo = { options: NormalizedOutputOptions; bundle: OutputBundle }
type ImportGetter = (args: { rollup: RollupInfo }) => string
type Options = {
  getImporterCode: ImportGetter
  disableAutoImporter?: boolean
  projectName: string
}

function distImporter(options: Options): Plugin_ {
  let config: Config
  return {
    name: `vite-plugin-dist-importer:${options.projectName}`,
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
    objectAssign(config, {
      vitePluginDistImporter: config.vitePluginDistImporter ?? {
        alreadyGenerated: false,
        disableAutoImporter: null,
        importGetters: []
      }
    })
    config.vitePluginDistImporter.importGetters.push(options.getImporterCode)
    if (options.disableAutoImporter !== undefined) {
      config.vitePluginDistImporter.disableAutoImporter =
        config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
      assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
    }
    return config
  }

  function generateImporter(emitFile: EmitFile, rollup: RollupInfo) {
    if (config.vitePluginDistImporter.alreadyGenerated) return
    config.vitePluginDistImporter.alreadyGenerated = true

    const source = config.vitePluginDistImporter.importGetters
      .map((getImporterCode) => getImporterCode({ rollup }))
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
