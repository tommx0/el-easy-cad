import type { CatalogComponent } from './catalog'
import type { VerteilerDaten } from './objekte'

export type VerteilerNetz = 'drehstrom' | 'wechselstrom'

export function netzVon(daten: Pick<VerteilerDaten, 'netz'> | undefined): VerteilerNetz {
  return daten?.netz ?? 'drehstrom'
}

export function passtZumNetz(eintrag: CatalogComponent, netz: VerteilerNetz): boolean {
  if (netz === 'drehstrom') return true
  if (eintrag.dockpunkte?.modus !== 'frei') return true
  const punkte = eintrag.dockpunkte.punkte.filter((p) => !p.trunk)
  if (punkte.some((p) => /^L[23]$/.test(p.bezeichnung?.trim() ?? ''))) return false
  if (eintrag.kennzeichenBuchstabe?.trim() !== 'F') return true
  return punkte.filter((p) => p.yAnteil >= 0.5).length <= 2
}
