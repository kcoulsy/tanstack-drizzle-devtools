import { useEffect } from 'react'

import { drizzleDevtoolsClient } from './event-client.ts'
import { readQueriesFromWindow, setCachedQueries } from './query-cache.ts'

export function DrizzleQueryBootstrap() {
  useEffect(() => {
    const queries = readQueriesFromWindow()
    setCachedQueries(queries)
    drizzleDevtoolsClient.emit('queries-update', { queries })

    delete window.__DB_QUERIES__
  }, [])

  return null
}
