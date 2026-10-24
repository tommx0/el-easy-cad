import type { Objekt, Point } from '../document-model'
import { polygonPunkte, rechteckEcken, rotatePoint } from '../document-model'

export type Schneidkante =
  | { typ: 'segmente'; segmente: [Point, Point][] }
  | { typ: 'kreis'; mittelpunkt: Point; radius: number }
  | { typ: 'bogen'; mittelpunkt: Point; radius: number; startWinkel: number; endWinkel: number }

export function alsSchneidkante(objekt: Objekt): Schneidkante | null {
  switch (objekt.type) {
    case 'linie':
      return { typ: 'segmente', segmente: [[objekt.start, objekt.ende]] }
    case 'polylinie': {
      const segmente: [Point, Point][] = []
      for (let i = 0; i < objekt.punkte.length - 1; i++)
        segmente.push([objekt.punkte[i], objekt.punkte[i + 1]])
      if (objekt.geschlossen && objekt.punkte.length > 2) {
        segmente.push([objekt.punkte[objekt.punkte.length - 1], objekt.punkte[0]])
      }
      return { typ: 'segmente', segmente }
    }
    case 'rechteck': {
      const ecken = rechteckEcken(objekt)
      const segmente: [Point, Point][] = []
      for (let i = 0; i < ecken.length; i++)
        segmente.push([ecken[i], ecken[(i + 1) % ecken.length]])
      return { typ: 'segmente', segmente }
    }
    case 'polygon': {
      const ecken = polygonPunkte(objekt)
      const segmente: [Point, Point][] = []
      for (let i = 0; i < ecken.length; i++)
        segmente.push([ecken[i], ecken[(i + 1) % ecken.length]])
      return { typ: 'segmente', segmente }
    }
    case 'kreis':
      return { typ: 'kreis', mittelpunkt: objekt.mittelpunkt, radius: objekt.radius }
    case 'bogen':
      return {
        typ: 'bogen',
        mittelpunkt: objekt.mittelpunkt,
        radius: objekt.radius,
        startWinkel: objekt.startWinkel,
        endWinkel: objekt.endWinkel,
      }
    case 'ellipse': {
      const ecken = ellipsePunkte(
        objekt.mittelpunkt,
        objekt.radiusX,
        objekt.radiusY,
        objekt.drehung,
      )
      const segmente: [Point, Point][] = []
      for (let i = 0; i < ecken.length; i++)
        segmente.push([ecken[i], ecken[(i + 1) % ecken.length]])
      return { typ: 'segmente', segmente }
    }
    case 'wand': {
      const segmente: [Point, Point][] = []
      for (let i = 0; i < objekt.punkte.length - 1; i++)
        segmente.push([objekt.punkte[i], objekt.punkte[i + 1]])
      return { typ: 'segmente', segmente }
    }
    default:
      return null
  }
}

const ELLIPSE_SEGMENTE = 64

function ellipsePunkte(
  mittelpunkt: Point,
  radiusX: number,
  radiusY: number,
  drehung: number,
): Point[] {
  const punkte: Point[] = []
  for (let i = 0; i < ELLIPSE_SEGMENTE; i++) {
    const winkel = (i / ELLIPSE_SEGMENTE) * Math.PI * 2
    const lokal = {
      x: mittelpunkt.x + Math.cos(winkel) * radiusX,
      y: mittelpunkt.y + Math.sin(winkel) * radiusY,
    }
    punkte.push(drehung === 0 ? lokal : rotatePoint(lokal, mittelpunkt, drehung))
  }
  return punkte
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

export interface LinienSchnitt {
  punkt: Point
  t: number
}

function segmentSegmentSchnitt(a1: Point, a2: Point, b1: Point, b2: Point): LinienSchnitt | null {
  const d1x = a2.x - a1.x
  const d1y = a2.y - a1.y
  const d2x = b2.x - b1.x
  const d2y = b2.y - b1.y
  const nenner = d1x * d2y - d1y * d2x
  if (Math.abs(nenner) < 1e-9) return null
  const t = ((b1.x - a1.x) * d2y - (b1.y - a1.y) * d2x) / nenner
  const u = ((b1.x - a1.x) * d1y - (b1.y - a1.y) * d1x) / nenner
  if (u < -1e-6 || u > 1 + 1e-6) return null
  return { punkt: { x: a1.x + t * d1x, y: a1.y + t * d1y }, t }
}

function linienKreisSchnitte(
  a1: Point,
  a2: Point,
  mittelpunkt: Point,
  radius: number,
): LinienSchnitt[] {
  const dx = a2.x - a1.x
  const dy = a2.y - a1.y
  const fx = a1.x - mittelpunkt.x
  const fy = a1.y - mittelpunkt.y
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius
  const diskriminante = b * b - 4 * a * c
  if (diskriminante < 0 || a === 0) return []
  const wurzel = Math.sqrt(diskriminante)
  const t1 = (-b - wurzel) / (2 * a)
  const t2 = (-b + wurzel) / (2 * a)
  return [t1, t2].map((t) => ({ punkt: { x: a1.x + t * dx, y: a1.y + t * dy }, t }))
}

export function schnittpunkteMitKante(a1: Point, a2: Point, kante: Schneidkante): LinienSchnitt[] {
  if (kante.typ === 'kreis') return linienKreisSchnitte(a1, a2, kante.mittelpunkt, kante.radius)
  if (kante.typ === 'bogen') {
    return linienKreisSchnitte(a1, a2, kante.mittelpunkt, kante.radius).filter((schnitt) => {
      const winkel = Math.atan2(
        schnitt.punkt.y - kante.mittelpunkt.y,
        schnitt.punkt.x - kante.mittelpunkt.x,
      )
      return winkelImBogen(winkel, kante.startWinkel, kante.endWinkel)
    })
  }
  const ergebnisse: LinienSchnitt[] = []
  for (const [b1, b2] of kante.segmente) {
    const schnitt = segmentSegmentSchnitt(a1, a2, b1, b2)
    if (schnitt) ergebnisse.push(schnitt)
  }
  return ergebnisse
}

const KLASSIFIZIERUNGS_EPS = 1e-4

export interface TrimEntscheidung {
  punkt: Point
  seite: 'start' | 'ende'
  modus: 'trimmen' | 'verlaengern'
}

export function waehleTrimEntscheidung(
  tKlick: number,
  schnitte: readonly LinienSchnitt[],
): TrimEntscheidung | null {
  const trimSchnitte = schnitte.filter(
    (s) => s.t > KLASSIFIZIERUNGS_EPS && s.t < 1 - KLASSIFIZIERUNGS_EPS,
  )
  if (trimSchnitte.length > 0) {
    let gewaehlt = trimSchnitte[0]
    for (const s of trimSchnitte) {
      if (Math.abs(s.t - tKlick) < Math.abs(gewaehlt.t - tKlick)) gewaehlt = s
    }
    return {
      punkt: gewaehlt.punkt,
      seite: tKlick < gewaehlt.t ? 'start' : 'ende',
      modus: 'trimmen',
    }
  }

  if (tKlick < 0.5) {
    const kandidaten = schnitte.filter((s) => s.t < -KLASSIFIZIERUNGS_EPS)
    if (kandidaten.length === 0) return null
    let gewaehlt = kandidaten[0]
    for (const s of kandidaten) if (s.t > gewaehlt.t) gewaehlt = s
    return { punkt: gewaehlt.punkt, seite: 'start', modus: 'verlaengern' }
  }
  const kandidaten = schnitte.filter((s) => s.t > 1 + KLASSIFIZIERUNGS_EPS)
  if (kandidaten.length === 0) return null
  let gewaehlt = kandidaten[0]
  for (const s of kandidaten) if (s.t < gewaehlt.t) gewaehlt = s
  return { punkt: gewaehlt.punkt, seite: 'ende', modus: 'verlaengern' }
}
