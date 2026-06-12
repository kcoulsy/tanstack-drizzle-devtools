import { useEffect } from 'react'

import { configureDrizzleDevtools } from '../lib/config.ts'
import { publishQueriesToClient } from '../lib/publish-queries.ts'
import { readQueriesFromWindow } from '../lib/query-cache.ts'

export function DrizzleQueryBootstrap() {
  useEffect(() => {
    const config = window.__DRIZZLE_DEVTOOLS_CONFIG__
    if (config) {
      configureDrizzleDevtools(config)
      delete window.__DRIZZLE_DEVTOOLS_CONFIG__
    }

    const queries = readQueriesFromWindow()
    publishQueriesToClient(queries, { replace: true })
    delete window.__DB_QUERIES__
  }, [])

  return null
}
