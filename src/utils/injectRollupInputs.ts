export { injectRollupInputs }
export { normalizeRollupInput }
export type { InputOption }

import { assert } from './assert.js'
import { isObject } from './isObject.js'

type InputOption = string | string[] | Record<string, string>

function injectRollupInputs(
  inputsNew: Record<string, string>,
  inputCurrent: InputOption | undefined,
): Record<string, string> {
  const inputsCurrent = normalizeRollupInput(inputCurrent)
  const input = {
    ...inputsNew,
    ...inputsCurrent,
  }
  return input
}

function normalizeRollupInput(input?: InputOption): Record<string, string> {
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
