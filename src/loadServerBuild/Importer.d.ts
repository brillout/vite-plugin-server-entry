export type Importer =
  | { status: 'UNSET' }
  | {
      status: 'SET'
      loadImportBuild: () => void
      paths: ImporterPaths
    }
export type ImporterPaths = {
  importBuildFilePathRelative: string
  importBuildFilePathResolved: () => string
  importBuildFilePathOriginal: string
  autoImporterFilePathOriginal: string
}
