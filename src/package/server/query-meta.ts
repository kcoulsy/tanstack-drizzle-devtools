import type { QueryKind, QuerySource } from '../types.ts'

const INFRASTRUCTURE_PATTERNS = [
  'drizzle-orm',
  'sqlite-core',
  'query-builders',
  'better-sqlite3',
  'package/server',
  'query-log',
  'drizzle-logger',
  'instrument-sqlite',
  'node:internal',
  'node:async_hooks',
  '@tanstack/react-start',
  '@tanstack/start-server-core',
]

export function getQueryKind(sql: string): QueryKind {
  const normalized = sql.trim().toLowerCase()

  if (
    normalized.startsWith('select') ||
    normalized.startsWith('with') ||
    normalized.startsWith('pragma')
  ) {
    return 'read'
  }

  return 'write'
}

export function estimateQuerySize(sql: string, params: unknown[]) {
  return new TextEncoder().encode(sql + JSON.stringify(params)).byteLength
}

export function captureSource(): QuerySource | undefined {
  const stack = new Error().stack
  if (!stack) {
    return undefined
  }

  const frames: QuerySource[] = []

  for (const line of stack.split('\n').slice(2)) {
    const normalizedLine = line.replace(/\\/g, '/')
    const match =
      normalizedLine.match(/\(([^)]+):(\d+):\d+\)/) ??
      normalizedLine.match(/at ([^ ]+):(\d+):\d+/)

    if (!match) {
      continue
    }

    const file = shortenPath(match[1])
    const lineNumber = Number.parseInt(match[2], 10)

    if (!file || Number.isNaN(lineNumber)) {
      continue
    }

    frames.push({ file, line: lineNumber })
  }

  const isInfrastructure = (file: string) =>
    INFRASTRUCTURE_PATTERNS.some((pattern) => file.includes(pattern))

  return (
    frames.find(
      (frame) =>
        frame.file.startsWith('src/routes/') ||
        frame.file.startsWith('src/db/'),
    ) ??
    frames.find((frame) => !isInfrastructure(frame.file)) ??
    frames[0]
  )
}

function shortenPath(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/')
  const srcIndex = normalized.lastIndexOf('/src/')

  if (srcIndex !== -1) {
    return normalized.slice(srcIndex + 1)
  }

  const distIndex = normalized.lastIndexOf('/dist/server/')
  if (distIndex !== -1) {
    return normalized.slice(distIndex + '/dist/'.length)
  }

  const segments = normalized.split('/')
  return segments.slice(-2).join('/')
}
