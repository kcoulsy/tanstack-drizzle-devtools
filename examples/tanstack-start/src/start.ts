import { createStart } from '@tanstack/react-start'

import {
  createQueryLogFunctionMiddleware,
  createQueryLogMiddleware,
} from '@tanstack/drizzle-devtools/server'

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
