import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import { createDrizzleQueryLogger } from './drizzle-logger.ts'
import { instrumentDrizzleDb } from './instrument-drizzle.ts'
import { getQueryLog, runWithQueryLog } from './query-log.ts'

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name'),
})

describe('instrumentDrizzleDb', () => {
  it('records the application callsite instead of drizzle internals', async () => {
    const sqlite = new Database(':memory:')
    sqlite.exec('create table users (id integer primary key, name text)')

    const db = instrumentDrizzleDb(
      drizzle(sqlite, {
        schema: { users },
        logger: createDrizzleQueryLogger(),
      }),
    )

    function loadUsersFromFixture() {
      db.select().from(users).all()
    }

    const queries = runWithQueryLog(() => {
      loadUsersFromFixture()
      return getQueryLog()
    })
    expect(queries).toHaveLength(1)

    const source = queries[0]?.source
    expect(source).toBeDefined()
    expect(source?.file).not.toBe('src/query-promise.ts')
    expect(source?.file).not.toContain('query-promise')
  })
})
