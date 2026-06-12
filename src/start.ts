import { createStart } from '@tanstack/react-start'

import { createQueryLogFunctionMiddleware } from '#/package/server/function-middleware.ts'
import { createQueryLogMiddleware } from '#/package/server/middleware.ts'

const devtoolsEnabled = process.env.NODE_ENV === 'development'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createQueryLogMiddleware({
      enabled: devtoolsEnabled,
    }),
  ],
  functionMiddleware: [
    createQueryLogFunctionMiddleware({
      enabled: devtoolsEnabled,
    }),
  ],
}))
