import { getDockpoints, istTrunkDockpunkt } from './dockpoints'
import type { Point } from './geometry'
import { distance } from './geometry'
import type { KomponentenObjekt, KomponentenWandstelle } from './objekte'

export const WANDSEITE_TOLERANZ_METER = 0.01

export function abstandZurWandoberflaeche(wandstelle: KomponentenWandstelle, punkt: Point): number {
  const ux = Math.cos(wandstelle.richtung)
  const uy = Math.sin(wandstelle.richtung)
  return ux * (punkt.y - wandstelle.punkt.y) - uy * (punkt.x - wandstelle.punkt.x)
}

export function richtungZurWand(wandstelle: KomponentenWandstelle): Point {
  return { x: Math.sin(wandstelle.richtung), y: -Math.cos(wandstelle.richtung) }
}

export function wandseitigeDockpunktIndizes(komponente: KomponentenObjekt): number[] {
  const wandstelle = komponente.wandstelle
  if (!wandstelle) return []
  const abstaende = getDockpoints(komponente).map((p, i) =>
    istTrunkDockpunkt(komponente, i) ? null : abstandZurWandoberflaeche(wandstelle, p),
  )
  const kleinster = Math.min(...abstaende.filter((a): a is number => a !== null))
  if (!Number.isFinite(kleinster)) return []
  return abstaende.flatMap((a, i) =>
    a !== null && a <= kleinster + WANDSEITE_TOLERANZ_METER ? [i] : [],
  )
}

export function wandseiteEingeschraenkt(komponente: KomponentenObjekt): boolean {
  if (!komponente.wandstelle) return false
  const konfiguration = komponente.dockpunkte
  if (!konfiguration) return true
  if (konfiguration.modus === 'ports') return false
  return !konfiguration.punkte.some((p) => !p.trunk && p.bezeichnung?.trim())
}

export function angeboteneDockpunkte(komponente: KomponentenObjekt): number[] | null {
  if (!wandseiteEingeschraenkt(komponente)) return null
  const indizes = wandseitigeDockpunktIndizes(komponente)
  return indizes.length > 0 ? indizes : null
}

export function wandseitigerErsatzDockpunkt(
  komponente: KomponentenObjekt,
  bisherigerIndex: number,
): number | null {
  if (!wandseiteEingeschraenkt(komponente)) return null
  const indizes = wandseitigeDockpunktIndizes(komponente)
  if (indizes.length === 0 || indizes.includes(bisherigerIndex)) return null
  const punkte = getDockpoints(komponente)
  const bisher = punkte[bisherigerIndex]
  if (!bisher) return null
  let bester: number | null = null
  let besterAbstand = Infinity
  let besteMitte = Infinity
  for (const i of indizes) {
    const abstand = distance(punkte[i], bisher)
    const mitte = distance(punkte[i], komponente.position)
    if (
      abstand < besterAbstand - 1e-9 ||
      (Math.abs(abstand - besterAbstand) <= 1e-9 && mitte < besteMitte)
    ) {
      bester = i
      besterAbstand = abstand
      besteMitte = mitte
    }
  }
  return bester
}
