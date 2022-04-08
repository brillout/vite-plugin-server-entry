export default distImporter
export { distImporter }

import type { Plugin, ResolvedConfig } from 'vite'
import { /*applyDev, isRunningWithYarnPnp,*/ assert, assertPosixPath, getSrcDir, isSSR, objectAssign } from './utils'
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
      /*
        if (options.disableAutoImporter !== undefined) {
          config.vitePluginDistImporter.disableAutoImporter =
            config.vitePluginDistImporter.disableAutoImporter || options.disableAutoImporter
          assert([true, false].includes(config.vitePluginDistImporter.disableAutoImporter))
        }
        */
      resetAutoImporter()
    },
    generateBundle() {
      assert(isSSR(config))
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

      assert(config.root)
      writeFileSync(
        autoImporterFile,
        [
          "exports.status = 'SET';",
          `exports.dirname = '${getSrcDir()}';`,
          `exports.root = '${config.root}';`,
          `exports.outDir = '${getOutDir(config)}';`,
          `exports.load = () => { require('${distImporterFile}') };`,
          ''
        ].join('\n')
      )
      /*
      if (activateAutoImporter(config)) {
      }
      */
    }
  } as Plugin
}

function resetAutoImporter() {
  writeFileSync(
    autoImporterFile,
    ['// I will be overwritten momentarily.', "exports.status = 'RESETING';", ''].join('\n')
  )
  /*
  try {
  } catch(err) {
    if(! isRunningWithYarnPnp() ) {
      throw err
    }
  }
  */
}

/*
function activateAutoImporter(config: Config): boolean {
  if (config.vitePluginDistImporter.disableAutoImporter === null) {
    return isRunningWithYarnPnp()
  }
  return config.vitePluginDistImporter.disableAutoImporter
}
*/

function getDistPath(config: ResolvedConfig) {
  assert(isSSR(config))
  const { root } = config
  assertPosixPath(root)
  const rootRelative = path.posix.relative(getSrcDir(), root) // To `require()` an absolute path doesn't seem to work on Vercel
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
