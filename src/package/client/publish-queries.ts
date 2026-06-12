import { drizzleDevtoolsClient } from './event-client.ts'
import { setCachedQueries } from './query-cache.ts'
import type { QueryLogEntry } from '../types.ts'

export function publishQueriesToClient(
  queries: QueryLogEntry[],
  options?: { replace?: boolean },
) {
  if (options?.replace) {
    setCachedQueries(queries)
  }

  drizzleDevtoolsClient.emit('queries-update', {
    queries,
    replace: options?.replace,
  })
}
