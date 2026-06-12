import type { QueryLogEntry } from '../../types.ts'
import type { QueryLogMiddlewareOptions } from './options.ts'

export const QUERY_LOG_SEND_CONTEXT_KEY = 'drizzleDevtoolsQueries'

export function createFunctionClientMiddleware(
  options?: QueryLogMiddlewareOptions,
) {
  const enabled = options?.enabled ?? process.env.NODE_ENV === 'development'

  return async ({
    next,
  }: {
    next: () => Promise<{
      context?: Record<string, unknown>
    }>
  }) => {
    const result = await next()

    if (!enabled) {
      return result
    }

    const queries = result.context?.[QUERY_LOG_SEND_CONTEXT_KEY] as
      | QueryLogEntry[]
      | undefined

    if (queries) {
      if (options?.alertOnNPlusOne) {
        const { configureDrizzleDevtools } = await import(
          '../../client/lib/config.ts'
        )
        configureDrizzleDevtools({ alertOnNPlusOne: true })
      }

      const { publishQueriesToClient } = await import(
        '../../client/lib/publish-queries.ts'
      )
      publishQueriesToClient(queries, { replace: false })
    }

    return result
  }
}
