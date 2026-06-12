import { AsyncLocalStorage } from 'node:async_hooks'

import { getQueryFingerprint } from '../../query-fingerprint.ts'
import {
  captureSource,
  estimateQuerySize,
  getQueryKind,
} from './query-meta.ts'
import type { QueryLogEntry, QuerySource } from '../../types.ts'

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
  sql?: string
  params?: unknown[]
  durationMs: number
  rowCount?: number
  sizeBytes?: number
}) {
  const store = storage.getStore()
  const entry =
    meta.sql !== undefined
      ? findIncompleteEntry(store?.entries, meta.sql, meta.params ?? [])
      : store?.entries.at(-1)

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

function findIncompleteEntry(
  entries: QueryLogEntry[] | undefined,
  sql: string,
  params: unknown[],
) {
  if (!entries) {
    return undefined
  }

  const fingerprint = getQueryFingerprint(sql, params)

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]

    if (
      entry.durationMs === 0 &&
      getQueryFingerprint(entry.sql, entry.params) === fingerprint
    ) {
      return entry
    }
  }

  return undefined
}
