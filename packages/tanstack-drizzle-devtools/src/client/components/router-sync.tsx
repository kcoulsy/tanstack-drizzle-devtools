import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { publishQueriesToClient } from '../lib/publish-queries.ts'

function getLocationKey(location: {
  pathname: string
  search: unknown
  hash: string
}) {
  const search =
    typeof location.search === 'string'
      ? location.search
      : JSON.stringify(location.search)

  return `${location.pathname}${search}${location.hash}`
}

export function DrizzleQueryRouterSync() {
  const locationKey = useRouterState({
    select: (state) => getLocationKey(state.location),
  })
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    publishQueriesToClient([], { replace: true })
  }, [locationKey])

  return null
}
