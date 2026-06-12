import type { QueryLogEntry } from '../types.ts'

export function injectQueryScript(html: string, queries: QueryLogEntry[]) {
  const script = `<script>window.__DB_QUERIES__=${JSON.stringify(queries)}</script>`

  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`)
  }

  return html + script
}
