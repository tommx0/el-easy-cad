import type { Point, WandObjekt } from '../document-model'
import { distance, naechsterPunktAufPfad } from '../document-model'
import type { ToolContext } from './tool'

const TOLERANZ_PX = 12

export const ENDPUNKT_TOLERANZ_PX = 10

export interface WandTreffer {
  wand: WandObjekt
  t: number
  punkt: Point
}

export function findeNaechsteWand(ctx: ToolContext, punkt: Point): WandTreffer | null {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return null
  const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)

  let bester: (WandTreffer & { distanz: number }) | null = null
  for (const objekt of blatt.objekte) {
    if (objekt.type !== 'wand') continue
    const treffer = naechsterPunktAufPfad(objekt.punkte, punkt)
    if (!treffer || treffer.distanz > toleranz + objekt.staerke / 2) continue
    if (!bester || treffer.distanz < bester.distanz) {
      bester = { wand: objekt, t: treffer.t, punkt: treffer.punkt, distanz: treffer.distanz }
    }
  }
  return bester
}

export interface WandEndpunktTreffer {
  wand: WandObjekt
  istStart: boolean
  punkt: Point
}

export function findeWandEndpunkt(
  ctx: ToolContext,
  punkt: Point,
  ausschlussId?: string,
): WandEndpunktTreffer | null {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return null
  const grundToleranz = ctx.view.laengeToWorld(ENDPUNKT_TOLERANZ_PX)

  let bester: (WandEndpunktTreffer & { distanz: number }) | null = null
  for (const objekt of blatt.objekte) {
    if (objekt.type !== 'wand' || objekt.id === ausschlussId || objekt.punkte.length < 2) continue
    const toleranz = grundToleranz + objekt.staerke * Math.SQRT1_2
    const kandidaten: [Point, boolean][] = [
      [objekt.punkte[0], true],
      [objekt.punkte[objekt.punkte.length - 1], false],
    ]
    for (const [kandidat, istStart] of kandidaten) {
      const distanz = distance(punkt, kandidat)
      if (distanz > toleranz) continue
      if (!bester || distanz < bester.distanz) {
        bester = { wand: objekt, istStart, punkt: kandidat, distanz }
      }
    }
  }
  return bester
}
