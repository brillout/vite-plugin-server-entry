export function isWebpackResolve(moduleResolve: string) {
  return typeof moduleResolve === 'number'
}
