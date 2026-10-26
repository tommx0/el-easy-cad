import { resolve, sep } from 'node:path'

export function pfadImOrdner(basis: string, ...teile: string[]): string | null {
  const wurzel = resolve(basis)
  const ziel = resolve(wurzel, ...teile)
  const praefix = wurzel.endsWith(sep) ? wurzel : wurzel + sep
  return ziel.startsWith(praefix) ? ziel : null
}
