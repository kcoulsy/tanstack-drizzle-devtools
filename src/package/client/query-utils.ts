import {
  getQueryFingerprint,
  getSqlShapeFingerprint,
} from '../query-fingerprint.ts'
import type { QueryLogEntry, QuerySortOption } from '../types.ts'

export type QueryListItem = QueryLogEntry & {
  index: number
  fingerprint: string
  sqlShape: string
  isDuplicate: boolean
  isNPlusOne: boolean
  nPlusOneGroupSize: number
}

const N_PLUS_ONE_MIN_COUNT = 2

export function buildQueryList(queries: QueryLogEntry[]) {
  const counts = new Map<string, number>()
  const shapeGroups = new Map<string, Set<string>>()
  const shapeCounts = new Map<string, number>()

  for (const query of queries) {
    const fingerprint = getQueryFingerprint(query.sql, query.params)
    counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1)

    const sqlShape = getSqlShapeFingerprint(query.sql)
    shapeCounts.set(sqlShape, (shapeCounts.get(sqlShape) ?? 0) + 1)

    const paramKey = JSON.stringify(query.params)
    const paramsForShape = shapeGroups.get(sqlShape) ?? new Set<string>()
    paramsForShape.add(paramKey)
    shapeGroups.set(sqlShape, paramsForShape)
  }

  const nPlusOneShapes = new Set<string>()
  const nPlusOneGroupSizes = new Map<string, number>()

  for (const [sqlShape, shapeCount] of shapeCounts) {
    const paramsForShape = shapeGroups.get(sqlShape)
    if (
      shapeCount >= N_PLUS_ONE_MIN_COUNT &&
      (paramsForShape?.size ?? 0) >= N_PLUS_ONE_MIN_COUNT
    ) {
      nPlusOneShapes.add(sqlShape)
      nPlusOneGroupSizes.set(sqlShape, shapeCount)
    }
  }

  return queries.map((query, index) => {
    const fingerprint = getQueryFingerprint(query.sql, query.params)
    const count = counts.get(fingerprint) ?? 0
    const sqlShape = getSqlShapeFingerprint(query.sql)
    const isNPlusOne = nPlusOneShapes.has(sqlShape)

    return {
      ...query,
      index,
      fingerprint,
      sqlShape,
      isDuplicate: count > 1,
      isNPlusOne,
      nPlusOneGroupSize: nPlusOneGroupSizes.get(sqlShape) ?? 0,
    }
  })
}

export function getQueryStats(items: QueryListItem[]) {
  const unique = new Set(items.map((item) => item.fingerprint)).size
  const total = items.length
  const duplicates = total - unique
  const nPlusOne = items.filter((item) => item.isNPlusOne).length
  const nPlusOneGroups = new Set(
    items.filter((item) => item.isNPlusOne).map((item) => item.sqlShape),
  ).size
  const totalDurationMs = items.reduce((sum, item) => sum + item.durationMs, 0)
  const totalSizeBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0)

  return {
    total,
    unique,
    duplicates,
    nPlusOne,
    nPlusOneGroups,
    totalDurationMs,
    totalSizeBytes,
  }
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
  options: {
    showOnlyDuplicates?: boolean
    showOnlyNPlusOne?: boolean
  },
) {
  const { showOnlyDuplicates = false, showOnlyNPlusOne = false } = options

  if (!showOnlyDuplicates && !showOnlyNPlusOne) {
    return items
  }

  return items.filter((item) => {
    if (showOnlyDuplicates && showOnlyNPlusOne) {
      return item.isDuplicate || item.isNPlusOne
    }

    if (showOnlyNPlusOne) {
      return item.isNPlusOne
    }

    return item.isDuplicate
  })
}
