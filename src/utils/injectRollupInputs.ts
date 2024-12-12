export { injectRollupInputs }
export { normalizeRollupInput }

import type { ResolvedConfig } from 'vite'
import { assert } from './assert.js'
import { isObject } from './isObject.js'

function injectRollupInputs(inputsNew: Record<string, string>, config: ResolvedConfig): Record<string, string> {
  const inputsCurrent = normalizeRollupInput(config.build.rollupOptions.input)
  const input = {
    ...inputsNew,
    ...inputsCurrent,
  }
  return input
}

function normalizeRollupInput(input?: string | string[] | Record<string, string>): Record<string, string> {
  if (!input) {
    return {}
  }
  // Usually `input` is an oject, but the user can set it as a `string` or `string[]`
  if (typeof input === 'string') {
    input = [input]
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input.map((input) => [input, input]))
  }
  assert(isObject(input))
  return input
}
