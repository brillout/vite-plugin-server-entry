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
  | { status: 'DISABLED' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFilePathActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathOriginal: string
  serverEntryFilePathResolved: () => string
}
