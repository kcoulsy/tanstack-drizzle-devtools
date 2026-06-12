import type { CSSProperties } from 'react'

import type { PanelTheme } from './theme.ts'
import { getPanelTheme } from './theme.ts'

const KEYWORDS = new Set([
  'select',
  'from',
  'where',
  'insert',
  'into',
  'values',
  'update',
  'set',
  'delete',
  'join',
  'inner',
  'left',
  'right',
  'outer',
  'on',
  'and',
  'or',
  'not',
  'in',
  'is',
  'null',
  'order',
  'by',
  'group',
  'having',
  'limit',
  'offset',
  'as',
  'create',
  'table',
  'index',
  'pragma',
  'with',
  'returning',
  'asc',
  'desc',
  'distinct',
  'case',
  'when',
  'then',
  'else',
  'end',
])

type Token = {
  type: 'keyword' | 'string' | 'number' | 'identifier' | 'punctuation' | 'whitespace'
  value: string
}

function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < sql.length) {
    const char = sql[index]

    if (/\s/.test(char)) {
      let value = char
      index += 1

      while (index < sql.length && /\s/.test(sql[index])) {
        value += sql[index]
        index += 1
      }

      tokens.push({ type: 'whitespace', value })
      continue
    }

    if (char === "'" || char === '"') {
      let value = char
      index += 1

      while (index < sql.length) {
        value += sql[index]

        if (sql[index] === char && sql[index - 1] !== '\\') {
          index += 1
          break
        }

        index += 1
      }

      tokens.push({ type: 'string', value })
      continue
    }

    if (/[0-9]/.test(char)) {
      let value = char
      index += 1

      while (index < sql.length && /[0-9.]/.test(sql[index])) {
        value += sql[index]
        index += 1
      }

      tokens.push({ type: 'number', value })
      continue
    }

    if (/[a-zA-Z_]/.test(char)) {
      let value = char
      index += 1

      while (index < sql.length && /[a-zA-Z0-9_$]/.test(sql[index])) {
        value += sql[index]
        index += 1
      }

      tokens.push({
        type: KEYWORDS.has(value.toLowerCase()) ? 'keyword' : 'identifier',
        value,
      })
      continue
    }

    tokens.push({ type: 'punctuation', value: char })
    index += 1
  }

  return tokens
}

export function HighlightedSql({
  sql,
  theme,
  style,
}: {
  sql: string
  theme?: PanelTheme
  style?: CSSProperties
}) {
  const colors = getPanelTheme(theme)
  const tokens = tokenizeSql(sql)

  const colorForToken = (token: Token) => {
    switch (token.type) {
      case 'keyword':
        return colors.keyword
      case 'string':
        return colors.string
      case 'number':
        return colors.number
      case 'identifier':
        return colors.identifier
      default:
        return colors.textMuted
    }
  }

  return (
    <code
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {tokens.map((token, index) => (
        <span key={`${index}-${token.value}`} style={{ color: colorForToken(token) }}>
          {token.value}
        </span>
      ))}
    </code>
  )
}
