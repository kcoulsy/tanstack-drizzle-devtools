import type { Logger } from 'drizzle-orm/logger'

import { logQuery } from './query-log.ts'

class DrizzleQueryLogger implements Logger {
  logQuery(query: string, params: unknown[]) {
    logQuery(query, params)
  }
}

export function createDrizzleQueryLogger() {
  return new DrizzleQueryLogger()
}
