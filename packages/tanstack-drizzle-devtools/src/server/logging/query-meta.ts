import type { QueryKind, QuerySource } from '../../types.ts'

const INFRASTRUCTURE_PATTERNS = [
  'drizzle-orm',
  'sqlite-core',
  'pg-core',
  'mysql-core',
  'query-builders',
  'query-promise',
  'better-sqlite3',
  'server/logging',
  'server/instrument',
  'server/middleware',
  'query-log',
  'query-meta',
  'drizzle-logger',
  'instrument/sqlite',
  'instrument/pg',
  'instrument/mysql',
  'instrument/drizzle',
  'node-postgres',
  'mysql2',
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
  return resolveSourceFromStack(new Error().stack)
}

export function resolveSourceFromStack(
  stack: string | undefined,
): QuerySource | undefined {
  if (!stack) {
    return undefined
  }

  const frames = parseStackFrames(stack)
  const isInfrastructure = (file: string) =>
    INFRASTRUCTURE_PATTERNS.some((pattern) => file.includes(pattern))

  // Prefer the innermost application frame (closest to db.select()).
  return (
    frames.find(
      (frame) =>
        !isInfrastructure(frame.file) &&
        /\.(tsx?|jsx?|mjs|cjs)$/.test(frame.file),
    ) ?? frames.find((frame) => !isInfrastructure(frame.file))
  )
}

export function parseStackFrames(stack: string): QuerySource[] {
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

  return frames
}

export function shortenPath(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/')

  if (normalized.startsWith('src/')) {
    return normalized
  }

  const srcIndex = findProjectPathIndex(normalized, '/src/')

  if (srcIndex !== -1) {
    return normalized.slice(srcIndex + 1)
  }

  const distIndex = normalized.lastIndexOf('/dist/server/')
  if (distIndex !== -1 && !isDependencyPath(normalized)) {
    return normalized.slice(distIndex + '/dist/'.length)
  }

  if (isDependencyPath(normalized)) {
    return shortenDependencyPath(normalized)
  }

  const segments = normalized.split('/')
  return segments.slice(-2).join('/')
}

function shortenDependencyPath(path: string) {
  const nodeModulesIndex = path.lastIndexOf('/node_modules/')
  if (nodeModulesIndex === -1) {
    return path.split('/').slice(-2).join('/')
  }

  const packagePath = path.slice(nodeModulesIndex + '/node_modules/'.length)
  const segments = packagePath.split('/')
  const packageName = segments[0]?.startsWith('@')
    ? `${segments[0]}/${segments[1]}`
    : segments[0]
  const fileName = segments.at(-1)

  if (packageName && fileName) {
    return `${packageName}/${fileName}`
  }

  return segments.slice(-2).join('/')
}

function findProjectPathIndex(path: string, marker: string) {
  let index = path.indexOf(marker)

  while (index !== -1) {
    if (!isDependencyPath(path.slice(0, index))) {
      return index
    }

    index = path.indexOf(marker, index + 1)
  }

  return -1
}

function isDependencyPath(path: string) {
  return path.includes('/node_modules/')
}
