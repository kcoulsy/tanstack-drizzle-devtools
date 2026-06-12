import { describe, expect, it } from 'vitest'

import {
  resolveSourceFromStack,
  shortenPath,
} from './query-meta.ts'

describe('shortenPath', () => {
  it('keeps project src paths', () => {
    expect(
      shortenPath(
        'C:/Users/krist/projects/tanstack-drizzle-devtools/src/routes/index.tsx',
      ),
    ).toBe('src/routes/index.tsx')
  })

  it('does not treat drizzle-orm src as project src', () => {
    expect(
      shortenPath(
        'C:/Users/krist/projects/app/node_modules/drizzle-orm/src/query-promise.ts',
      ),
    ).toBe('drizzle-orm/query-promise.ts')
  })
})

describe('resolveSourceFromStack', () => {
  it('prefers route files over drizzle internals', () => {
    const stack = `Error
    at logQuery (src/server/logging/query-log.ts:35:5)
    at BetterSQLiteSession.all (node_modules/drizzle-orm/better-sqlite3/session.js:78:17)
    at QueryPromise.execute (node_modules/drizzle-orm/src/query-promise.ts:31:17)
    at getProjectsPageData (src/routes/index.tsx:20:31)
    at handler (node_modules/@tanstack/react-start/dist/server-fn.js:10:5)`

    expect(resolveSourceFromStack(stack)).toEqual({
      file: 'src/routes/index.tsx',
      line: 20,
    })
  })

  it('ignores dependency src paths when no route frame exists', () => {
    const stack = `Error
    at logQuery (src/server/logging/query-log.ts:35:5)
    at QueryPromise.execute (node_modules/drizzle-orm/src/query-promise.ts:31:17)`

    expect(resolveSourceFromStack(stack)).toBeUndefined()
  })

  it('prefers the query file over the route loader', () => {
    const stack = `Error
    at pushPendingSource (src/server/logging/query-log.ts:23:5)
    at Proxy.select (src/server/instrument/drizzle.ts:29:11)
    at getBlogPageData (src/data/blog.ts:14:33)
    at handler (node_modules/@tanstack/react-start/dist/server-fn.js:10:5)
    at loader (src/routes/blog.tsx:6:16)`

    expect(resolveSourceFromStack(stack)).toEqual({
      file: 'src/data/blog.ts',
      line: 14,
    })
  })
})
