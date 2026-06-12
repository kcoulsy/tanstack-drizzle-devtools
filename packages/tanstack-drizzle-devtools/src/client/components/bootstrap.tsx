import { useEffect } from 'react'

import { publishQueriesToClient } from '../lib/publish-queries.ts'
import { readQueriesFromWindow } from '../lib/query-cache.ts'

export function DrizzleQueryBootstrap() {
  useEffect(() => {
    const queries = readQueriesFromWindow()
    publishQueriesToClient(queries, { replace: true })
    delete window.__DB_QUERIES__
  }, [])

  return null
}
