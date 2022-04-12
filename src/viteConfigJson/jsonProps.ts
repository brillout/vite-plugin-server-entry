// TODO remove `jsonProps`.
//  - `build.outDir` and `root` are the only two configs that make sense to define in `vite.config.json`
//    - Because more configs should be loded with `dist/server/importBuild.cjs`
//  - No need to be able to extend `vite.config.json` with more `jsonProps`

export type JsonProp = { propPath: string; isDefaultValue: (value: unknown) => boolean; defaultValue: string }
export const jsonProps: JsonProp[] = [
  {
    propPath: 'build.outDir',
    isDefaultValue: (value: unknown) =>
      typeof value === 'string' && value.split('/').filter(Boolean).join('/') === 'dist',
    defaultValue: 'dist' as const
  }
]
