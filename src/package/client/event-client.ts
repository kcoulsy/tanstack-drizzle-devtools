import { EventClient } from '@tanstack/devtools-event-client'

import type { QueryLogEntry } from '../types.ts'

type DrizzleDevtoolsEvents = {
  'queries-update': { queries: QueryLogEntry[]; replace?: boolean }
}

class DrizzleDevtoolsEventClient extends EventClient<DrizzleDevtoolsEvents> {
  constructor() {
    super({
      pluginId: 'drizzle-devtools',
    })
  }
}

export const drizzleDevtoolsClient = new DrizzleDevtoolsEventClient()
