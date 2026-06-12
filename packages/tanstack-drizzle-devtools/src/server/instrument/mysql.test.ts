import { describe, expect, it } from 'vitest'

import { getQueryLog, logQuery, runWithQueryLog } from '../logging/query-log.ts'
import { instrumentMysql } from './mysql.ts'

describe('instrumentMysql', () => {
  it('records row count for select queries', async () => {
    const client = {
      async query(sql: string, params: unknown[] = []) {
        return [[{ id: 1 }, { id: 2 }], []]
      },
    }

    instrumentMysql(client)

    await runWithQueryLog(async () => {
      logQuery('select * from users', [])
      await client.query('select * from users')

      const queries = getQueryLog()
      expect(queries).toHaveLength(1)
      expect(queries[0]?.rowCount).toBe(2)
      expect(queries[0]?.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  it('records affected rows for write queries', async () => {
    const client = {
      async query(sql: string, params: unknown[] = []) {
        return [{ affectedRows: 3, insertId: 0 }, []]
      },
    }

    instrumentMysql(client)

    await runWithQueryLog(async () => {
      logQuery('delete from users where id = ?', [1])
      await client.query('delete from users where id = ?', [1])

      expect(getQueryLog()[0]?.rowCount).toBe(3)
    })
  })
})
