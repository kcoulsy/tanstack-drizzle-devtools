import type { QueryLogEntry } from '../types.ts'

declare global {
  interface Window {
    __DB_QUERIES__?: QueryLogEntry[]
  }
}

export {}
