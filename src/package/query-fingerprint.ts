export function getQueryFingerprint(sql: string, params: unknown[]) {
  return `${sql}\0${JSON.stringify(params)}`
}
