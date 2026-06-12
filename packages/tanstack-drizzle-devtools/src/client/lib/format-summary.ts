import { formatBytes, formatDuration } from './format.ts'
import type { QueryListItem } from './query-utils.ts'
import type { getQueryStats } from './query-utils.ts'

type QueryStats = ReturnType<typeof getQueryStats>

function formatSource(item: QueryListItem) {
  if (!item.source) {
    return undefined
  }

  return `${item.source.file}:${item.source.line}`
}

function formatParams(params: unknown[]) {
  return JSON.stringify(params)
}

function groupByFingerprint(items: QueryListItem[]) {
  const groups = new Map<string, QueryListItem[]>()

  for (const item of items) {
    const group = groups.get(item.fingerprint) ?? []
    group.push(item)
    groups.set(item.fingerprint, group)
  }

  return groups
}

function groupNPlusOnePatterns(items: QueryListItem[]) {
  const patterns = new Map<string, QueryListItem[]>()

  for (const item of items) {
    if (!item.isNPlusOne) {
      continue
    }

    const group = patterns.get(item.sqlShape) ?? []
    group.push(item)
    patterns.set(item.sqlShape, group)
  }

  return [...patterns.values()]
}

function formatSampleParams(items: QueryListItem[], limit = 3) {
  const samples = items.slice(0, limit).map((item) => formatParams(item.params))

  if (items.length <= limit) {
    return samples.join(', ')
  }

  return `${samples.join(', ')} (+${items.length - limit} more)`
}

function formatNPlusOneSection(items: QueryListItem[]) {
  const patterns = groupNPlusOnePatterns(items)

  if (patterns.length === 0) {
    return ''
  }

  const lines = ['## N+1 patterns', '']

  for (const [index, group] of patterns.entries()) {
    const representative = group[0]!
    const totalDurationMs = group.reduce((sum, item) => sum + item.durationMs, 0)
    const source = formatSource(representative)

    lines.push(
      `### Pattern ${index + 1} (×${group.length}, ${formatDuration(totalDurationMs)} total)`,
      representative.sql,
      `- kind: ${representative.kind}`,
    )

    if (source) {
      lines.push(`- source: ${source}`)
    }

    lines.push(`- sample params: ${formatSampleParams(group)}`, '')
  }

  return lines.join('\n')
}

function formatExactDuplicatesSection(items: QueryListItem[]) {
  const fingerprintGroups = groupByFingerprint(items)
  const duplicateGroups = [...fingerprintGroups.values()].filter(
    (group) => group.length > 1 && !group[0]!.isNPlusOne,
  )

  if (duplicateGroups.length === 0) {
    return ''
  }

  const lines = ['## Exact duplicates (same SQL + params)', '']

  for (const group of duplicateGroups) {
    const representative = group[0]!
    const totalDurationMs = group.reduce((sum, item) => sum + item.durationMs, 0)

    lines.push(
      `### ×${group.length} (${formatDuration(totalDurationMs)} total)`,
      representative.sql,
      `- params: ${formatParams(representative.params)}`,
      '',
    )
  }

  return lines.join('\n')
}

function formatExecutionOrderSection(items: QueryListItem[]) {
  const seenNPlusOneShapes = new Set<string>()
  const seenDuplicateFingerprints = new Set<string>()
  const fingerprintCounts = new Map<string, number>()

  for (const item of items) {
    fingerprintCounts.set(
      item.fingerprint,
      (fingerprintCounts.get(item.fingerprint) ?? 0) + 1,
    )
  }

  const lines = ['## Queries by execution order', '']
  let displayIndex = 0

  for (const item of items) {
    if (item.isNPlusOne) {
      if (seenNPlusOneShapes.has(item.sqlShape)) {
        continue
      }

      seenNPlusOneShapes.add(item.sqlShape)
      displayIndex += 1

      lines.push(
        `### #${displayIndex} [N+1 ×${item.nPlusOneGroupSize}] ${formatDuration(item.durationMs)} · ${item.rowCount ?? 0} rows · ${formatBytes(item.sizeBytes)}`,
        item.sql,
      )

      if (item.params.length > 0) {
        lines.push(`params: ${formatParams(item.params)}`)
      }

      const source = formatSource(item)
      if (source) {
        lines.push(`source: ${source}`)
      }

      lines.push('')
      continue
    }

    const duplicateCount = fingerprintCounts.get(item.fingerprint) ?? 1

    if (duplicateCount > 1) {
      if (seenDuplicateFingerprints.has(item.fingerprint)) {
        continue
      }

      seenDuplicateFingerprints.add(item.fingerprint)
      displayIndex += 1

      lines.push(
        `### #${displayIndex} [duplicate ×${duplicateCount}] ${formatDuration(item.durationMs)} · ${item.rowCount ?? 0} rows · ${formatBytes(item.sizeBytes)}`,
        item.sql,
      )

      if (item.params.length > 0) {
        lines.push(`params: ${formatParams(item.params)}`)
      }

      const source = formatSource(item)
      if (source) {
        lines.push(`source: ${source}`)
      }

      lines.push('')
      continue
    }

    displayIndex += 1

    lines.push(
      `### #${displayIndex} [${item.kind}] ${formatDuration(item.durationMs)} · ${item.rowCount ?? 0} rows · ${formatBytes(item.sizeBytes)}`,
      item.sql,
    )

    if (item.params.length > 0) {
      lines.push(`params: ${formatParams(item.params)}`)
    }

    const source = formatSource(item)
    if (source) {
      lines.push(`source: ${source}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

export function formatQuerySummary(items: QueryListItem[], stats: QueryStats) {
  const sections = [
    '# Database query log — optimization review',
    '',
    'Please review these queries for N+1 issues, redundant fetches, missing indexes, and batching opportunities.',
    '',
    '## Overview',
    `- Total statements: ${stats.total}`,
    `- Unique (SQL + params): ${stats.unique}`,
    `- Duplicate executions: ${stats.duplicates}`,
    `- N+1 queries: ${stats.nPlusOne}${stats.nPlusOneGroups > 0 ? ` (${stats.nPlusOneGroups} ${stats.nPlusOneGroups === 1 ? 'pattern' : 'patterns'})` : ''}`,
    `- Total duration: ${formatDuration(stats.totalDurationMs)}`,
    `- Total payload: ${formatBytes(stats.totalSizeBytes)}`,
    '',
    formatNPlusOneSection(items),
    formatExactDuplicatesSection(items),
    formatExecutionOrderSection(items),
  ]

  return sections.filter((section) => section.length > 0).join('\n')
}
