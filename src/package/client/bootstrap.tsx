import { useEffect } from 'react'

import { drizzleDevtoolsClient } from './event-client.ts'

export function DrizzleQueryBootstrap() {
  useEffect(() => {
    const queries = window.__DB_QUERIES__ ?? []

    drizzleDevtoolsClient.emit('queries-update', { queries })

    delete window.__DB_QUERIES__
  }, [])

  return null
}
