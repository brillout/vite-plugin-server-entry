export type AutoImporter =
  | AutoImporterCleared
  | {
      status: 'SET'
      loadImportBuild: () => void
      paths: AutoImporterPaths
    }
export type AutoImporterCleared =
  | { status: 'UNSET' }
  | { status: 'RESET' }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  importBuildFilePathRelative: string
  importBuildFilePathOriginal: string
  importBuildFilePathResolved: () => string
}
