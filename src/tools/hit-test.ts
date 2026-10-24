import type { Objekt, Point, TabellenKontext } from '../document-model'
import {
  abstandZuBemassungsreihe,
  distance,
  ermittleObjektBoundingBox,
  distanceToPolyline,
  distanceToSegment,
  mitKomponentenObenSortiert,
  pointInBoundingBox,
  pointInPolygon,
  polygonPunkte,
  POTENTIAL_SYMBOL_GROESSE,
  raumBeschriftungsRahmen,
  rechteckEcken,
  rotatePoint,
} from '../document-model'

export function hitTestObjekt(
  objekt: Objekt,
  punkt: Point,
  toleranz: number,
  tabellenKontext?: TabellenKontext,
): boolean {
  switch (objekt.type) {
    case 'linie':
      return distanceToSegment(punkt, objekt.start, objekt.ende) <= toleranz
    case 'polylinie':
      return distanceToPolyline(punkt, objekt.punkte, objekt.geschlossen) <= toleranz
    case 'bodenplatte':
      return distanceToPolyline(punkt, objekt.punkte, true) <= toleranz
    case 'rechteck':
    case 'treppe': {
      const ecken = rechteckEcken(objekt)
      return distanceToPolyline(punkt, ecken, true) <= toleranz
    }
    case 'kreis': {
      const d = distance(punkt, objekt.mittelpunkt)
      return Math.abs(d - objekt.radius) <= toleranz
    }
    case 'bogen': {
      const d = distance(punkt, objekt.mittelpunkt)
      if (Math.abs(d - objekt.radius) > toleranz) return false
      const winkel = normalisiereWinkel(
        Math.atan2(punkt.y - objekt.mittelpunkt.y, punkt.x - objekt.mittelpunkt.x),
      )
      return winkelImBogen(winkel, objekt.startWinkel, objekt.endWinkel)
    }
    case 'ellipse': {
      const lokal = rotatePoint(punkt, objekt.mittelpunkt, -objekt.drehung)
      const dx = (lokal.x - objekt.mittelpunkt.x) / objekt.radiusX
      const dy = (lokal.y - objekt.mittelpunkt.y) / objekt.radiusY
      const normDist = Math.hypot(dx, dy)
      const toleranzNorm = toleranz / Math.max(objekt.radiusX, objekt.radiusY)
      return Math.abs(normDist - 1) <= toleranzNorm
    }
    case 'polygon': {
      const ecken = polygonPunkte(objekt)
      return distanceToPolyline(punkt, ecken, true) <= toleranz
    }
    case 'punkt':
      return distance(punkt, objekt.position) <= toleranz * 2
    case 'potential':
      return distance(punkt, objekt.position) <= toleranz + POTENTIAL_SYMBOL_GROESSE
    case 'knotenpunkt':
      return distance(punkt, objekt.position) <= toleranz + 0.03
    case 'text': {
      const breite = objekt.inhalt.length * objekt.hoehe * 0.6
      return (
        punkt.x >= objekt.position.x - toleranz &&
        punkt.x <= objekt.position.x + breite + toleranz &&
        punkt.y >= objekt.position.y - toleranz &&
        punkt.y <= objekt.position.y + objekt.hoehe + toleranz
      )
    }
    case 'bemassung':
      return (
        distanceToSegment(punkt, objekt.start, objekt.ende) <= toleranz + Math.abs(objekt.versatz)
      )
    case 'bemassungsreihe':
      return abstandZuBemassungsreihe(objekt, punkt) <= toleranz
    case 'schraffur':
      return (
        pointInPolygon(punkt, objekt.kontur) ||
        distanceToPolyline(punkt, objekt.kontur, true) <= toleranz
      )
    case 'komponente': {
      const halbX = (objekt.breiteWelt ?? objekt.groesseWelt) / 2
      const halbY = objekt.groesseWelt / 2
      const ecken = [
        { x: objekt.position.x - halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y + halbY },
        { x: objekt.position.x - halbX, y: objekt.position.y + halbY },
      ].map((p) => rotatePoint(p, objekt.position, objekt.drehung))
      return pointInPolygon(punkt, ecken) || distanceToPolyline(punkt, ecken, true) <= toleranz
    }
    case 'leitung':
      return objekt.pfadSegmente.some(
        (segment) => distanceToPolyline(punkt, segment, false) <= toleranz,
      )
    case 'trunk':
    case 'schaltverbindung':
      return distanceToPolyline(punkt, objekt.wegpunkte, false) <= toleranz
    case 'kabelschacht': {
      const ecken = rechteckEcken(objekt)
      return pointInPolygon(punkt, ecken) || distanceToPolyline(punkt, ecken, true) <= toleranz
    }
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik':
    case 'leitungsbaum':
    case 'plankopf': {
      if (!tabellenKontext) return false
      const bb = ermittleObjektBoundingBox(objekt, tabellenKontext)
      return (
        punkt.x >= bb.min.x - toleranz &&
        punkt.x <= bb.max.x + toleranz &&
        punkt.y >= bb.min.y - toleranz &&
        punkt.y <= bb.max.y + toleranz
      )
    }
    case 'wand':
      return distanceToPolyline(punkt, objekt.punkte, false) <= toleranz + objekt.staerke / 2
    case 'tuer':
    case 'fenster':
    case 'wanddurchbruch':
      return distance(punkt, objekt.position) <= toleranz + objekt.breite / 2
    case 'raum':
      return pointInBoundingBox(punkt, raumBeschriftungsRahmen(objekt), toleranz)
  }
}

export function hitTestObjekte(
  objekte: Objekt[],
  punkt: Point,
  toleranz: number,
  tabellenKontext?: TabellenKontext,
): Objekt | null {
  for (const o of objekte)
    if (o.type === 'knotenpunkt' && hitTestObjekt(o, punkt, toleranz, tabellenKontext)) return o
  const sortiert = mitKomponentenObenSortiert(objekte)
  for (let i = sortiert.length - 1; i >= 0; i--) {
    if (hitTestObjekt(sortiert[i], punkt, toleranz, tabellenKontext)) return sortiert[i]
  }
  return null
}

function normalisiereWinkel(w: number): number {
  const zweiPi = Math.PI * 2
  let r = w % zweiPi
  if (r < 0) r += zweiPi
  return r
}

function winkelImBogen(winkel: number, start: number, ende: number): boolean {
  const s = normalisiereWinkel(start)
  const e = normalisiereWinkel(ende)
  const w = normalisiereWinkel(winkel)
  if (s <= e) return w >= s && w <= e
  return w >= s || w <= e
}
