import type { Blatt } from './blatt'
import { deckenstaerkeMeter } from './hoehenfuehrung'
import type { Point } from './geometry'
import type { TreppenObjekt } from './objekte'
import { ermittleTreppenGeometrie, ermittleTreppenStufen } from './treppe'
import type { Zeichnung } from './zeichnung'
import { istSchaltplan } from './zeichnungsart'

export const TREPPEN_SCHNITTHOEHE_METER = 1.0

const EPS = 1e-6

export function etageDarunter(zeichnung: Zeichnung, blatt: Blatt): Blatt | null {
  if (istSchaltplan(zeichnung)) return null
  const index = zeichnung.blaetter.findIndex((b) => b.id === blatt.id)
  if (index <= 0) return null
  const unten = zeichnung.blaetter[index - 1]
  const k = blatt.geschoss?.kote
  const ku = unten.geschoss?.kote
  if (k !== undefined && ku !== undefined && ku >= k - EPS) return null
  return unten
}

export function etageDarueber(zeichnung: Zeichnung, blatt: Blatt): Blatt | null {
  if (istSchaltplan(zeichnung)) return null
  const index = zeichnung.blaetter.findIndex((b) => b.id === blatt.id)
  if (index === -1 || index >= zeichnung.blaetter.length - 1) return null
  const oben = zeichnung.blaetter[index + 1]
  const k = blatt.geschoss?.kote
  const ko = oben.geschoss?.kote
  if (k !== undefined && ko !== undefined && ko <= k + EPS) return null
  return oben
}

export function treppenGeschosshoehe(zeichnung: Zeichnung, blatt: Blatt): number | null {
  const kote = blatt.geschoss?.kote
  const darueber = etageDarueber(zeichnung, blatt)?.geschoss?.kote
  if (kote !== undefined && darueber !== undefined && darueber > kote + EPS) return darueber - kote
  const raumhoehe = blatt.geschoss?.raumhoehe
  if (raumhoehe !== undefined && raumhoehe > 0)
    return raumhoehe + deckenstaerkeMeter(zeichnung, blatt)
  return null
}

export function treppenSchnittIndex(steigungen: number, geschossHoehe: number | null): number {
  if (steigungen < 2) return steigungen
  const k =
    geschossHoehe !== null && geschossHoehe > 0
      ? Math.floor((TREPPEN_SCHNITTHOEHE_METER * steigungen) / geschossHoehe + EPS)
      : Math.ceil(steigungen / 2)
  return Math.min(steigungen - 1, Math.max(1, k))
}

export interface TreppenSchnitt {
  unten: Point[][]
  oben: Point[][]
  schnittlinie: [Point, Point]
  pfeilUnten: Point[]
  pfeilOben: Point[]
}

export function treppenSchnitt(
  treppe: TreppenObjekt,
  geschossHoehe: number | null,
): TreppenSchnitt | null {
  const { stufen, steigungen } = ermittleTreppenStufen(treppe)
  if (steigungen < 2) return null
  const k = treppenSchnittIndex(steigungen, geschossHoehe)
  const letzteUnten = stufen.find((s) => s.hoehenIndex === k - 1)
  const ersteOben = stufen.find((s) => s.hoehenIndex === k)
  if (!letzteUnten || !ersteOben) return null
  const kante = gemeinsameKante(letzteUnten.polygon, ersteOben.polygon)
  if (!kante) return null

  const schnittlinie = schraegeSchnittlinie(kante, ersteOben.polygon)

  const pfeil = ermittleTreppenGeometrie(treppe).pfeilPunkte
  const [pfeilUnten, pfeilOben] = teilePolylinie(pfeil, kante)
  return {
    unten: stufen.filter((s) => s.hoehenIndex < k).map((s) => s.polygon),
    oben: stufen.filter((s) => s.hoehenIndex >= k).map((s) => s.polygon),
    schnittlinie,
    pfeilUnten,
    pfeilOben,
  }
}

function schraegeSchnittlinie(kante: [Point, Point], stufe: readonly Point[]): [Point, Point] {
  const [a, b] = kante
  const laenge = Math.hypot(b.x - a.x, b.y - a.y)
  let n = { x: -(b.y - a.y) / laenge, y: (b.x - a.x) / laenge }
  const m = schwerpunkt(stufe)
  if ((m.x - a.x) * n.x + (m.y - a.y) * n.y < 0) n = { x: -n.x, y: -n.y }
  const tiefe = Math.max(...stufe.map((p) => (p.x - a.x) * n.x + (p.y - a.y) * n.y))
  for (let d = tiefe / 2; d > EPS; d /= 2) {
    for (const [von, zu] of [
      [a, b],
      [b, a],
    ] as const) {
      const ende = { x: zu.x + n.x * d, y: zu.y + n.y * d }
      if (liegtInnen(ende, stufe)) return [von, ende]
    }
  }
  return [a, b]
}

function liegtInnen(p: Point, polygon: readonly Point[]): boolean {
  let innen = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const q = naechsterPunkt(a, b, p)
    if (Math.hypot(q.x - p.x, q.y - p.y) < 1e-6) return true
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      innen = !innen
  }
  return innen
}

function schwerpunkt(polygon: readonly Point[]): Point {
  const s = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: s.x / polygon.length, y: s.y / polygon.length }
}

function gemeinsameKante(p: readonly Point[], q: readonly Point[]): [Point, Point] | null {
  let beste: [Point, Point] | null = null
  let besteLaenge = EPS
  for (let i = 0; i < p.length; i++) {
    const a = p[i]
    const b = p[(i + 1) % p.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < EPS) continue
    const u = { x: dx / len, y: dy / len }
    for (let j = 0; j < q.length; j++) {
      const c = q[j]
      const d = q[(j + 1) % q.length]
      const abstand = (r: Point) => Math.abs((r.x - a.x) * u.y - (r.y - a.y) * u.x)
      if (abstand(c) > 1e-5 || abstand(d) > 1e-5) continue
      const t = (r: Point) => (r.x - a.x) * u.x + (r.y - a.y) * u.y
      const von = Math.max(0, Math.min(t(c), t(d)))
      const bis = Math.min(len, Math.max(t(c), t(d)))
      if (bis - von > besteLaenge) {
        besteLaenge = bis - von
        beste = [
          { x: a.x + u.x * von, y: a.y + u.y * von },
          { x: a.x + u.x * bis, y: a.y + u.y * bis },
        ]
      }
    }
  }
  return beste
}

function teilePolylinie(punkte: readonly Point[], kante: [Point, Point]): [Point[], Point[]] {
  const [a, b] = kante
  for (let i = 0; i < punkte.length - 1; i++) {
    const s = schnittStrecken(punkte[i], punkte[i + 1], a, b)
    if (s)
      return [
        [...punkte.slice(0, i + 1), s],
        [s, ...punkte.slice(i + 1)],
      ]
  }
  const mitte = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  let bester = { i: 0, p: punkte[0], d: Infinity }
  for (let i = 0; i < punkte.length - 1; i++) {
    const p = naechsterPunkt(punkte[i], punkte[i + 1], mitte)
    const d = Math.hypot(p.x - mitte.x, p.y - mitte.y)
    if (d < bester.d) bester = { i, p, d }
  }
  return [
    [...punkte.slice(0, bester.i + 1), bester.p],
    [bester.p, ...punkte.slice(bester.i + 1)],
  ]
}

function schnittStrecken(p1: Point, p2: Point, q1: Point, q2: Point): Point | null {
  const r = { x: p2.x - p1.x, y: p2.y - p1.y }
  const s = { x: q2.x - q1.x, y: q2.y - q1.y }
  const nenner = r.x * s.y - r.y * s.x
  if (Math.abs(nenner) < 1e-12) return null
  const w = { x: q1.x - p1.x, y: q1.y - p1.y }
  const t = (w.x * s.y - w.y * s.x) / nenner
  const u = (w.x * r.y - w.y * r.x) / nenner
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null
  return { x: p1.x + r.x * t, y: p1.y + r.y * t }
}

function naechsterPunkt(a: Point, b: Point, p: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy
  if (l2 < 1e-12) return a
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2))
  return { x: a.x + dx * t, y: a.y + dy * t }
}
