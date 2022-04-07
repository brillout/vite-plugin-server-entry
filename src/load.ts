export { load }

function load(assertFunctions: {
  assert: (condition: unknown) => asserts condition
  assertUsage: (condition: unknown, msg: string) => asserts condition
}) {
  const moduleExports = require('./autoImporter')
  const keys = Object.keys(moduleExports)
  if (keys.length !== 0) {
    assert(keys.length === 1)
    assert(moduleExports.importerStatus === 'unset')
    assertUsage(false, 'You seem to be using Yarn PnP.')
  }

  return

  // Circumvent TS bug
  // https://github.com/microsoft/TypeScript/issues/36931
  function assert(condition: unknown): asserts condition {
    assertFunctions.assert(condition)
  }
  function assertUsage(condition: unknown, msg: string): asserts condition {
    assertFunctions.assertUsage(condition, msg)
  }
}
