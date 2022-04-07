export default distImporter
export { distImporter }

import type { Plugin, ResolvedConfig } from 'vite'
import { /*applyDev, isRunningWithYarnPnp,*/ assert, isSSR, objectAssign, toPosixPath } from './utils'
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
    apply: 'build',
    configResolved(config_: ConfigInit) {
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
      if (config.vitePluginDistImporter.alreadyGenerated) return
      if (!isSSR(config)) return
      config.vitePluginDistImporter.alreadyGenerated = true

      const source = config.vitePluginDistImporter.importerCodes.join('\n')

      const fileName = 'importDist.cjs'
      this.emitFile({
        fileName,
        type: 'asset',
        source
      })

      const DistImporterFile = path.posix.join(getDistPath(config), 'server', fileName)
      writeFileSync(autoImporterFile, `require('${DistImporterFile}');\n`)
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
    ['// I will be overwritten momentarily.', "exports.importerStatus = 'reseting';", ''].join('\n')
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
  const {
    root,
    build: { outDir }
  } = config
  assert(root)
  assert(outDir.endsWith('/server'))
  const sourceDir = toPosixPath(__dirname + (() => '')()) // trick to avoid `@vercel/ncc` to glob import
  const rootRelative = path.posix.relative(sourceDir, root) // To `require()` an absolute path doesn't seem to work on Vercel
  const distPath = path.posix.join(rootRelative, path.posix.join(outDir, '..'))
  return distPath
}

// Return type `any` to avoid Plugin type mismatches when there are multiple Vite versions installed
type PluginInterop = any
