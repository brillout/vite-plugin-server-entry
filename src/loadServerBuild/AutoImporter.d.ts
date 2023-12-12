export type AutoImporter =
  | { status: 'UNSET' }
  | {
      status: 'SET'
      loadImportBuild: () => void
      paths: AutoImporterPaths
    }
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  importBuildFilePathRelative: string
  importBuildFilePathOriginal: string
  importBuildFilePathResolved: () => string
}
