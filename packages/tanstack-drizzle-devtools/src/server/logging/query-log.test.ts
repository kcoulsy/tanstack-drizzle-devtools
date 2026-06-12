import { describe, expect, it } from 'vitest'

import {
  completeQuery,
  getQueryLog,
  logQuery,
  runWithQueryLog,
} from './query-log.ts'

describe('completeQuery', () => {
  it('completes the newest matching entry when sql is provided', async () => {
    await runWithQueryLog(async () => {
      logQuery('select 1', [])
      logQuery('select 2', [])

      completeQuery({
        sql: 'select 2',
        params: [],
        durationMs: 20,
        rowCount: 2,
      })
      completeQuery({
        sql: 'select 1',
        params: [],
        durationMs: 10,
        rowCount: 1,
      })

      const queries = getQueryLog()
      expect(queries[0]?.durationMs).toBe(10)
      expect(queries[0]?.rowCount).toBe(1)
      expect(queries[1]?.durationMs).toBe(20)
      expect(queries[1]?.rowCount).toBe(2)
    })
  })

  it('falls back to the latest entry when sql is omitted', () => {
    runWithQueryLog(() => {
      logQuery('select 1', [])

      completeQuery({
        durationMs: 5,
        rowCount: 1,
      })

      expect(getQueryLog()[0]?.durationMs).toBe(5)
    })
  })
})
