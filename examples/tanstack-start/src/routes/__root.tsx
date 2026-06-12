import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import {
  DrizzleDevtoolsPanel,
  DrizzleQueryBootstrap,
} from '@tanstack/drizzle-devtools/client'

import appCss from '../styles.css?url'

const isDev = import.meta.env.DEV

const devtoolsPlugins = [
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />,
  },
  {
    id: 'drizzle-devtools',
    name: 'Drizzle',
    render: <DrizzleDevtoolsPanel />,
  },
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <nav className="flex gap-4 border-b border-gray-200 bg-white px-8 py-3 text-sm">
          <Link
            to="/"
            className="font-medium text-gray-700 hover:text-gray-900 [&.active]:text-blue-600"
            activeOptions={{ exact: true }}
          >
            Projects
          </Link>
          <Link
            to="/blog"
            className="font-medium text-gray-700 hover:text-gray-900 [&.active]:text-blue-600"
          >
            Blog
          </Link>
          <Link
            to="/n-plus-one"
            className="font-medium text-gray-700 hover:text-gray-900 [&.active]:text-blue-600"
          >
            N+1 example
          </Link>
        </nav>
        {children}
        {isDev && <DrizzleQueryBootstrap />}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={devtoolsPlugins}
        />
        <Scripts />
      </body>
    </html>
  )
}
