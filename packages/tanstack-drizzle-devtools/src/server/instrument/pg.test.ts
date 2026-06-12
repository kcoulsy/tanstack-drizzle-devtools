import { describe, expect, it } from 'vitest'

import { getQueryLog, logQuery, runWithQueryLog } from '../logging/query-log.ts'
import { instrumentPg } from './pg.ts'

describe('instrumentPg', () => {
  it('records duration and row count for promise-based queries', async () => {
    const client = {
      async query(sql: string, params: unknown[] = []) {
        return {
          rows: [{ id: 1 }],
          rowCount: 1,
        }
      },
    }

    instrumentPg(client)

    await runWithQueryLog(async () => {
      logQuery('select * from users where id = $1', [1])
      await client.query('select * from users where id = $1', [1])

      const queries = getQueryLog()
      expect(queries).toHaveLength(1)
      expect(queries[0]?.durationMs).toBeGreaterThanOrEqual(0)
      expect(queries[0]?.rowCount).toBe(1)
      expect(queries[0]?.sizeBytes).toBeGreaterThan(0)
    })
  })

  it('works with Drizzle-style query config objects', async () => {
    const client = {
      async query(config: { text: string; values?: unknown[] }) {
        return {
          rows: [],
          rowCount: 0,
        }
      },
    }

    instrumentPg(client)

    await runWithQueryLog(async () => {
      const sql = 'delete from users where id = $1'
      const params = [1]

      logQuery(sql, params)
      await client.query({ text: sql, values: params })

      expect(getQueryLog()[0]?.rowCount).toBe(0)
    })
  })
})
