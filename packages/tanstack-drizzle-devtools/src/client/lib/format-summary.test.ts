import { describe, expect, it } from 'vitest'

import { formatQuerySummary } from './format-summary.ts'
import {
  buildQueryList,
  getQueryStats,
  type QueryListItem,
} from './query-utils.ts'
import type { QueryLogEntry } from '../../types.ts'

function makeQuery(
  overrides: Partial<QueryLogEntry> & Pick<QueryLogEntry, 'sql'>,
): QueryLogEntry {
  return {
    params: [],
    timestamp: 0,
    durationMs: 1,
    kind: 'read',
    sizeBytes: 0,
    ...overrides,
  }
}

function summarize(queries: QueryLogEntry[]) {
  const items = buildQueryList(queries)
  const stats = getQueryStats(items)

  return formatQuerySummary(items, stats)
}

describe('formatQuerySummary', () => {
  it('renders overview stats', () => {
    const summary = summarize([
      makeQuery({ sql: 'select * from users' }),
      makeQuery({ sql: 'select * from posts' }),
    ])

    expect(summary).toContain('# Database query log — optimization review')
    expect(summary).toContain('- Total statements: 2')
    expect(summary).toContain('- Unique (SQL + params): 2')
    expect(summary).toContain('- Duplicate executions: 0')
    expect(summary).toContain('- N+1 queries: 0')
  })

  it('renders N+1 pattern section with sample params', () => {
    const sql = 'select * from posts where user_id = ?'
    const summary = summarize([
      makeQuery({
        sql,
        params: [1],
        durationMs: 2,
        source: { file: 'src/routes/blog.tsx', line: 42 },
      }),
      makeQuery({ sql, params: [2], durationMs: 3 }),
      makeQuery({ sql, params: [3], durationMs: 4 }),
      makeQuery({ sql, params: [4], durationMs: 5 }),
    ])

    expect(summary).toContain('## N+1 patterns')
    expect(summary).toContain('### Pattern 1 (×4, 14ms total)')
    expect(summary).toContain(sql)
    expect(summary).toContain('- kind: read')
    expect(summary).toContain('- source: src/routes/blog.tsx:42')
    expect(summary).toContain('- sample params: [1], [2], [3] (+1 more)')
  })

  it('renders exact duplicate grouping', () => {
    const summary = summarize([
      makeQuery({
        sql: 'select count(*) from todos where completed = ?',
        params: [false],
        durationMs: 2,
      }),
      makeQuery({
        sql: 'select count(*) from todos where completed = ?',
        params: [false],
        durationMs: 4,
      }),
    ])

    expect(summary).toContain('## Exact duplicates (same SQL + params)')
    expect(summary).toContain('### ×2 (6.0ms total)')
    expect(summary).toContain('- params: [false]')
  })

  it('collapses repeated N+1 and duplicate entries in execution order', () => {
    const nPlusOneSql = 'select * from posts where user_id = ?'
    const duplicateSql = 'select count(*) from todos where completed = ?'
    const items: QueryListItem[] = buildQueryList([
      makeQuery({ sql: 'select * from users limit ?', params: [10] }),
      makeQuery({ sql: nPlusOneSql, params: [1] }),
      makeQuery({ sql: nPlusOneSql, params: [2] }),
      makeQuery({ sql: duplicateSql, params: [false] }),
      makeQuery({ sql: duplicateSql, params: [false] }),
    ])
    const stats = getQueryStats(items)
    const summary = formatQuerySummary(items, stats)

    const executionSection = summary.split('## Queries by execution order')[1] ?? ''
    const headings = [...executionSection.matchAll(/^### #\d+/gm)].map((match) => match[0])

    expect(headings).toEqual(['### #1', '### #2', '### #3'])
    expect(executionSection).toContain('[N+1 ×2]')
    expect(executionSection).toContain('[duplicate ×2]')
    expect(executionSection.match(/\[N\+1 ×2\]/g)).toHaveLength(1)
    expect(executionSection.match(/\[duplicate ×2\]/g)).toHaveLength(1)
  })
})
