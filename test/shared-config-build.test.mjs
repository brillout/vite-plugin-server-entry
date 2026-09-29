import assert from 'node:assert/strict'
import { readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createBuilder } from 'vite'
import { serverProductionEntryPlugin } from '../dist/esm/plugin/index.js'

const fixtureRoot = fileURLToPath(new URL('./fixtures/shared-config-build/', import.meta.url))
const outDirRoot = path.join(tmpdir(), `vite-plugin-server-entry-${process.pid}`)

after(async () => {
  await rm(outDirRoot, { recursive: true, force: true })
})

function getEnvironments(outDir, envNames) {
  const environments = {}
  for (const envName of envNames) {
    const isClient = envName === 'client'
    environments[envName] = {
      consumer: isClient ? 'client' : 'server',
      build: {
        emptyOutDir: true,
        outDir: path.join(outDir, envName),
        rollupOptions: { input: { [envName]: path.join(fixtureRoot, isClient ? 'client.js' : 'server.js') } },
        ...(isClient ? {} : { ssr: true }),
      },
    }
  }
  return environments
}

async function build(outDir, sharedConfigBuild, envNames) {
  const builder = await createBuilder({
    root: fixtureRoot,
    logLevel: 'silent',
    builder: { sharedConfigBuild },
    environments: getEnvironments(outDir, envNames),
    plugins: [
      serverProductionEntryPlugin({
        libraryName: 'Integration Test',
        getServerProductionEntry: () => `export const serverEntryMarker = 'shared-config-build'`,
      }),
    ],
  })
  await builder.buildApp()
}

for (const sharedConfigBuild of [true, false]) {
  test(`emits the server entry for the ssr environment (sharedConfigBuild: ${sharedConfigBuild})`, async () => {
    const outDir = path.join(outDirRoot, String(sharedConfigBuild))
    await build(outDir, sharedConfigBuild, ['client', 'ssr'])
    const serverEntry = await readFile(path.join(outDir, 'ssr', 'entry.js'), 'utf8')
    assert.match(serverEntry, /shared-config-build/)
  })
}

test('emits the server entry only for the ssr environment (sharedConfigBuild: true)', async () => {
  const outDir = path.join(outDirRoot, 'rsc')
  // E.g. the `rsc` environment of @vitejs/plugin-rsc
  await build(outDir, true, ['client', 'ssr', 'rsc'])
  assert.ok((await readdir(path.join(outDir, 'ssr'))).includes('entry.js'))
  assert.ok(!(await readdir(path.join(outDir, 'rsc'))).includes('entry.js'))
})
