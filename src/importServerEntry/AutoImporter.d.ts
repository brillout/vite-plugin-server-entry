export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      loadServerEntry: () => Promise<void>
      paths: AutoImporterPaths
    }
// prettier-ignore
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'BUILDING' }
  | { status: 'DISABLED' }
  | { status: 'TEST_CRAWLER' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathOriginal: string
  serverEntryFilePathResolved: () => string
}
