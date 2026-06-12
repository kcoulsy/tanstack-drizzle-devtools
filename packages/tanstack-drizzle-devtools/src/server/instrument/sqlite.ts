import type Database from 'better-sqlite3'

import { completeQuery } from '../logging/query-log.ts'
import { estimateResultSize } from './shared.ts'

type SqliteStatement = ReturnType<Database.Database['prepare']>

export function instrumentDatabase(database: Database.Database) {
  const originalPrepare = database.prepare.bind(database)

  database.prepare = ((sql: string, ...args: unknown[]) => {
    const statement = originalPrepare(sql, ...args)
    return wrapStatement(statement, sql)
  }) as typeof database.prepare

  return database
}

/** Alias for {@link instrumentDatabase}. */
export const instrumentSqlite = instrumentDatabase

function wrapStatement(statement: SqliteStatement, sql: string) {
  wrapMethod(statement, 'run', (result) => ({
    rowCount: result.changes,
    sizeBytes: estimateResultSize(result),
  }))
  wrapMethod(statement, 'all', (rows) => ({
    rowCount: Array.isArray(rows) ? rows.length : 0,
    sizeBytes: estimateResultSize(rows),
  }))
  wrapMethod(statement, 'get', (row) => ({
    rowCount: row ? 1 : 0,
    sizeBytes: estimateResultSize(row),
  }))

  return statement
}

function wrapMethod<T>(
  statement: SqliteStatement,
  method: 'run' | 'all' | 'get',
  getMeta: (result: T) => { rowCount?: number; sizeBytes?: number },
) {
  const original = statement[method].bind(statement) as (
    ...args: unknown[]
  ) => T

  statement[method] = ((...args: unknown[]) => {
    const start = performance.now()
    const result = original(...args)
    const durationMs = performance.now() - start
    const meta = getMeta(result)

    completeQuery({
      durationMs,
      rowCount: meta.rowCount,
      sizeBytes: meta.sizeBytes,
    })

    return result
  }) as typeof statement[typeof method]
}

