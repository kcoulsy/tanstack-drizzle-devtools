import { createMiddleware } from '@tanstack/react-start'

import {
  createFunctionClientMiddleware,
  QUERY_LOG_SEND_CONTEXT_KEY,
} from './function-client.ts'
import type { QueryLogMiddlewareOptions } from './options.ts'

export { QUERY_LOG_SEND_CONTEXT_KEY }

export function createQueryLogFunctionMiddleware(
  options?: QueryLogMiddlewareOptions,
) {
  const enabled = options?.enabled ?? process.env.NODE_ENV === 'development'

  return createMiddleware({ type: 'function' })
    .client(createFunctionClientMiddleware(options))
    .server(async ({ next }) => {
      const result = await next()

      if (!enabled) {
        return result
      }

      const { getQueryLog } = await import('../logging/query-log.ts')
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
