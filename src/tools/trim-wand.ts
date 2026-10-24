import type { Point, WandObjekt } from '../document-model'
import { distance, distanceToSegment, pfadGesamtLaenge } from '../document-model'
import { schnittpunkteMitKante, waehleTrimEntscheidung, type Schneidkante } from './trim-geometry'

export function naechstesWandSegment(punkt: Point, wandPunkte: readonly Point[]): number {
  let besterIndex = 0
  let besteDistanz = Infinity
  for (let i = 0; i < wandPunkte.length - 1; i++) {
    const d = distanceToSegment(punkt, wandPunkte[i], wandPunkte[i + 1])
    if (d < besteDistanz) {
      besteDistanz = d
      besterIndex = i
    }
  }
  return besterIndex
}

export function istGeschlossen(punkte: readonly Point[]): boolean {
  if (punkte.length < 3) return false
  const erster = punkte[0]
  const letzter = punkte[punkte.length - 1]
  return Math.abs(erster.x - letzter.x) < 1e-9 && Math.abs(erster.y - letzter.y) < 1e-9
}

export interface WandTrimErgebnis {
  punkte: Point[]
  seite: 'start' | 'ende'
  bogenlaengeBisSchnitt: number
}

export function berechneWandTrimErgebnis(
  wand: WandObjekt,
  klickpunkt: Point,
  kante: Schneidkante,
): WandTrimErgebnis | null {
  const punkte = wand.punkte
  if (punkte.length < 2) return null
  const i = naechstesWandSegment(klickpunkt, punkte)
  const a = punkte[i]
  const b = punkte[i + 1]
  const laenge2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (laenge2 === 0) return null
  const tKlick = ((klickpunkt.x - a.x) * (b.x - a.x) + (klickpunkt.y - a.y) * (b.y - a.y)) / laenge2

  const entscheidung = waehleTrimEntscheidung(tKlick, schnittpunkteMitKante(a, b, kante))
  if (!entscheidung) return null

  if (entscheidung.modus === 'verlaengern') {
    const geschlossen = istGeschlossen(punkte)
    const freiesEndeA = i === 0 && !geschlossen
    const freiesEndeB = i === punkte.length - 2 && !geschlossen
    if (entscheidung.seite === 'start' && !freiesEndeA) return null
    if (entscheidung.seite === 'ende' && !freiesEndeB) return null
  }

  const bogenlaengeBisSchnitt =
    pfadGesamtLaenge(punkte.slice(0, i + 1)) + distance(a, entscheidung.punkt)

  const neuePunkte =
    entscheidung.seite === 'start'
      ? [entscheidung.punkt, ...punkte.slice(i + 1)]
      : [...punkte.slice(0, i + 1), entscheidung.punkt]

  return { punkte: neuePunkte, seite: entscheidung.seite, bogenlaengeBisSchnitt }
}
