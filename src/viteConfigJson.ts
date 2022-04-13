// The sole purpose of this plugin is to support Yarn PnP.
// `generateImporter()` does not work wiht Yarn PnP.
// Instead we use `vite.config.json` to expose `config.root` and `config.build.outDir` at server production runtime.

export { viteConfigJson }

import type { Plugin, ResolvedConfig } from 'vite'
import { ConfigStatic, loadStaticConfig } from './viteConfigJson/loadStaticConfig'
import { assert, assertPosixPath, isYarnPnP, toPosixPath } from './utils'
import path from 'path'

function viteConfigJson(options: {
  assertUsage: (condition: unknown, msg: string) => asserts condition
  yarnDocLink: string
}): Plugin {
  const pluginName = `vite-plugin-dist-importer:vite.config.json`
  return {
    name: pluginName,
    enforce: 'post',
    configResolved(config) {
      // TODO
      // removeDuplicatedInstances(config)
      const configStatic = loadStaticConfig()
      assert(configStatic)
      verifyRoot(config, configStatic)
      verifyConfig(config)
      setConfig(config, configStatic)
    }
  } as Plugin

  /*
  function removeDuplicatedInstances(config) {
      let isDuplicate = false
      ;(config.plugins as any) = config.plugins.filter((p) => {
        if (p.name !== pluginName) return true
        if (isDuplicate) return false
        isDuplicate = true
        return true
      })
  }
  */

  // Make sure that `configStatic.root === root`
  function verifyRoot(config: ResolvedConfig, configStatic: ConfigStatic) {
    const root = toPosixPath(config.root)
    if (configStatic.configFile) {
      assert(configStatic.rootFile === configStatic.configFile)
      assert(configStatic.root === path.posix.dirname(configStatic.configFile))
      assertUsage(configStatic.root === root, `Move ${configStatic.configFile} to your app's root directory ${root}`)
    } else {
      assertUsage(
        configStatic.root === root,
        `The application root of the current directory (${configStatic.cwd}) is ${configStatic.root} but \`vite.config.js#root === '${root}'\`. Make sure to set \`vite.config.js#root\` to ${configStatic.root}.`
      )
    }
    assert(configStatic.root === root)
  }

  // `build.outDir` should be defined in `vite.config.json` (if using Yarn PnP)
  function verifyConfig(config: ResolvedConfig) {
    if (isYarnPnP()) {
      const { isDefaultValue } = analyzeOutDir(config)
      assertUsage(
        isDefaultValue,
        `When using Yarn PnP, the config \`vite.config.js#build.outDir\` needs to be defined in \`vite.config.json\` instead of \`vite.config.js\`. See ${options.yarnDocLink} for more information.`
      )
    }
  }

  // Set `build.outDir`
  function setConfig(config: ResolvedConfig, configStatic: ConfigStatic) {
    const { outDirEnv } = analyzeOutDir(config)
    let { outDir } = configStatic.build
    outDir = normalizeOutDir(outDir)
    assert(!outDir.endsWith('/'))
    if (outDirEnv) {
      outDir = outDir + '/' + outDirEnv
    }
    config.build.outDir = outDir
  }

  // Circumvent TS bug
  // https://github.com/microsoft/TypeScript/issues/36931
  function assertUsage(condition: unknown, msg: string): asserts condition {
    options.assertUsage(condition, msg)
  }
  /*
  function assert(condition: unknown, debugInfo?: unknown): asserts condition {
    options.assert(condition, debugInfo)
  }
  */
}

function analyzeOutDir(config: ResolvedConfig) {
  let { outDir } = config.build
  assertPosixPath(outDir)
  outDir = normalizeOutDir(outDir)
  let outDirRoot: string
  let outDirEnv: 'client' | 'server' | null
  if (outDir.endsWith('/client')) {
    outDirRoot = outDir.slice(0, -1 * '/client'.length)
    outDirEnv = 'client'
  } else if (outDir.endsWith('/server')) {
    outDirRoot = outDir.slice(0, -1 * '/server'.length)
    outDirEnv = 'server'
  } else {
    outDirRoot = outDir
    outDirEnv = null
  }
  const isDefaultValue = outDirRoot === 'dist'
  return { isDefaultValue, outDirEnv }
}

function normalizeOutDir(outDir: string) {
  return outDir.split('/').filter(Boolean).join('/')
}
