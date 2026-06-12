import { captureSource } from '../logging/query-meta.ts'
import { pushPendingSource } from '../logging/query-log.ts'

const QUERY_START_METHODS = new Set([
  'select',
  'selectDistinct',
  'insert',
  'update',
  'delete',
  'run',
  'execute',
])

export function instrumentDrizzleDb<T>(db: T): T {
  return createInstrumentedDbProxy(db)
}

function createInstrumentedDbProxy<T extends object>(db: T): T {
  return new Proxy(db, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (
        typeof prop === 'string' &&
        QUERY_START_METHODS.has(prop) &&
        typeof value === 'function'
      ) {
        return (...args: unknown[]) => {
          pushPendingSource(captureSource())
          return value.apply(target, args)
        }
      }

      if (prop === 'transaction' && typeof value === 'function') {
        return (fn: (tx: T) => unknown, config?: unknown) =>
          value.call(
            target,
            (tx: T) => fn(createInstrumentedDbProxy(tx)),
            config,
          )
      }

      return value
    },
  }) as T
}
