# tanstack-drizzle-devtools

![Drizzle query log in TanStack Devtools, with N+1 and duplicate queries highlighted](../../docs/assets/drizzle-devtools-panel.png)

Request-scoped Drizzle query logging for TanStack Start. See every SQL statement that ran for the current page — in the TanStack Devtools panel, with timing, row counts, duplicate detection, and clickable source links.

Development only. Nothing is logged or shipped in production builds.

## Requirements

- [TanStack Start](https://tanstack.com/start)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Devtools](https://tanstack.com/devtools) (`@tanstack/react-devtools` + `@tanstack/devtools-vite`)

Driver instrumentation is included for `better-sqlite3`, `pg` (`node-postgres`), and `mysql2`. Without it, the Drizzle logger still records SQL and params, but duration, row counts, and payload sizes stay empty.

## Install

```bash
npm i -D tanstack-drizzle-devtools
```

Peer dependencies you should already have in a TanStack Start + Drizzle app:

```bash
npm i @tanstack/react-start drizzle-orm
npm i -D @tanstack/react-devtools @tanstack/devtools-vite @tanstack/devtools-event-client
```

## Integration

### 1. Register middleware in `src/start.ts`

Request middleware captures queries during SSR and injects them into the initial HTML. Function middleware sends queries to the client after every server-function RPC — route loaders, button clicks, and mutations alike.

```ts
import { createStart } from '@tanstack/react-start'
import {
  createQueryLogFunctionMiddleware,
  createQueryLogMiddleware,
} from 'tanstack-drizzle-devtools/server'

const devtoolsOptions = {
  enabled: process.env.NODE_ENV === 'development',
  alertOnNPlusOne: true, // optional: browser alert when N+1 is detected
}

export const startInstance = createStart(() => ({
  requestMiddleware: [createQueryLogMiddleware(devtoolsOptions)],
  functionMiddleware: [createQueryLogFunctionMiddleware(devtoolsOptions)],
}))
```

### 2. Attach the Drizzle logger and driver instrumentation

Enable the logger in development, wrap the native driver for timing/row metadata, and wrap the Drizzle instance so source links point at your app code instead of Drizzle internals.

**SQLite (`better-sqlite3`)**

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import {
  createDrizzleQueryLogger,
  instrumentDatabase,
  instrumentDrizzleDb,
} from 'tanstack-drizzle-devtools/server'

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
```

**PostgreSQL (`pg`)**

```ts
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  createDrizzleQueryLogger,
  instrumentDrizzleDb,
  instrumentPg,
} from 'tanstack-drizzle-devtools/server'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV === 'development') {
  instrumentPg(pool)
}

const drizzleDb = drizzle(pool, {
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
```

**MySQL (`mysql2`)**

```ts
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import {
  createDrizzleQueryLogger,
  instrumentDrizzleDb,
  instrumentMysql,
} from 'tanstack-drizzle-devtools/server'

const pool = mysql.createPool(process.env.DATABASE_URL!)

if (process.env.NODE_ENV === 'development') {
  instrumentMysql(pool)
}

const drizzleDb = drizzle(pool, {
  schema,
  mode: 'default',
  logger:
    process.env.NODE_ENV === 'development'
      ? createDrizzleQueryLogger()
      : false,
})

export const db =
  process.env.NODE_ENV === 'development'
    ? instrumentDrizzleDb(drizzleDb)
    : drizzleDb
```

### 3. Add the TanStack Devtools plugin

In your root route shell, mount the bootstrap component and register the Drizzle panel as a devtools plugin. Keep `TanStackDevtools` outside any `isDev` wrapper — `@tanstack/devtools-vite` strips conditional JSX and can break production builds.

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  DrizzleDevtoolsPanel,
  DrizzleQueryBootstrap,
  DrizzleQueryRouterSync,
} from 'tanstack-drizzle-devtools/client'

const isDev = import.meta.env.DEV

const devtoolsPlugins = [
  // ...your other plugins
  {
    id: 'drizzle-devtools',
    name: 'Drizzle',
    render: <DrizzleDevtoolsPanel />,
  },
]

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>{/* ... */}</head>
      <body>
        {children}
        {isDev && <DrizzleQueryBootstrap />}
        {isDev && <DrizzleQueryRouterSync />}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={devtoolsPlugins}
        />
        <Scripts />
      </body>
    </html>
  )
}
```

Define the `devtoolsPlugins` array at module scope so the plugin list is not recreated on every render.

### 4. Enable the Vite devtools plugin

Required for “open in editor” links on query source locations.

```ts
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    devtools({
      // Recommended: avoids server↔client console piping feedback loops.
      consolePiping: { enabled: false },
    }),
    tanstackStart(),
    // ...
  ],
})
```

## Usage

1. Run your app in development (`npm run dev`).
2. Open TanStack Devtools (bottom-right by default).
3. Select the **Drizzle** tab.

The panel shows queries for the **current page view**:

- **Full page load** — queries are injected into the HTML and picked up on hydration.
- **Client-side navigation** — queries from the route loader’s server function are pushed automatically; the log resets when the route changes.
- **Direct server-function calls** — mutations, refetches, or any `createServerFn` invoked from a button or event handler append to the log on the same route without navigating.

Navigate between routes and the log resets to reflect only what ran for the new page. Server-function calls on the same route keep appending.

### Panel features

- Syntax-highlighted SQL with bound parameters
- Summary: total statements, duplicates, unique count
- Sort by order, duration, or SQL text
- Filter to duplicated queries only
- Per-query: read/write badge, row count, payload size, duration, source file link
- Copy SQL to clipboard

## How it works

Queries are collected in an `AsyncLocalStorage` store for the lifetime of each server request or server-function call. The Drizzle `logger` hook records SQL; optional SQLite instrumentation enriches entries with timing and row metadata.

| Path | Mechanism |
| --- | --- |
| SSR / document request | `createQueryLogMiddleware` injects `window.__DB_QUERIES__` into the HTML; `DrizzleQueryBootstrap` reads it on the client |
| Client navigation | `createQueryLogFunctionMiddleware` returns the query log via `sendContext`; `DrizzleQueryRouterSync` clears the log on route change; loader queries append |
| Same-route server fn | Same function middleware path; queries append to the current page log (no route change) |

The panel subscribes to `queries-update` events. `DrizzleQueryRouterSync` resets the log on navigation; server-function RPC batches append on the same route. Use the **Preserve** checkbox to accumulate queries across navigations while debugging.

## API

### Server (`tanstack-drizzle-devtools/server`)

| Export | Description |
| --- | --- |
| `createQueryLogMiddleware()` | Request middleware — ALS scope + HTML injection |
| `createQueryLogFunctionMiddleware()` | Server-function middleware — pushes queries after every server-fn RPC |
| `createDrizzleQueryLogger()` | Drizzle `Logger` implementation |
| `instrumentDrizzleDb(db)` | Wraps Drizzle instance for accurate source links |
| `instrumentDatabase(db)` | Wraps `better-sqlite3` `Database` for timing / row count / size |
| `instrumentSqlite(db)` | Alias for `instrumentDatabase` |
| `instrumentPg(client)` | Wraps `pg` `Pool` / `Client` for timing / row count / size |
| `instrumentMysql(client)` | Wraps `mysql2` `Pool` / `Connection` for timing / row count / size |

Both middleware factories accept `QueryLogMiddlewareOptions`:

| Option | Default | Description |
| --- | --- | --- |
| `enabled` | `NODE_ENV === 'development'` | Turn query logging on or off |
| `alertOnNPlusOne` | `false` | When enabled, shows a blocking browser `alert()` whenever a published query batch contains detected N+1 patterns |

Pass the same options object to both middleware factories. Alerts fire once per query batch (typically each page load, navigation, or server-function call).

### Client (`tanstack-drizzle-devtools/client`)

| Export | Description |
| --- | --- |
| `DrizzleDevtoolsPanel` | TanStack Devtools plugin panel |
| `DrizzleQueryBootstrap` | Reads initial SSR query payload; mount once in your root shell |
| `DrizzleQueryRouterSync` | Clears the query log on route navigation; mount in your root shell |

## Limitations

- **Development only** — disable via `enabled: false` or `NODE_ENV` checks.
- **Per-navigation scope** — the log resets when you navigate (`DrizzleQueryRouterSync`); same-route server-function calls append instead. Uncheck **Preserve** in the panel to replace batches manually.
- **Source locations** — stack traces often point at Drizzle internals (`query-promise.ts`) because server functions are bundled; route files are preferred when present in the stack.
- **Driver coverage** — instrumentation ships for `better-sqlite3`, `pg`, and `mysql2`; other drivers still work with the logger alone.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for setup, workflow, and pull request guidelines.

## License

[MIT](../../LICENSE)

## Acknowledgments

Inspired by [PHP Debug Bar](https://php-debugbar.com/), the in-browser debug bar for PHP applications.
