export default distImporter
export { distImporter }

import { generateImporter } from './generateImporter'
import { viteConfigJson } from './viteConfigJson'
import type { Plugin } from 'vite'

function distImporter(options: {
  importerCode: string
  disableAutoImporter?: boolean
  projectName: string
  assertUsage: (condition: unknown, msg: string) => asserts condition
  yarnDocLink: string
}): PluginInterop {
  const plugins: Plugin[] = [generateImporter(options), viteConfigJson(options)]
  return plugins
}

// Return type `any` to avoid Plugin type mismatches when there are multiple Vite versions installed
type PluginInterop = any[]
