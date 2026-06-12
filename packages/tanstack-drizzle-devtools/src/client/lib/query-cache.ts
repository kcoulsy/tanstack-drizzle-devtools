import type { QueryLogEntry } from '../../types.ts'

let cachedQueries: QueryLogEntry[] = []

export function setCachedQueries(queries: QueryLogEntry[]) {
  cachedQueries = queries
}

export function getCachedQueries() {
  return cachedQueries
}

export function readQueriesFromWindow() {
  const queries = window.__DB_QUERIES__ ?? []
  setCachedQueries(queries)
  return queries
}
