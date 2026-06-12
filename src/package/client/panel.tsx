import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  FileCode,
  HardDrive,
  Pencil,
  Rows3,
  Search,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { drizzleDevtoolsClient } from './event-client.ts'
import { formatBytes, formatDuration } from './format.ts'
import { HighlightedSql } from './highlight-sql.tsx'
import { openInEditor } from './open-in-editor.ts'
import { getCachedQueries, readQueriesFromWindow } from './query-cache.ts'
import {
  buildQueryList,
  filterQueries,
  getQueryStats,
  sortQueries,
} from './query-utils.ts'
import {
  getPanelTheme,
  useTanStackDevtoolsTheme,
  type PanelTheme,
} from './theme.ts'
import type { QueryLogEntry, QuerySortOption } from '../types.ts'

const SORT_OPTIONS: Array<{ value: QuerySortOption; label: string }> = [
  { value: 'order', label: 'Order' },
  { value: 'duration-desc', label: 'Slowest first' },
  { value: 'duration-asc', label: 'Fastest first' },
  { value: 'sql-asc', label: 'SQL A–Z' },
]

function loadInitialQueries() {
  if (typeof window !== 'undefined' && window.__DB_QUERIES__) {
    return readQueriesFromWindow()
  }

  return getCachedQueries()
}

export function DrizzleDevtoolsPanel({ theme: themeProp }: { theme?: PanelTheme }) {
  const devtoolsTheme = useTanStackDevtoolsTheme()
  const theme = themeProp ?? devtoolsTheme
  const colors = getPanelTheme(theme)
  const [queries, setQueries] = useState<QueryLogEntry[]>(loadInitialQueries)
  const [sort, setSort] = useState<QuerySortOption>('order')
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false)
  const [showOnlyNPlusOne, setShowOnlyNPlusOne] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    const cached = loadInitialQueries()
    if (cached.length > 0) {
      setQueries(cached)
    }

    const cleanup = drizzleDevtoolsClient.on('queries-update', (event) => {
      setQueries(event.payload.queries)
      setShowOnlyDuplicates(false)
    })

    return cleanup
  }, [])

  const items = useMemo(() => buildQueryList(queries), [queries])
  const stats = useMemo(() => getQueryStats(items), [items])
  const visibleItems = useMemo(
    () =>
      sortQueries(
        filterQueries(items, { showOnlyDuplicates, showOnlyNPlusOne }),
        sort,
      ),
    [items, showOnlyDuplicates, showOnlyNPlusOne, sort],
  )

  const copyQuery = async (query: QueryLogEntry, index: number) => {
    const text =
      query.params.length > 0
        ? `${query.sql}\n\n-- params: ${JSON.stringify(query.params)}`
        : query.sql

    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1200)
  }

  if (queries.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 13,
          color: colors.textMuted,
          background: colors.bg,
          height: '100%',
        }}
      >
        No queries on this page load
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: colors.bg,
        color: colors.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          flex: '1 1 0',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.bgMuted,
            fontSize: 12,
          }}
        >
          <div style={{ lineHeight: 1.5 }}>
            <span>
              {stats.total} {stats.total === 1 ? 'statement' : 'statements'}{' '}
              were executed
            </span>
            {(stats.duplicates > 0 || stats.nPlusOne > 0) && (
              <span style={{ color: colors.textMuted }}>
                {stats.duplicates > 0 && (
                  <>
                    {', '}
                    {stats.duplicates} of which{' '}
                    {stats.duplicates === 1 ? 'was' : 'were'} duplicates,{' '}
                    {stats.unique} unique.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowOnlyDuplicates((value) => !value)
                        setShowOnlyNPlusOne(false)
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: colors.link,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: showOnlyDuplicates
                          ? 'underline'
                          : 'none',
                      }}
                    >
                      {showOnlyDuplicates ? 'Show all' : 'Show only duplicated'}
                    </button>
                  </>
                )}
                {stats.nPlusOne > 0 && (
                  <>
                    {stats.duplicates > 0 ? ' ' : ', '}
                    <span style={{ color: colors.nPlusOne }}>
                      {stats.nPlusOne}{' '}
                      {stats.nPlusOne === 1 ? 'looks' : 'look'} like N+1
                      {stats.nPlusOneGroups > 1
                        ? ` (${stats.nPlusOneGroups} patterns)`
                        : ''}
                      .
                    </span>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowOnlyNPlusOne((value) => !value)
                        setShowOnlyDuplicates(false)
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: colors.link,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: showOnlyNPlusOne ? 'underline' : 'none',
                      }}
                    >
                      {showOnlyNPlusOne ? 'Show all' : 'Show only N+1'}
                    </button>
                  </>
                )}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <span style={{ color: colors.textMuted }}>
              {formatBytes(stats.totalSizeBytes)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: colors.textMuted,
              }}
            >
              <Clock size={12} />
              {formatDuration(stats.totalDurationMs)}
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: colors.textMuted,
              }}
            >
              Sort
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as QuerySortOption)
                }
                style={{
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  padding: '2px 6px',
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div
            style={{
              padding: 16,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            No matching queries on this page load
          </div>
        ) : (
          visibleItems.map((query) => (
            <div
              key={`${query.index}-${query.timestamp}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                padding: '10px 12px',
                borderBottom: `1px solid ${colors.border}`,
                background: query.isNPlusOne
                  ? colors.bgNPlusOne
                  : query.isDuplicate
                    ? colors.bgDuplicate
                    : colors.bg,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <HighlightedSql sql={query.sql} theme={theme} />
                {query.params.length > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: colors.textMuted,
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    params: {JSON.stringify(query.params)}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  flexShrink: 0,
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                <button
                  type="button"
                  onClick={() => copyQuery(query, query.index)}
                  title="Copy SQL"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    background: colors.bgMuted,
                    color: colors.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  {copiedIndex === query.index ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>

                {query.isNPlusOne && (
                  <MetaItem
                    icon={<AlertTriangle size={12} />}
                    label={`N+1 ×${query.nPlusOneGroupSize}`}
                    color={colors.nPlusOne}
                    title="Same SQL repeated with different params — likely an N+1 query"
                  />
                )}
                <MetaItem
                  icon={
                    query.kind === 'read' ? (
                      <Search size={12} />
                    ) : (
                      <Pencil size={12} />
                    )
                  }
                  label={query.kind}
                  color={query.kind === 'read' ? colors.read : colors.write}
                />
                <MetaItem
                  icon={<Rows3 size={12} />}
                  label={String(query.rowCount ?? 0)}
                />
                <MetaItem
                  icon={<HardDrive size={12} />}
                  label={formatBytes(query.sizeBytes)}
                />
                <MetaItem
                  icon={<Clock size={12} />}
                  label={formatDuration(query.durationMs)}
                />
                {query.source && (
                  <MetaItem
                    icon={<FileCode size={12} />}
                    label={`${query.source.file}:${query.source.line}`}
                    title={`Open ${query.source.file}:${query.source.line} in editor`}
                    color={colors.link}
                    onClick={() => openInEditor(query.source!)}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MetaItem({
  icon,
  label,
  color,
  title,
  onClick,
  style,
}: {
  icon: ReactNode
  label: string
  color?: string
  title?: string
  onClick?: () => void
  style?: CSSProperties
}) {
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      title={title ?? label}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
        color,
        border: 'none',
        background: 'transparent',
        padding: 0,
        font: 'inherit',
        ...style,
      }}
    >
      {icon}
      {label}
    </Component>
  )
}
