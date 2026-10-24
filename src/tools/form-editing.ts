import type { Point } from '../document-model'
import { distance, distanceToSegment } from '../document-model'

export const FORM_GRIFF_TOLERANZ_PX = 8

export function findeFormPunktIndex(
  punkte: Point[],
  punkt: Point,
  toleranz: number,
): number | null {
  let bester: number | null = null
  let besteDistanz = toleranz
  for (let i = 0; i < punkte.length; i++) {
    const d = distance(punkt, punkte[i])
    if (d <= besteDistanz) {
      besteDistanz = d
      bester = i
    }
  }
  return bester
}

export function findeFormSegmentIndex(
  punkte: Point[],
  punkt: Point,
  toleranz: number,
): number | null {
  let bester: number | null = null
  let besteDistanz = toleranz
  for (let i = 0; i < punkte.length - 1; i++) {
    const d = distanceToSegment(punkt, punkte[i], punkte[i + 1])
    if (d <= besteDistanz) {
      besteDistanz = d
      bester = i
    }
  }
  return bester
}

function istGeschlosseneAchse(punkte: Point[]): boolean {
  const letzter = punkte.length - 1
  return (
    letzter > 0 &&
    Math.abs(punkte[0].x - punkte[letzter].x) < 1e-9 &&
    Math.abs(punkte[0].y - punkte[letzter].y) < 1e-9
  )
}

export function verschiebeFormPunkt(punkte: Point[], index: number, neuePosition: Point): Point[] {
  const kopie = [...punkte]
  const letzter = punkte.length - 1
  const geschlossen = istGeschlosseneAchse(punkte)
  kopie[index] = neuePosition
  if (geschlossen && (index === 0 || index === letzter)) {
    kopie[0] = neuePosition
    kopie[letzter] = neuePosition
  }
  return kopie
}

export function fuegeFormPunktEin(punkte: Point[], segmentIndex: number, position: Point): Point[] {
  const kopie = [...punkte]
  kopie.splice(segmentIndex + 1, 0, position)
  return kopie
}

export function entferneFormPunkt(
  punkte: Point[],
  index: number,
  mindestAnzahl: number,
): Point[] | null {
  const letzter = punkte.length - 1
  if (istGeschlosseneAchse(punkte) && (index === 0 || index === letzter)) return null
  if (punkte.length <= mindestAnzahl) return null
  const kopie = [...punkte]
  kopie.splice(index, 1)
  return kopie
}
