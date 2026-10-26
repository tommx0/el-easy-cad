import type { BoundingBox, Objekt, Point, TabellenKontext } from '../document-model'
import {
  boundingBoxEnthaelt,
  boundingBoxFromPoints,
  boundingBoxUeberlappt,
  ermittleObjektBoundingBox,
} from '../document-model'

export function ermittleObjekteImAuswahlRechteck(
  objekte: Objekt[],
  start: Point,
  ende: Point,
  tabellenKontext?: TabellenKontext,
): string[] {
  const rechteck = boundingBoxFromPoints([start, ende])
  const nurVollstaendigUmschlossen = start.x <= ende.x
  const treffer: string[] = []
  for (const objekt of objekte) {
    const bb = ermittleObjektBoundingBox(objekt, tabellenKontext)
    const zuege = nurVollstaendigUmschlossen ? null : linienZuege(objekt)
    const passt = nurVollstaendigUmschlossen
      ? boundingBoxEnthaelt(rechteck, bb)
      : zuege
        ? zuege.some((zug) => zugBeruehrt(zug, rechteck))
        : boundingBoxUeberlappt(rechteck, bb)
    if (passt) treffer.push(objekt.id)
  }
  return treffer
}

function linienZuege(objekt: Objekt): Point[][] | null {
  switch (objekt.type) {
    case 'linie':
      return [[objekt.start, objekt.ende]]
    case 'polylinie':
      return [
        objekt.geschlossen && objekt.punkte.length > 2
          ? [...objekt.punkte, objekt.punkte[0]]
          : objekt.punkte,
      ]
    case 'leitung':
      return objekt.pfadSegmente
    case 'trunk':
    case 'schaltverbindung':
      return [objekt.wegpunkte]
    default:
      return null
  }
}

function zugBeruehrt(zug: Point[], rechteck: BoundingBox): boolean {
  if (zug.length === 1) return boundingBoxEnthaelt(rechteck, boundingBoxFromPoints(zug))
  for (let i = 1; i < zug.length; i++)
    if (streckeBeruehrt(zug[i - 1], zug[i], rechteck)) return true
  return false
}

function streckeBeruehrt(a: Point, b: Point, r: BoundingBox): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  let t0 = 0
  let t1 = 1
  const grenze = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0
    const t = q / p
    if (p < 0) {
      if (t > t1) return false
      t0 = Math.max(t0, t)
    } else {
      if (t < t0) return false
      t1 = Math.min(t1, t)
    }
    return true
  }
  return (
    grenze(-dx, a.x - r.min.x) &&
    grenze(dx, r.max.x - a.x) &&
    grenze(-dy, a.y - r.min.y) &&
    grenze(dy, r.max.y - a.y)
  )
}
