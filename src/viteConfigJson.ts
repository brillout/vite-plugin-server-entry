// The sole purpose of this plugin is to support Yarn PnP.
// `generateImporter()` does not work wiht Yarn PnP.
// Instead we use `vite.config.json` to expose `config.root` and `config.build.outDir` at server production runtime.

export { viteConfigJson }

import type { Plugin, ResolvedConfig } from 'vite'
import { ConfigStatic, loadStaticConfig } from './viteConfigJson/loadStaticConfig'
import { assert, isObject, isYarnPnP, toPosixPath } from './utils'
import { jsonProps } from './viteConfigJson/jsonProps'
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
      jsonProps.forEach(({ propPath, isDefaultValue }) => {
        const configVal = getConfigVal(config, propPath)
        assertUsage(
          isDefaultValue(configVal),
          `When using Yarn PnP, the Vite config \`${propPath}\` needs to be defined in \`vite.config.json\` instead of \`vite.config.js\`. See ${options.yarnDocLink} for more information.`
        )
      })
    }
  }

  function setConfig(config: ResolvedConfig, configStatic: ConfigStatic) {
    // `build.outDir`
    jsonProps.forEach(({ propPath }) => {
      const val = getConfigVal(configStatic, propPath)
      setConfigVal(config, propPath, val)
    })
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

function getConfigVal(config: Record<string, unknown>, propPath: string): unknown {
  const [nextProp, ...rest] = propPath.split('.')
  const configVal = config[nextProp]
  if (rest.length === 0) {
    return configVal
  } else {
    if (!isObject(configVal)) {
      return undefined
    } else {
      return getConfigVal(configVal, rest.join('.'))
    }
  }
}
function setConfigVal(config: Record<string, unknown>, propPath: string, val: unknown): void {
  const [nextProp, ...rest] = propPath.split('.')
  if (rest.length === 0) {
    config[nextProp] = val
  } else {
    const configVal = config[nextProp]
    let nested: Record<string, unknown>
    if (isObject(configVal)) {
      nested = configVal
    } else {
      nested = config[nextProp] = {}
    }
    setConfigVal(nested, rest.join('.'), val)
  }
}
