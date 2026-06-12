import { createStart } from '@tanstack/react-start'

import { createQueryLogMiddleware } from '#/package/server/middleware.ts'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createQueryLogMiddleware({
      enabled: process.env.NODE_ENV === 'development',
    }),
  ],
}))
