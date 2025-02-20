export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      pluginVersion: string
      loadServerEntry: () => Promise<void>
      paths: AutoImporterPaths
    }
// prettier-ignore
// biome-ignore format:
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'BUILDING' }
  | { status: 'DISABLED_BY_INJECT' }
  | { status: 'DISABLED_BY_USER' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathOriginal: string
  serverEntryFilePathResolved: () => string
}
