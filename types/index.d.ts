export type Meters = { context: number | null; fiveHour: number | null; sevenDay: number | null }

declare module 'claude-code' {
  interface PluginState {
    'rio-band': { meters: Meters }
  }
}
