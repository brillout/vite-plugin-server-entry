export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      loadImportBuild: () => void
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
  importBuildFilePathRelative: string
  importBuildFilePathOriginal: string
  importBuildFilePathResolved: () => string
}
