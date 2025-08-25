export function isViteServerSide(config: { build?: { ssr?: boolean | string } }): boolean {
  return !!config?.build?.ssr
}
