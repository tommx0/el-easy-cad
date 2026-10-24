import type { BoundingBox, Point } from './geometry'
import { boundingBoxFromPoints, rotatePoint, unionBoundingBox } from './geometry'
import type { Objekt } from './objekte'

export interface TransformRahmen {
  zentrum: Point
  drehung: number
  lokalMin: Point
  lokalMax: Point
}

export function istTransformierbar(typ: Objekt['type']): boolean {
  return (
    typ === 'linie' ||
    typ === 'rechteck' ||
    typ === 'kreis' ||
    typ === 'bogen' ||
    typ === 'ellipse' ||
    typ === 'polygon' ||
    typ === 'text' ||
    typ === 'schraffur' ||
    typ === 'komponente' ||
    typ === 'kabelschacht' ||
    typ === 'treppe'
  )
}

export function nurProportionalSkalierbar(typ: Objekt['type']): boolean {
  return typ === 'kreis' || typ === 'bogen' || typ === 'polygon' || typ === 'text'
}

export function objektRahmen(objekt: Objekt): TransformRahmen | null {
  switch (objekt.type) {
    case 'rechteck':
    case 'kabelschacht':
    case 'treppe':
      return {
        zentrum: {
          x: objekt.ursprung.x + objekt.breite / 2,
          y: objekt.ursprung.y + objekt.hoehe / 2,
        },
        drehung: objekt.drehung,
        lokalMin: { x: -objekt.breite / 2, y: -objekt.hoehe / 2 },
        lokalMax: { x: objekt.breite / 2, y: objekt.hoehe / 2 },
      }
    case 'ellipse':
      return {
        zentrum: objekt.mittelpunkt,
        drehung: objekt.drehung,
        lokalMin: { x: -objekt.radiusX, y: -objekt.radiusY },
        lokalMax: { x: objekt.radiusX, y: objekt.radiusY },
      }
    case 'polygon':
      return {
        zentrum: objekt.mittelpunkt,
        drehung: objekt.drehung,
        lokalMin: { x: -objekt.radius, y: -objekt.radius },
        lokalMax: { x: objekt.radius, y: objekt.radius },
      }
    case 'kreis':
      return {
        zentrum: objekt.mittelpunkt,
        drehung: 0,
        lokalMin: { x: -objekt.radius, y: -objekt.radius },
        lokalMax: { x: objekt.radius, y: objekt.radius },
      }
    case 'bogen':
      return {
        zentrum: objekt.mittelpunkt,
        drehung: 0,
        lokalMin: { x: -objekt.radius, y: -objekt.radius },
        lokalMax: { x: objekt.radius, y: objekt.radius },
      }
    case 'text': {
      const breite = objekt.inhalt.length * objekt.hoehe * 0.6
      return {
        zentrum: objekt.position,
        drehung: objekt.drehung,
        lokalMin: { x: 0, y: 0 },
        lokalMax: { x: breite, y: objekt.hoehe },
      }
    }
    case 'komponente': {
      const halbX = (objekt.breiteWelt ?? objekt.groesseWelt) / 2
      const halbY = objekt.groesseWelt / 2
      return {
        zentrum: objekt.position,
        drehung: objekt.drehung,
        lokalMin: { x: -halbX, y: -halbY },
        lokalMax: { x: halbX, y: halbY },
      }
    }
    case 'linie':
    case 'schraffur': {
      const punkte = objekt.type === 'linie' ? [objekt.start, objekt.ende] : objekt.kontur
      const bb = boundingBoxFromPoints(punkte)
      const zentrum = { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
      return {
        zentrum,
        drehung: 0,
        lokalMin: { x: bb.min.x - zentrum.x, y: bb.min.y - zentrum.y },
        lokalMax: { x: bb.max.x - zentrum.x, y: bb.max.y - zentrum.y },
      }
    }
    default:
      return null
  }
}

export function mehrfachRahmen(objekte: Objekt[]): TransformRahmen | null {
  let bb: BoundingBox | null = null
  for (const objekt of objekte) {
    if (!istTransformierbar(objekt.type)) continue
    const einzelBb = boundingBoxVonObjekt(objekt)
    bb = bb ? unionBoundingBox(bb, einzelBb) : einzelBb
  }
  if (!bb) return null
  const zentrum = { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
  return {
    zentrum,
    drehung: 0,
    lokalMin: { x: bb.min.x - zentrum.x, y: bb.min.y - zentrum.y },
    lokalMax: { x: bb.max.x - zentrum.x, y: bb.max.y - zentrum.y },
  }
}

function boundingBoxVonObjekt(objekt: Objekt): BoundingBox {
  const rahmen = objektRahmen(objekt)
  if (!rahmen) return boundingBoxFromPoints([])
  const ecken = rahmenEcken(rahmen)
  return boundingBoxFromPoints(ecken)
}

export function ermittleTransformRahmen(
  alleObjekte: Objekt[],
  auswahlIds: readonly string[],
): TransformRahmen | null {
  const ausgewaehlt = alleObjekte.filter((o) => auswahlIds.includes(o.id))
  if (ausgewaehlt.length === 1) return objektRahmen(ausgewaehlt[0])
  if (ausgewaehlt.length > 1) return mehrfachRahmen(ausgewaehlt)
  return null
}

export function rahmenEcken(rahmen: TransformRahmen): [Point, Point, Point, Point] {
  const lokal: Point[] = [
    { x: rahmen.lokalMin.x, y: rahmen.lokalMin.y },
    { x: rahmen.lokalMax.x, y: rahmen.lokalMin.y },
    { x: rahmen.lokalMax.x, y: rahmen.lokalMax.y },
    { x: rahmen.lokalMin.x, y: rahmen.lokalMax.y },
  ]
  return lokal.map((p) =>
    rotatePoint(
      { x: rahmen.zentrum.x + p.x, y: rahmen.zentrum.y + p.y },
      rahmen.zentrum,
      rahmen.drehung,
    ),
  ) as [Point, Point, Point, Point]
}

export function rahmenDrehgriffPunkt(rahmen: TransformRahmen, versatzWelt: number): Point {
  const obenMitteLokal = { x: (rahmen.lokalMin.x + rahmen.lokalMax.x) / 2, y: rahmen.lokalMax.y }
  const richtung = rotatePoint({ x: 0, y: 1 }, { x: 0, y: 0 }, rahmen.drehung)
  const obenMitteWelt = rotatePoint(
    { x: rahmen.zentrum.x + obenMitteLokal.x, y: rahmen.zentrum.y + obenMitteLokal.y },
    rahmen.zentrum,
    rahmen.drehung,
  )
  return {
    x: obenMitteWelt.x + richtung.x * versatzWelt,
    y: obenMitteWelt.y + richtung.y * versatzWelt,
  }
}
