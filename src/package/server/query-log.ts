import { AsyncLocalStorage } from 'node:async_hooks'

import {
  captureSource,
  estimateQuerySize,
  getQueryKind,
} from './query-meta.ts'
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
    durationMs: 0,
    kind: getQueryKind(sql),
    sizeBytes: estimateQuerySize(sql, params),
    source: captureSource(),
  })
}

export function completeQuery(meta: {
  durationMs: number
  rowCount?: number
  sizeBytes?: number
}) {
  const store = storage.getStore()
  const entry = store?.at(-1)

  if (!entry) {
    return
  }

  entry.durationMs = meta.durationMs

  if (meta.rowCount !== undefined) {
    entry.rowCount = meta.rowCount
  }

  if (meta.sizeBytes !== undefined) {
    entry.sizeBytes = meta.sizeBytes
  }
}

export function getQueryLog(): QueryLogEntry[] {
  return storage.getStore() ?? []
}
