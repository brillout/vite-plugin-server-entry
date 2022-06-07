export default distImporter
export { distImporter }

import type { Plugin, ResolvedConfig } from 'vite'
import type { NormalizedOutputOptions, OutputBundle } from 'rollup'
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
type ConfigInit = ResolvedConfig & { vitePluginDistImporter?: PluginConfig }
type ImportGetter = (args: { rollup: { options: NormalizedOutputOptions; bundle: OutputBundle } }) => string
type Options = {
  getImporterCode: ImportGetter
  disableAutoImporter?: boolean
  projectName: string
}

function distImporter(options: Options): Plugin_ {
  let config: Config
  let isForServerSide: boolean
  return {
    name: `vite-plugin-dist-importer:${options.projectName}`,
    apply: 'build',
    configResolved(config_: ConfigInit) {
      isForServerSide = isSSR(config_)
      if (!isForServerSide) return
      objectAssign(config_, {
        vitePluginDistImporter: config_.vitePluginDistImporter ?? {
          alreadyGenerated: false,
          disableAutoImporter: null,
          importGetters: []
        }
      })
      config = config_
      config.vitePluginDistImporter.importGetters.push(options.getImporterCode)
      if (options.disableAutoImporter !== undefined) {
        config.vitePluginDistImporter.disableAutoImporter =
          config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
        assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
      }
    },
    buildStart() {
      assert([true, false].includes(isForServerSide === true))
      if (!isForServerSide) return
      resetAutoImporter()
    },
    generateBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      assert([true, false].includes(isForServerSide))
      if (!isForServerSide) return
      if (config.vitePluginDistImporter.alreadyGenerated) return
      config.vitePluginDistImporter.alreadyGenerated = true

      const source = config.vitePluginDistImporter.importGetters
        .map((getImporterCode) => getImporterCode({ rollup: { options, bundle } }))
        .join('\n')

      this.emitFile({
        fileName: importBuildFileName,
        type: 'asset',
        source
      })

      setAutoImporter()
    }
  } as Plugin

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
