import { createMiddleware } from '@tanstack/react-start'

import { getQueryLog } from './query-log.ts'
import type { QueryLogEntry } from '../types.ts'

export const QUERY_LOG_SEND_CONTEXT_KEY = 'drizzleDevtoolsQueries'

export function createQueryLogFunctionMiddleware(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? process.env.NODE_ENV === 'development'

  return createMiddleware({ type: 'function' })
    .client(async ({ next }) => {
      const result = await next()

      if (!enabled) {
        return result
      }

      const queries = result.context?.[QUERY_LOG_SEND_CONTEXT_KEY] as
        | QueryLogEntry[]
        | undefined

      if (queries) {
        const { publishQueriesToClient } = await import(
          '../client/publish-queries.ts'
        )
        publishQueriesToClient(queries)
      }

      return result
    })
    .server(async ({ next }) => {
      const result = await next()

      if (!enabled) {
        return result
      }

      const queries = getQueryLog()
      if (queries.length === 0) {
        return result
      }

      return {
        ...result,
        sendContext: {
          ...result.sendContext,
          [QUERY_LOG_SEND_CONTEXT_KEY]: queries,
        },
      }
    })
}
