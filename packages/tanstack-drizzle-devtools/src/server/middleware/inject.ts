import type { QueryLogEntry } from '../../types.ts'

export function injectQueryScript(html: string, queries: QueryLogEntry[]) {
  const script = `<script>window.__DB_QUERIES__=${JSON.stringify(queries)}</script>`

  // Inject early so inline data is available before async module hydration.
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${script}`)
  }

  const bodyOpen = html.match(/<body[^>]*>/)
  if (bodyOpen) {
    return html.replace(bodyOpen[0], `${bodyOpen[0]}${script}`)
  }

  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`)
  }

  return html + script
}
