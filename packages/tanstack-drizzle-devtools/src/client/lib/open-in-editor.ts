import type { QuerySource } from '../../types.ts'

/**
 * Opens a file in the local editor via TanStack Devtools Vite middleware.
 * @see https://github.com/TanStack/devtools/tree/main/packages/devtools-vite
 */
export function openInEditor(source: QuerySource) {
  const file = source.file.startsWith('/') ? source.file : `/${source.file}`
  const column = 1
  const path = `${file}:${source.line}:${column}`
  const url = new URL(
    `__tsd/open-source?source=${encodeURIComponent(path)}`,
    window.location.origin,
  )

  fetch(url).catch(() => {})
}
