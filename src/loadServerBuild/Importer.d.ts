export type Importer =
  | { status: 'UNSET' }
  | {
      status: 'SET'
      loadImportBuild: () => void
      paths: ImporterPaths
    }
export type ImporterPaths = {
  autoImporterFilePathOriginal: string
  importBuildFilePathRelative: string
  importBuildFilePathOriginal: string
  importBuildFilePathResolved: () => string
}
