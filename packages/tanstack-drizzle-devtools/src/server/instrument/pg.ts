import type {
  Client,
  Pool,
  PoolClient,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg'

import { completeQuery } from '../logging/query-log.ts'
import { estimateResultSize } from './shared.ts'

export type PgClient = Pool | PoolClient | Client

type PgQueryCallback<R extends QueryResultRow = QueryResultRow> = (
  error: Error | undefined,
  result: QueryResult<R>,
) => void

type PgQuery = PgClient['query']

export function instrumentPg<T extends PgClient>(client: T): T {
  const originalQuery = client.query.bind(client) as PgQuery

  const instrumentedQuery = ((...args: unknown[]) => {
    const parsed = parsePgQueryArgs(args)
    const start = performance.now()

    const finish = (result: QueryResult) => {
      completeQuery({
        sql: parsed.sql,
        params: parsed.params,
        durationMs: performance.now() - start,
        rowCount: result.rowCount ?? undefined,
        sizeBytes: estimateResultSize(result.rows),
      })

      return result
    }

    if (parsed.callbackIndex !== -1) {
      const callback = args[parsed.callbackIndex] as PgQueryCallback
      args[parsed.callbackIndex] = (
        error: Error | undefined,
        result: QueryResult,
      ) => {
        if (!error) {
          finish(result)
        }

        callback(error, result)
      }

      return originalQuery.apply(
        client,
        args as Parameters<PgQuery>,
      ) as ReturnType<PgQuery>
    }

    const result = originalQuery.apply(
      client,
      args as Parameters<PgQuery>,
    ) as ReturnType<PgQuery>

    if (isThenable(result)) {
      return result.then((value) => {
        if (isQueryResult(value)) {
          return finish(value)
        }

        return value
      }) as ReturnType<PgQuery>
    }

    return result
  }) as PgQuery

  client.query = instrumentedQuery

  return client
}

function parsePgQueryArgs(args: unknown[]) {
  if (typeof args[0] === 'string') {
    const callbackIndex = typeof args[2] === 'function' ? 2 : -1

    return {
      sql: args[0],
      params: (args[1] as unknown[] | undefined) ?? [],
      callbackIndex,
    }
  }

  const config = args[0] as QueryConfig
  const callbackIndex = typeof args[1] === 'function' ? 1 : -1

  return {
    sql: config.text ?? '',
    params: config.values ?? [],
    callbackIndex,
  }
}

function isQueryResult(value: unknown): value is QueryResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'rows' in value &&
    Array.isArray((value as QueryResult).rows)
  )
}

function isThenable<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}
