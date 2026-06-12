import { useEffect, useState } from 'react'

export type PanelTheme = 'light' | 'dark'

function readTanStackDevtoolsTheme(): PanelTheme {
  if (typeof document === 'undefined') {
    return 'dark'
  }

  return document.documentElement.dataset.tanstackDevtoolsTheme === 'light'
    ? 'light'
    : 'dark'
}

export function useTanStackDevtoolsTheme(): PanelTheme {
  const [theme, setTheme] = useState<PanelTheme>(readTanStackDevtoolsTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(readTanStackDevtoolsTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tanstack-devtools-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return theme
}

export function getPanelTheme(theme?: PanelTheme) {
  const isDark = theme !== 'light'

  return {
    isDark,
    bg: isDark ? '#0b0d10' : '#ffffff',
    bgMuted: isDark ? '#111318' : '#f9fafb',
    bgDuplicate: isDark ? '#3d3520' : '#fef9c3',
    border: isDark ? '#292e3d' : '#eaecf0',
    text: isDark ? '#f2f4f7' : '#101828',
    textMuted: isDark ? '#98a2b3' : '#667085',
    textFaint: isDark ? '#667085' : '#98a2b3',
    accent: isDark ? '#53b1fd' : '#1570ef',
    accentMuted: isDark ? '#1849a9' : '#d1e9ff',
    read: isDark ? '#6ce9a6' : '#027a48',
    write: isDark ? '#fda29b' : '#b42318',
    keyword: isDark ? '#fda29b' : '#c2410c',
    string: isDark ? '#84caff' : '#1570ef',
    identifier: isDark ? '#f2f4f7' : '#101828',
    number: isDark ? '#6ce9a6' : '#027a48',
    link: isDark ? '#53b1fd' : '#1570ef',
  }
}
