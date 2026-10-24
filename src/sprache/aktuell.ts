import { QUELLSPRACHE } from './sprachen'
import type { Sprache } from './sprachen'
import { erzeugeUebersetzer } from './uebersetzer'
import type { Uebersetzer } from './uebersetzer'

let aktuell: Sprache = QUELLSPRACHE
const beobachter = new Set<() => void>()

export function oberflaechensprache(): Sprache {
  return aktuell
}

export function setzeOberflaechensprache(sprache: Sprache): void {
  if (sprache === aktuell) return
  aktuell = sprache
  for (const melde of beobachter) melde()
}

export function beobachteOberflaechensprache(melde: () => void): () => void {
  beobachter.add(melde)
  return () => beobachter.delete(melde)
}

export const t: Uebersetzer = (schluessel, werte) => erzeugeUebersetzer(aktuell)(schluessel, werte)
