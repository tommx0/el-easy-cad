import type { Objekt, Point, TabellenKontext } from '../document-model'
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
    const passt = nurVollstaendigUmschlossen
      ? boundingBoxEnthaelt(rechteck, bb)
      : boundingBoxUeberlappt(rechteck, bb)
    if (passt) treffer.push(objekt.id)
  }
  return treffer
}
