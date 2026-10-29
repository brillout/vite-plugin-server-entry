import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createBuilder } from 'vite'
import { serverProductionEntryPlugin } from '../dist/esm/plugin/index.js'

const fixtureRoot = fileURLToPath(new URL('./fixtures/bundled-runtime/', import.meta.url))
// Not dist/server/, so that the runtime can't find the server entry by crawling
const outDir = path.join(fixtureRoot, 'build')

after(async () => {
  await rm(outDir, { recursive: true, force: true })
})

test('the bundled runtime loads the server entry', async () => {
  const builder = await createBuilder({
    root: fixtureRoot,
    logLevel: 'silent',
    ssr: { noExternal: true },
    environments: {
      ssr: {
        build: { ssr: true, outDir, rollupOptions: { input: { index: path.join(fixtureRoot, 'server.js') } } },
      },
    },
    builder: {
      async buildApp(builder) {
        await builder.build(builder.environments.ssr)
      },
    },
    plugins: [
      serverProductionEntryPlugin({
        libraryName: 'Integration Test',
        getServerProductionEntry: () => `globalThis.serverEntryMarker = 'bundled-runtime'`,
      }),
    ],
  })
  await builder.buildApp()
  const { loadServerEntry } = await import(pathToFileURL(path.join(outDir, 'index.js')).href)
  assert.equal(await loadServerEntry(), 'bundled-runtime')
})
