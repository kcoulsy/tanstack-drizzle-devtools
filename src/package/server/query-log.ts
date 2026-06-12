import { AsyncLocalStorage } from 'node:async_hooks'

import type { QueryLogEntry } from '../types.ts'

const storage = new AsyncLocalStorage<QueryLogEntry[]>()

export function runWithQueryLog<T>(fn: () => T | Promise<T>) {
  return storage.run([], fn)
}

export function logQuery(sql: string, params: unknown[]) {
  storage.getStore()?.push({
    sql,
    params,
    timestamp: Date.now(),
  })
}

export function getQueryLog(): QueryLogEntry[] {
  return storage.getStore() ?? []
}
