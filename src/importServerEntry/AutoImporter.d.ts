export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      loadServerEntry: () => void
      paths: AutoImporterPaths
    }
// prettier-ignore
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'RESET' }
  | { status: 'DISABLED' }
  | { status: 'TEST_CRAWLER' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  serverEntryFilePathRelative: string
  serverEntryFilePathOriginal: string
  serverEntryFilePathResolved: () => string
}
