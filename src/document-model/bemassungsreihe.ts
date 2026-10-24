import type { BoundingBox, Point } from './geometry'
import { boundingBoxFromPoints, distanceToSegment } from './geometry'
import type { BemassungsreiheObjekt } from './objekte'

export const STANDARD_STAFFELABSTAND = 0.3

const MINDEST_ABSCHNITT = 1e-6

export interface Masslinie {
  von: Point
  bis: Point
  laenge: number
}

export interface BemassungsreiheGeometrie {
  masslinien: Masslinie[]
  hilfslinien: Array<{ von: Point; bis: Point }>
  versatzGriff: Point
}

type Reihengeometrie = Pick<
  BemassungsreiheObjekt,
  'art' | 'punkte' | 'winkel' | 'versatz' | 'gesamtmass' | 'staffelabstand'
>

function achseVon(winkel: number) {
  const richtung = { x: Math.cos(winkel), y: Math.sin(winkel) }
  const normale = { x: -richtung.y, y: richtung.x }
  return { richtung, normale }
}

export function berechneReihenVersatz(ursprung: Point, winkel: number, p: Point): number {
  const { normale } = achseVon(winkel)
  return (p.x - ursprung.x) * normale.x + (p.y - ursprung.y) * normale.y
}

export function ermittleBemassungsreiheGeometrie(
  objekt: Reihengeometrie,
): BemassungsreiheGeometrie {
  const { richtung, normale } = achseVon(objekt.winkel)
  const ursprung = objekt.punkte[0] ?? { x: 0, y: 0 }
  const projiziert = objekt.punkte
    .map((p) => ({
      p,
      t: (p.x - ursprung.x) * richtung.x + (p.y - ursprung.y) * richtung.y,
    }))
    .sort((a, b) => a.t - b.t)

  const staffelRichtung = objekt.versatz < 0 ? -1 : 1
  const abstandEbene = (ebene: number) =>
    objekt.versatz + staffelRichtung * ebene * objekt.staffelabstand
  const aufLinie = (t: number, d: number): Point => ({
    x: ursprung.x + richtung.x * t + normale.x * d,
    y: ursprung.y + richtung.y * t + normale.y * d,
  })
  const masslinie = (tVon: number, tBis: number, ebene: number): Masslinie => ({
    von: aufLinie(tVon, abstandEbene(ebene)),
    bis: aufLinie(tBis, abstandEbene(ebene)),
    laenge: tBis - tVon,
  })

  const masslinien: Masslinie[] = []
  const hilfsEbene: number[] = projiziert.map(() => 0)

  if (projiziert.length >= 2) {
    const erster = projiziert[0]
    const letzter = projiziert[projiziert.length - 1]
    if (objekt.art === 'kette') {
      for (let i = 0; i < projiziert.length - 1; i++) {
        if (projiziert[i + 1].t - projiziert[i].t <= MINDEST_ABSCHNITT) continue
        masslinien.push(masslinie(projiziert[i].t, projiziert[i + 1].t, 0))
      }
      if (objekt.gesamtmass && masslinien.length >= 2) {
        masslinien.push(masslinie(erster.t, letzter.t, 1))
        hilfsEbene[0] = 1
        hilfsEbene[projiziert.length - 1] = 1
      }
    } else {
      let ebene = 0
      for (let i = 1; i < projiziert.length; i++) {
        if (projiziert[i].t - erster.t <= MINDEST_ABSCHNITT) continue
        masslinien.push(masslinie(erster.t, projiziert[i].t, ebene))
        hilfsEbene[i] = ebene
        ebene++
      }
      hilfsEbene[0] = Math.max(ebene - 1, 0)
    }
  }

  const hilfslinien = projiziert.map(({ p, t }, i) => ({
    von: p,
    bis: aufLinie(t, abstandEbene(hilfsEbene[i])),
  }))

  const tMitte =
    projiziert.length > 0 ? (projiziert[0].t + projiziert[projiziert.length - 1].t) / 2 : 0

  return { masslinien, hilfslinien, versatzGriff: aufLinie(tMitte, objekt.versatz) }
}

export function bemassungsreiheBoundingBox(objekt: Reihengeometrie): BoundingBox {
  const geometrie = ermittleBemassungsreiheGeometrie(objekt)
  return boundingBoxFromPoints([
    ...objekt.punkte,
    ...geometrie.masslinien.flatMap((m) => [m.von, m.bis]),
    ...geometrie.hilfslinien.map((h) => h.bis),
  ])
}

export function abstandZuBemassungsreihe(objekt: Reihengeometrie, punkt: Point): number {
  const geometrie = ermittleBemassungsreiheGeometrie(objekt)
  let kleinster = Infinity
  for (const linie of [...geometrie.masslinien, ...geometrie.hilfslinien]) {
    kleinster = Math.min(kleinster, distanceToSegment(punkt, linie.von, linie.bis))
  }
  return kleinster
}
