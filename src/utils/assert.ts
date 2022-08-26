const name = '@brillout/vite-plugin-import-build'
const repo = 'https://github.com/brillout/vite-plugin-import-build/issues/new'

export function assert(condition: unknown, debugInfo?: unknown): asserts condition {
  if (condition) return

  const debugStr = debugInfo && (typeof debugInfo === 'string' ? debugInfo : '`' + JSON.stringify(debugInfo) + '`')

  throw new Error(
    [
      `[${name}][Bug] You stumbled upon a bug in the source code of ${name}.`,
      `Reach out at ${repo} and include this error stack`,
      '(the error stack is usually enough to fix the problem).',
      debugStr && `(Debug info for the maintainers: ${debugStr})`
    ]
      .filter(Boolean)
      .join(' ')
  )
}
