import { getDrizzleDevtoolsConfig } from './config.ts'
import { drizzleDevtoolsClient } from './event-client.ts'
import { setCachedQueries } from './query-cache.ts'
import { getNPlusOneDetection } from './query-utils.ts'
import type { QueryLogEntry } from '../../types.ts'

export function publishQueriesToClient(
  queries: QueryLogEntry[],
  options?: { replace?: boolean },
) {
  if (options?.replace) {
    setCachedQueries(queries)
  }

  const { alertOnNPlusOne } = getDrizzleDevtoolsConfig()
  if (
    alertOnNPlusOne &&
    queries.length > 0 &&
    typeof window !== 'undefined'
  ) {
    const { detected } = getNPlusOneDetection(queries)
    if (detected) {
      window.alert(
        'N+1 query detected: same SQL was executed multiple times with different parameters. Open the Drizzle devtools panel for details.',
      )
    }
  }

  drizzleDevtoolsClient.emit('queries-update', {
    queries,
    replace: options?.replace,
  })
}
