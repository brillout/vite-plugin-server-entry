export { assert }
export { assertUsage }
export { logLabel }

import { createErrorWithCleanStackTrace } from './createErrorWithCleanStackTrace'
import { projectInfo } from './projectInfo'

const logLabel = `[${projectInfo.npmPackageName}@${projectInfo.projectVersion}]` as const
const internalErrorPrefix = `${logLabel}[Bug]` as const
const usageErrorPrefix = `${logLabel}[Wrong Usage]` as const

const numberOfStackTraceLinesToRemove = 2

function assert(condition: unknown, debugInfo?: unknown): asserts condition {
  if (condition) {
    return
  }

  const debugStr = (() => {
    if (!debugInfo) {
      return null
    }
    const debugInfoSerialized = typeof debugInfo === 'string' ? debugInfo : '`' + JSON.stringify(debugInfo) + '`'
    return `Debug info (this is for the ${projectInfo.projectName} maintainers; you can ignore this): ${debugInfoSerialized}`
  })()

  const internalError = createErrorWithCleanStackTrace(
    [
      `${internalErrorPrefix} You stumbled upon a bug in the source code of ${projectInfo.projectName}.`,
      `Reach out at ${projectInfo.githubRepository}/issues/new and include this error stack (the error stack is usually enough to fix the problem).`,
      'A maintainer will fix the bug (usually under 24 hours).',
      `Don't hesitate to reach out as it makes ${projectInfo.projectName} more robust.`,
      debugStr
    ]
      .filter(Boolean)
      .join(' '),
    numberOfStackTraceLinesToRemove
  )
  throw internalError
}

function assertUsage(condition: unknown, errorMessage: string): asserts condition {
  if (condition) {
    return
  }
  const errMsg = `${usageErrorPrefix} ${errorMessage}`
  const usageError = createErrorWithCleanStackTrace(errMsg, numberOfStackTraceLinesToRemove)
  throw usageError
}
