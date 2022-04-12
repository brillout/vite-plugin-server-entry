export default distImporter
export { distImporter }

import type { Plugin, ResolvedConfig } from 'vite'
import { isYarnPnP, assert, assertPosixPath, getImporterDir, isSSR, objectAssign } from './utils'
import path from 'path'
import { writeFileSync } from 'fs'
const autoImporterFile = require.resolve('./autoImporter')

type PluginConfig = { alreadyGenerated: boolean; importerCodes: string[]; disableAutoImporter: null | boolean }
type Config = ResolvedConfig & { vitePluginDistImporter: PluginConfig }
type ConfigInit = ResolvedConfig & { vitePluginDistImporter?: PluginConfig }

function distImporter(options: {
  importerCode: string
  disableAutoImporter?: boolean
  projectName: string
}): PluginInterop {
  let config: Config
  return {
    name: `vite-plugin-dist-importer:${options.projectName}`,
    apply: (config, options) => {
      if (!isSSR(config)) {
        return false
      }
      return options.command === 'build'
    },
    configResolved(config_: ConfigInit) {
      assert(isSSR(config_))
      objectAssign(config_, {
        vitePluginDistImporter: config_.vitePluginDistImporter ?? {
          alreadyGenerated: false,
          disableAutoImporter: null,
          importerCodes: []
        }
      })
      config = config_
      config.vitePluginDistImporter.importerCodes.push(options.importerCode)
      if (options.disableAutoImporter !== undefined) {
        config.vitePluginDistImporter.disableAutoImporter =
          config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
        assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
      }
    },
    buildStart() {
      if (isDisabled()) return
      resetAutoImporter()
    },
    generateBundle() {
      if (isDisabled()) return
      if (config.vitePluginDistImporter.alreadyGenerated) return
      config.vitePluginDistImporter.alreadyGenerated = true

      const source = config.vitePluginDistImporter.importerCodes.join('\n')

      const fileName = 'importDist.cjs'
      this.emitFile({
        fileName,
        type: 'asset',
        source
      })

      const distImporterFile = path.posix.join(getDistPath(config), 'server', fileName)

      const { root } = config
      assertPosixPath(root)
      writeFileSync(
        autoImporterFile,
        [
          "exports.status = 'SET';",
          `exports.importerDir = '${getImporterDir()}';`,
          `exports.root = '${root}';`,
          `exports.outDir = '${getOutDir(config)}';`,
          `exports.load = () => { require('${distImporterFile}') };`,
          ''
        ].join('\n')
      )
    }
  } as Plugin

  function isDisabled() {
    const { disableAutoImporter } = config.vitePluginDistImporter
    assert([true, false, null].includes(disableAutoImporter))
    return disableAutoImporter ?? isYarnPnP()
  }
}

function resetAutoImporter() {
  writeFileSync(
    autoImporterFile,
    ['// I will be overwritten momentarily.', "exports.status = 'RESETING';", ''].join('\n')
  )
}

function getDistPath(config: ResolvedConfig) {
  assert(isSSR(config))
  const { root } = config
  assertPosixPath(root)
  const rootRelative = path.posix.relative(getImporterDir(), root) // To `require()` an absolute path doesn't seem to work on Vercel
  const distPath = path.posix.join(rootRelative, getOutDir(config))
  return distPath
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

// Return type `any` to avoid Plugin type mismatches when there are multiple Vite versions installed
type PluginInterop = any
