import { readFileSync } from 'node:fs'

function leseVersion(): string {
  if (typeof __APP_VERSION__ === 'string') return __APP_VERSION__
  try {
    const roh = readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    return (JSON.parse(roh) as { version?: string }).version ?? 'unbekannt'
  } catch {
    return 'unbekannt'
  }
}

export const APP_VERSION = leseVersion()
