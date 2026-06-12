import { createMiddleware } from '@tanstack/react-start'

import { injectQueryScript } from './inject.ts'
import type { QueryLogMiddlewareOptions } from './options.ts'
import { getQueryLog, runWithQueryLog } from '../logging/query-log.ts'

export function createQueryLogMiddleware(options?: QueryLogMiddlewareOptions) {
  const enabled = options?.enabled ?? process.env.NODE_ENV === 'development'

  return createMiddleware().server(async ({ next }) => {
    return runWithQueryLog(async () => {
      const result = await next()

      if (!enabled) {
        return result
      }

      const queries = getQueryLog()
      if (queries.length === 0) {
        return result
      }

      const response = result.response
      const contentType = response.headers.get('content-type') ?? ''

      if (!contentType.includes('text/html')) {
        return result
      }

      const html = await response.text()
      const injected = injectQueryScript(html, queries, options)

      return {
        ...result,
        response: new Response(injected, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }),
      }
    })
  })
}
