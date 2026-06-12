import type {
  Connection,
  Pool,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise'

import { completeQuery } from '../logging/query-log.ts'
import { estimateResultSize } from './shared.ts'

export type MysqlClient = Pool | Connection

type MysqlQueryResult = [
  RowDataPacket[] | RowDataPacket[][] | ResultSetHeader | ResultSetHeader[],
  unknown,
]

export function instrumentMysql<T extends MysqlClient>(client: T): T {
  const originalQuery = client.query.bind(client)

  client.query = ((...args: unknown[]) => {
    const parsed = parseMysqlQueryArgs(args)
    const start = performance.now()

    const finish = (result: MysqlQueryResult) => {
      const meta = getMysqlMeta(result[0])

      completeQuery({
        sql: parsed.sql,
        params: parsed.params,
        durationMs: performance.now() - start,
        rowCount: meta.rowCount,
        sizeBytes: meta.sizeBytes,
      })

      return result
    }

    const result = originalQuery(...(args as Parameters<typeof originalQuery>))

    if (isThenable(result)) {
      return result.then(finish)
    }

    return result
  }) as T['query']

  return client
}

function parseMysqlQueryArgs(args: unknown[]) {
  if (typeof args[0] === 'string') {
    return {
      sql: args[0],
      params: normalizeMysqlParams(args[1]),
    }
  }

  const config = args[0] as { sql: string; values?: unknown }

  return {
    sql: config.sql,
    params: normalizeMysqlParams(config.values),
  }
}

function normalizeMysqlParams(value: unknown) {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function getMysqlMeta(rows: MysqlQueryResult[0]) {
  if (Array.isArray(rows)) {
    return {
      rowCount: rows.length,
      sizeBytes: estimateResultSize(rows),
    }
  }

  if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
    const header = rows as ResultSetHeader

    return {
      rowCount: header.affectedRows,
      sizeBytes: estimateResultSize(rows),
    }
  }

  return {
    rowCount: 0,
    sizeBytes: 0,
  }
}

function isThenable<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}
