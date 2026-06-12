export type QueryKind = 'read' | 'write'

export type QuerySource = {
  file: string
  line: number
}

export type QueryLogEntry = {
  sql: string
  params: unknown[]
  timestamp: number
  durationMs: number
  kind: QueryKind
  sizeBytes: number
  rowCount?: number
  source?: QuerySource
}

export type QuerySortOption =
  | 'order'
  | 'duration-asc'
  | 'duration-desc'
  | 'sql-asc'
