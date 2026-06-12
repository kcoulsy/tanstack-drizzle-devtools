import { createStart } from '@tanstack/react-start'

import {
  createQueryLogFunctionMiddleware,
  createQueryLogMiddleware,
} from 'tanstack-drizzle-devtools/server'

const devtoolsOptions = {
  enabled: process.env.NODE_ENV === 'development',
  alertOnNPlusOne: true,
}

export const startInstance = createStart(() => ({
  requestMiddleware: [createQueryLogMiddleware(devtoolsOptions)],
  functionMiddleware: [createQueryLogFunctionMiddleware(devtoolsOptions)],
}))
