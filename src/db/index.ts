import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { createDrizzleQueryLogger } from '#/package/server/drizzle-logger.ts'
import { instrumentDrizzleDb } from '#/package/server/instrument-drizzle.ts'
import { instrumentDatabase } from '#/package/server/instrument-sqlite.ts'

import * as schema from './schema.ts'

const sqlite = new Database(process.env.DATABASE_URL!)

if (process.env.NODE_ENV === 'development') {
  instrumentDatabase(sqlite)
}

const drizzleDb = drizzle(sqlite, {
  schema,
  logger:
    process.env.NODE_ENV === 'development'
      ? createDrizzleQueryLogger()
      : false,
})

export const db =
  process.env.NODE_ENV === 'development'
    ? instrumentDrizzleDb(drizzleDb)
    : drizzleDb
