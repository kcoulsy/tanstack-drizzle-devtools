import { useEffect, useState } from 'react'

import { drizzleDevtoolsClient } from './event-client.ts'
import type { QueryLogEntry } from '../types.ts'

export function DrizzleDevtoolsPanel() {
  const [queries, setQueries] = useState<QueryLogEntry[]>([])

  useEffect(() => {
    const cleanup = drizzleDevtoolsClient.on('queries-update', (event) => {
      setQueries(event.payload.queries)
    })

    return cleanup
  }, [])

  if (queries.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No queries on this page load
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-sm font-medium text-gray-700">
        {queries.length} {queries.length === 1 ? 'query' : 'queries'} on this
        page load
      </div>
      <ul className="flex flex-col gap-2">
        {queries.map((query, index) => (
          <li
            key={`${query.timestamp}-${index}`}
            className="rounded border border-gray-200 bg-gray-50 p-3 text-xs"
          >
            <div className="mb-1 font-mono text-gray-900">{query.sql}</div>
            {query.params.length > 0 && (
              <div className="mb-1 text-gray-600">
                params: {JSON.stringify(query.params)}
              </div>
            )}
            <div className="text-gray-400">
              {new Date(query.timestamp).toLocaleTimeString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
