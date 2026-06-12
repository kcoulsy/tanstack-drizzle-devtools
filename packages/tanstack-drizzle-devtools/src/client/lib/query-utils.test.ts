import { describe, expect, it } from 'vitest'

import { getNPlusOneDetection } from './query-utils.ts'
import type { QueryLogEntry } from '../../types.ts'

function makeQuery(
  sql: string,
  params: unknown[] = [],
): QueryLogEntry {
  return {
    sql,
    params,
    timestamp: 0,
    durationMs: 1,
    kind: 'read',
    sizeBytes: 0,
  }
}

describe('getNPlusOneDetection', () => {
  it('returns detected: false for a single query', () => {
    const result = getNPlusOneDetection([
      makeQuery('select * from users where id = ?', [1]),
    ])

    expect(result).toEqual({
      detected: false,
      groupCount: 0,
      queryCount: 0,
    })
  })

  it('returns detected: true when same SQL shape runs with different params', () => {
    const sql = 'select * from users where id = ?'
    const result = getNPlusOneDetection([
      makeQuery(sql, [1]),
      makeQuery(sql, [2]),
    ])

    expect(result).toEqual({
      detected: true,
      groupCount: 1,
      queryCount: 2,
    })
  })
})
