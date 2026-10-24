import type { Point } from './geometry'
import type { FensterObjekt, TreppenObjekt, TuerObjekt } from './objekte'
import { ermittleTreppenStufen } from './treppe'
import type { WandOeffnung } from './wand'

export const TUER_HOEHE_METER = 2.01
export const FENSTER_BRUESTUNG_METER = 0.9
export const FENSTER_HOEHE_METER = 1.26
export const DURCHBRUCH_HOEHE_METER = TUER_HOEHE_METER
export const STUFEN_STAERKE_METER = 0.05

export const OEFFNUNG_HOEHE_MIN = 0.1

export function tuerHoehe(t: TuerObjekt): number {
  return t.hoehe ?? TUER_HOEHE_METER
}

export function fensterHoehe(f: FensterObjekt): number {
  return f.hoehe ?? FENSTER_HOEHE_METER
}

export function fensterBruestung(f: FensterObjekt): number {
  return f.bruestungshoehe ?? FENSTER_BRUESTUNG_METER
}

export function oeffnungOffen(o: WandOeffnung): [number, number] {
  if (o.type === 'fenster') {
    const unten = fensterBruestung(o)
    return [unten, unten + fensterHoehe(o)]
  }
  if (o.type === 'tuer') return [0, tuerHoehe(o)]
  return [0, DURCHBRUCH_HOEHE_METER]
}

export interface Trittplatte {
  polygon: Point[]
  z: number
  hoehe: number
}

export function treppenTrittplatten(
  treppe: TreppenObjekt,
  geschossHoehe: number,
): { platten: Trittplatte[]; steigungen: number; steigung: number } {
  const { stufen, steigungen } = ermittleTreppenStufen(treppe)
  if (steigungen === 0) return { platten: [], steigungen: 0, steigung: 0 }
  const steigung = geschossHoehe / steigungen
  const staerke = Math.min(STUFEN_STAERKE_METER, steigung)
  return {
    platten: stufen.map((s) => ({
      polygon: s.polygon,
      z: (s.hoehenIndex + 1) * steigung - staerke,
      hoehe: staerke,
    })),
    steigungen,
    steigung,
  }
}
