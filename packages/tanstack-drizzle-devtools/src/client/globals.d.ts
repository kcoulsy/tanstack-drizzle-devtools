import type { DrizzleDevtoolsConfig } from './lib/config.ts'
import type { QueryLogEntry } from '../types.ts'

declare global {
  interface Window {
    __DB_QUERIES__?: QueryLogEntry[]
    __DRIZZLE_DEVTOOLS_CONFIG__?: DrizzleDevtoolsConfig
  }
}

export {}
