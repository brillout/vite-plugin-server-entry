export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      pluginVersion: string
      loadServerEntry: () => Promise<void>
      paths: AutoImporterPaths
    }
  | {
      status: 'BUNDLED'
      loadServerEntry: () => Promise<void>
    }
// prettier-ignore
// biome-ignore format:
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'BUILDING' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFilePathActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathAbsolute: string
}
