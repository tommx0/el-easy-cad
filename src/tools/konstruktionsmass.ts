import type { Point } from '../document-model'
import { distance, toDegrees } from '../document-model'

export interface KonstruktionsStrecke {
  von: Point
  bis: Point
  davor: Point | null
  eingebbar: boolean
}

export interface KonstruktionsMass {
  eingebbar: boolean
  laenge: number
  winkelAbsolut: number
  winkelRelativ: number | null
}

function normiere0Bis360(grad: number): number {
  const rest = grad % 360
  return rest < 0 ? rest + 360 : rest === 0 ? 0 : rest
}

function normiereMinus180Bis180(grad: number): number {
  const im360 = normiere0Bis360(grad)
  return im360 > 180 ? im360 - 360 : im360
}

function richtungInGrad(a: Point, b: Point): number {
  return toDegrees(Math.atan2(b.x - a.x, b.y - a.y))
}

function vorherigeRichtung(strecke: KonstruktionsStrecke): number | null {
  const { von, davor } = strecke
  if (!davor || distance(davor, von) === 0) return null
  return richtungInGrad(davor, von)
}

export function berechneKonstruktionsMass(strecke: KonstruktionsStrecke): KonstruktionsMass {
  const { von, bis } = strecke
  const laenge = distance(von, bis)
  const richtung = richtungInGrad(von, bis)
  const vorher = vorherigeRichtung(strecke)
  return {
    eingebbar: strecke.eingebbar,
    laenge,
    winkelAbsolut: normiere0Bis360(richtung),
    winkelRelativ: vorher === null ? null : normiereMinus180Bis180(richtung - vorher),
  }
}

export interface MassEingabe {
  laenge: number | null
  winkelAbsolut: number | null
  winkelRelativ: number | null
}

export function istMassEingabeLeer(eingabe: MassEingabe | null): boolean {
  return (
    !eingabe ||
    (eingabe.laenge === null && eingabe.winkelAbsolut === null && eingabe.winkelRelativ === null)
  )
}

export function punktAusEingabe(strecke: KonstruktionsStrecke, eingabe: MassEingabe): Point {
  const { von, bis } = strecke
  const laenge = eingabe.laenge ?? distance(von, bis)
  let richtung: number
  if (eingabe.winkelAbsolut !== null) {
    richtung = eingabe.winkelAbsolut
  } else if (eingabe.winkelRelativ !== null) {
    richtung = (vorherigeRichtung(strecke) ?? 0) + eingabe.winkelRelativ
  } else if (distance(von, bis) === 0) {
    richtung = 0
  } else {
    richtung = richtungInGrad(von, bis)
  }
  const rad = (richtung * Math.PI) / 180
  return { x: von.x + Math.sin(rad) * laenge, y: von.y + Math.cos(rad) * laenge }
}
