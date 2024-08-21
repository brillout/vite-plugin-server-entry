export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      loadServerEntry: () => Promise<void>
      paths: AutoImporterPaths
    }
// prettier-ignore
// biome-ignore format:
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'BUILDING' }
  | { status: 'DISABLED:INJECT' }
  | { status: 'DISABLED:TEST_CRAWLER' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathOriginal: string
  serverEntryFilePathResolved: () => string
}
