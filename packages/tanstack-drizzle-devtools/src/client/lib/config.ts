export type DrizzleDevtoolsConfig = {
  alertOnNPlusOne?: boolean
}

let config: DrizzleDevtoolsConfig = {}

export function configureDrizzleDevtools(options: DrizzleDevtoolsConfig) {
  config = { ...config, ...options }
}

export function getDrizzleDevtoolsConfig() {
  return config
}
