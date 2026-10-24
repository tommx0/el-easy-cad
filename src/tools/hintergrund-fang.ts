import type { Blatt, BoundingBox, Objekt, Point } from '../document-model'
import {
  hintergrundMassstab,
  neueObjektBasis,
  rohWinkelZuWelt,
  rohZuWelt,
  sichtbareIfcEntities,
} from '../document-model'

export type HintergrundElement =
  | { art: 'linie'; a: Point; b: Point }
  | { art: 'kreis'; mittelpunkt: Point; radius: number }
  | { art: 'bogen'; mittelpunkt: Point; radius: number; startWinkel: number; endWinkel: number }

export interface HintergrundFangRaster {
  elemente: HintergrundElement[]
  zelle: number
  zellen: Map<string, number[]>
}

export const HINTERGRUND_FANG_PRAEFIX = 'hintergrund-fang:'

const STANDARD_ZELLE = 2

function huelle(e: HintergrundElement): BoundingBox {
  if (e.art === 'linie') {
    return {
      min: { x: Math.min(e.a.x, e.b.x), y: Math.min(e.a.y, e.b.y) },
      max: { x: Math.max(e.a.x, e.b.x), y: Math.max(e.a.y, e.b.y) },
    }
  }
  return {
    min: { x: e.mittelpunkt.x - e.radius, y: e.mittelpunkt.y - e.radius },
    max: { x: e.mittelpunkt.x + e.radius, y: e.mittelpunkt.y + e.radius },
  }
}

export function baueHintergrundFangRaster(
  elemente: HintergrundElement[],
  zelle = STANDARD_ZELLE,
): HintergrundFangRaster {
  const zellen = new Map<string, number[]>()
  elemente.forEach((e, i) => {
    const h = huelle(e)
    const x0 = Math.floor(h.min.x / zelle)
    const x1 = Math.floor(h.max.x / zelle)
    const y0 = Math.floor(h.min.y / zelle)
    const y1 = Math.floor(h.max.y / zelle)
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 2500) return
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const schluessel = `${x},${y}`
        const liste = zellen.get(schluessel)
        if (liste) liste.push(i)
        else zellen.set(schluessel, [i])
      }
    }
  })
  return { elemente, zelle, zellen }
}

export function hintergrundFangObjekte(
  raster: HintergrundFangRaster,
  punkt: Point,
  toleranz: number,
  grenze = 60,
): Objekt[] {
  const z = raster.zelle
  const gefunden = new Set<number>()
  for (
    let x = Math.floor((punkt.x - toleranz) / z);
    x <= Math.floor((punkt.x + toleranz) / z);
    x++
  ) {
    for (
      let y = Math.floor((punkt.y - toleranz) / z);
      y <= Math.floor((punkt.y + toleranz) / z);
      y++
    ) {
      for (const i of raster.zellen.get(`${x},${y}`) ?? []) gefunden.add(i)
    }
  }
  const objekte: Objekt[] = []
  for (const i of gefunden) {
    const e = raster.elemente[i]
    const h = huelle(e)
    if (
      punkt.x < h.min.x - toleranz ||
      punkt.x > h.max.x + toleranz ||
      punkt.y < h.min.y - toleranz ||
      punkt.y > h.max.y + toleranz
    ) {
      continue
    }
    const basis = neueObjektBasis('hintergrund', { id: `${HINTERGRUND_FANG_PRAEFIX}${i}` })
    if (e.art === 'linie') objekte.push({ ...basis, type: 'linie', start: e.a, ende: e.b })
    else if (e.art === 'kreis') {
      objekte.push({
        ...basis,
        type: 'kreis',
        mittelpunkt: e.mittelpunkt,
        radius: e.radius,
        fuellung: null,
      })
    } else {
      objekte.push({
        ...basis,
        type: 'bogen',
        mittelpunkt: e.mittelpunkt,
        radius: e.radius,
        startWinkel: e.startWinkel,
        endWinkel: e.endWinkel,
      })
    }
    if (objekte.length >= grenze) break
  }
  return objekte
}

export interface RohLinie {
  a: Point
  b: Point
}

export function elementeAusHintergrund(
  blatt: Pick<Blatt, 'hintergrund' | 'ursprung' | 'massstab' | 'hintergrundDrehung'>,
  pdfLinien?: readonly RohLinie[],
): HintergrundElement[] {
  const h = blatt.hintergrund
  if (!h || h.typ === 'unbekannt') return []
  const m = hintergrundMassstab(blatt)
  const welt = (p: Point): Point => rohZuWelt(blatt, p)
  const ausgeblendet = h.ausblendungen.map((a) => ({
    min: { x: Math.min(a.eckeA.x, a.eckeB.x), y: Math.min(a.eckeA.y, a.eckeB.y) },
    max: { x: Math.max(a.eckeA.x, a.eckeB.x), y: Math.max(a.eckeA.y, a.eckeB.y) },
  }))
  const verdeckt = (punkte: Point[]) =>
    ausgeblendet.some((r) =>
      punkte.every((p) => p.x >= r.min.x && p.x <= r.max.x && p.y >= r.min.y && p.y <= r.max.y),
    )

  const elemente: HintergrundElement[] = []
  const linie = (a: Point, b: Point) => {
    if (!verdeckt([a, b])) elemente.push({ art: 'linie', a: welt(a), b: welt(b) })
  }
  if (h.typ === 'pdf') {
    for (const l of pdfLinien ?? []) linie(l.a, l.b)
    return elemente
  }
  const entities = h.typ === 'ifc' ? sichtbareIfcEntities(h) : h.entities
  for (const e of entities) {
    if (e.type === 'linie') linie(e.start, e.ende)
    else if (e.type === 'polylinie') {
      for (let i = 0; i + 1 < e.punkte.length; i++) linie(e.punkte[i], e.punkte[i + 1])
      if (e.geschlossen && e.punkte.length > 2) linie(e.punkte[e.punkte.length - 1], e.punkte[0])
    } else if (!verdeckt([e.mittelpunkt])) {
      const mittelpunkt = welt(e.mittelpunkt)
      const radius = e.radius * m
      elemente.push(
        e.type === 'kreis'
          ? { art: 'kreis', mittelpunkt, radius }
          : {
              art: 'bogen',
              mittelpunkt,
              radius,
              startWinkel: rohWinkelZuWelt(blatt, e.startWinkel),
              endWinkel: rohWinkelZuWelt(blatt, e.endWinkel),
            },
      )
    }
  }
  return elemente
}
