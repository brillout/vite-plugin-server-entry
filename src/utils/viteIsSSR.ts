export function viteIsSSR(config: { build?: { ssr?: boolean | string } }): boolean {
  return !!config?.build?.ssr
}
