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
export type AutoImporterPaths = {
  autoImporterFilePathOriginal: string
  autoImporterFileDirActual: string
  importBuildFilePathRelative: string
  importBuildFilePathOriginal: string
  importBuildFilePathResolved: () => string
}
