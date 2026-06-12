import type { QueryLogEntry } from '../../types.ts'

export const QUERY_LOG_SEND_CONTEXT_KEY = 'drizzleDevtoolsQueries'

export function createFunctionClientMiddleware(options?: { enabled?: boolean }) {
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
      const { publishQueriesToClient } = await import(
        '../../client/lib/publish-queries.ts'
      )
      publishQueriesToClient(queries)
    }

    return result
  }
}
