import { getQueryFingerprint } from '../query-fingerprint.ts'
import type { QueryLogEntry, QuerySortOption } from '../types.ts'

export type QueryListItem = QueryLogEntry & {
  index: number
  fingerprint: string
  isDuplicate: boolean
}

export function buildQueryList(queries: QueryLogEntry[]) {
  const counts = new Map<string, number>()

  for (const query of queries) {
    const fingerprint = getQueryFingerprint(query.sql, query.params)
    counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1)
  }

  return queries.map((query, index) => {
    const fingerprint = getQueryFingerprint(query.sql, query.params)
    const count = counts.get(fingerprint) ?? 0

    return {
      ...query,
      index,
      fingerprint,
      isDuplicate: count > 1,
    }
  })
}

export function getQueryStats(items: QueryListItem[]) {
  const unique = new Set(items.map((item) => item.fingerprint)).size
  const total = items.length
  const duplicates = total - unique
  const totalDurationMs = items.reduce((sum, item) => sum + item.durationMs, 0)
  const totalSizeBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0)

  return { total, unique, duplicates, totalDurationMs, totalSizeBytes }
}

export function sortQueries(
  items: QueryListItem[],
  sort: QuerySortOption,
) {
  const sorted = [...items]

  switch (sort) {
    case 'duration-asc':
      return sorted.sort((a, b) => a.durationMs - b.durationMs)
    case 'duration-desc':
      return sorted.sort((a, b) => b.durationMs - a.durationMs)
    case 'sql-asc':
      return sorted.sort((a, b) => a.sql.localeCompare(b.sql))
    default:
      return sorted.sort((a, b) => a.index - b.index)
  }
}

export function filterQueries(
  items: QueryListItem[],
  showOnlyDuplicates: boolean,
) {
  if (!showOnlyDuplicates) {
    return items
  }

  return items.filter((item) => item.isDuplicate)
}
