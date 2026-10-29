import { importServerProductionEntry } from '../../../dist/esm/runtime/index.js'

export async function loadServerEntry() {
  await importServerProductionEntry()
  return globalThis.serverEntryMarker
}
