import { drizzleDevtoolsClient } from './event-client.ts'
import { setCachedQueries } from './query-cache.ts'
import type { QueryLogEntry } from '../types.ts'

export function publishQueriesToClient(queries: QueryLogEntry[]) {
  setCachedQueries(queries)
  drizzleDevtoolsClient.emit('queries-update', { queries })
}
