export function formatDuration(durationMs: number) {
  if (durationMs < 1) {
    return `${Math.round(durationMs * 1000)}μs`
  }

  if (durationMs < 1000) {
    return `${durationMs < 10 ? durationMs.toFixed(1) : Math.round(durationMs)}ms`
  }

  return `${(durationMs / 1000).toFixed(2)}s`
}

export function formatBytes(bytes: number) {
  if (bytes === 0) {
    return '0B'
  }

  if (bytes < 1024) {
    return `${bytes}B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
