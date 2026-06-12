import { createMiddleware } from '@tanstack/react-start'

import { createFunctionClientMiddleware } from './middleware/function-client.ts'

export { QUERY_LOG_SEND_CONTEXT_KEY } from './middleware/function-client.ts'

export function createDrizzleQueryLogger() {
  return {
    logQuery() {},
  }
}

export function createQueryLogFunctionMiddleware(options?: { enabled?: boolean }) {
  return createMiddleware({ type: 'function' }).client(
    createFunctionClientMiddleware(options),
  )
}

export function createQueryLogMiddleware() {
  return createMiddleware().server(async ({ next }) => next())
}

export function instrumentDatabase<T>(db: T): T {
  return db
}

export function instrumentDrizzleDb<T>(db: T): T {
  return db
}

export function instrumentSqlite<T>(db: T): T {
  return db
}
