import type { Blatt, Point, TreppenObjekt } from '../document-model'
import {
  hintergrundDrehungVon,
  nullpunktVon,
  RUECKFALL_RAUMHOEHE_METER,
  treppenUmriss,
  weltZuRoh,
} from '../document-model'
import type { ExportGeschoss } from './export-modell'

export const EXPORT_RUECKFALL_GESCHOSSHOEHE = 2.75
export const EXPORT_RUECKFALL_RAUMHOEHE = RUECKFALL_RAUMHOEHE_METER

export function modellPunkt(blatt: Blatt, welt: Point): Point {
  const h = blatt.hintergrund
  if (h?.typ === 'ifc') {
    const roh = weltZuRoh(blatt, welt)
    const dx = roh.x - h.lage.versatz.x
    const dy = roh.y - h.lage.versatz.y
    const cos = Math.cos(-h.lage.drehung)
    const sin = Math.sin(-h.lage.drehung)
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
  }
  const null_ = nullpunktVon(blatt)
  return { x: welt.x - null_.x, y: welt.y - null_.y }
}

export function modellDrehung(blatt: Blatt, drehung: number): number {
  return blatt.hintergrund?.typ === 'ifc'
    ? drehung - hintergrundDrehungVon(blatt) - blatt.hintergrund.lage.drehung
    : drehung
}

export function geschossHoeheNachOben(
  geschoss: ExportGeschoss,
  alle: readonly ExportGeschoss[],
): number {
  const hoeher = alle.filter((g) => g.kote > geschoss.kote + 1e-6).map((g) => g.kote)
  return hoeher.length ? Math.min(...hoeher) - geschoss.kote : EXPORT_RUECKFALL_GESCHOSSHOEHE
}

export interface Treppenoeffnungen {
  eigene: Map<string, Point[][]>
  vonUnten: Map<string, Point[][]>
}

export function ermittleTreppenoeffnungen(
  blaetter: readonly Blatt[],
  geschosse: readonly ExportGeschoss[],
): Treppenoeffnungen {
  const eigene = new Map<string, Point[][]>()
  const vonUnten = new Map<string, Point[][]>()
  const geschossVon = new Map(geschosse.map((g) => [g.blattId, g]))
  for (const blatt of blaetter) {
    const geschoss = geschossVon.get(blatt.id)
    if (!geschoss) continue
    const umrisse = blatt.objekte
      .filter((o): o is TreppenObjekt => o.type === 'treppe')
      .map((t) => treppenUmriss(t).map((p) => modellPunkt(blatt, p)))
    if (umrisse.length === 0) continue
    eigene.set(blatt.id, umrisse)
    let darueber: ExportGeschoss | null = null
    for (const g of geschosse)
      if (g.kote > geschoss.kote + 1e-6 && (!darueber || g.kote < darueber.kote)) darueber = g
    if (darueber)
      vonUnten.set(darueber.blattId, [...(vonUnten.get(darueber.blattId) ?? []), ...umrisse])
  }
  return { eigene, vonUnten }
}
