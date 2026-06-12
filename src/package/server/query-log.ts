import { AsyncLocalStorage } from 'node:async_hooks'

import {
  captureSource,
  estimateQuerySize,
  getQueryKind,
} from './query-meta.ts'
import type { QueryLogEntry, QuerySource } from '../types.ts'

type QueryLogStore = {
  entries: QueryLogEntry[]
  pendingSources: QuerySource[]
}

const storage = new AsyncLocalStorage<QueryLogStore>()

export function runWithQueryLog<T>(fn: () => T | Promise<T>) {
  return storage.run({ entries: [], pendingSources: [] }, fn)
}

export function pushPendingSource(source: QuerySource | undefined) {
  if (source) {
    storage.getStore()?.pendingSources.push(source)
  }
}

export function logQuery(sql: string, params: unknown[]) {
  const store = storage.getStore()
  if (!store) {
    return
  }

  const source = store.pendingSources.shift() ?? captureSource()

  store.entries.push({
    sql,
    params,
    timestamp: Date.now(),
    durationMs: 0,
    kind: getQueryKind(sql),
    sizeBytes: estimateQuerySize(sql, params),
    source,
  })
}

export function completeQuery(meta: {
  durationMs: number
  rowCount?: number
  sizeBytes?: number
}) {
  const store = storage.getStore()
  const entry = store?.entries.at(-1)

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
  return storage.getStore()?.entries ?? []
}
