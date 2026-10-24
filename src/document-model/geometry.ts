export interface Point {
  x: number
  y: number
}

export function punkt(x: number, y: number): Point {
  return { x, y }
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scalePoint(p: Point, faktor: number): Point {
  return { x: p.x * faktor, y: p.y * faktor }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function angleBetween(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function rotatePoint(p: Point, zentrum: Point, radiant: number): Point {
  const cos = Math.cos(radiant)
  const sin = Math.sin(radiant)
  const dx = p.x - zentrum.x
  const dy = p.y - zentrum.y
  return {
    x: zentrum.x + dx * cos - dy * sin,
    y: zentrum.y + dx * sin + dy * cos,
  }
}

export interface BoundingBox {
  min: Point
  max: Point
}

export function boundingBoxFromPoints(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
  }
  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
}

export function unionBoundingBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y) },
    max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y) },
  }
}

export function expandBoundingBox(bb: BoundingBox, rand: number): BoundingBox {
  return {
    min: { x: bb.min.x - rand, y: bb.min.y - rand },
    max: { x: bb.max.x + rand, y: bb.max.y + rand },
  }
}

export function boundingBoxCenter(bb: BoundingBox): Point {
  return { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
}

export function boundingBoxSize(bb: BoundingBox): { breite: number; hoehe: number } {
  return { breite: bb.max.x - bb.min.x, hoehe: bb.max.y - bb.min.y }
}

export function pointInBoundingBox(p: Point, bb: BoundingBox, toleranz = 0): boolean {
  return (
    p.x >= bb.min.x - toleranz &&
    p.x <= bb.max.x + toleranz &&
    p.y >= bb.min.y - toleranz &&
    p.y <= bb.max.y + toleranz
  )
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const laenge2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (laenge2 === 0) return distance(p, a)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / laenge2
  t = Math.max(0, Math.min(1, t))
  const projektion = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
  return distance(p, projektion)
}

export function toRadians(grad: number): number {
  return (grad * Math.PI) / 180
}

export function toDegrees(radiant: number): number {
  return (radiant * 180) / Math.PI
}

export function pfadGesamtLaenge(pfad: Point[]): number {
  let gesamt = 0
  for (let i = 0; i < pfad.length - 1; i++) {
    gesamt += distance(pfad[i], pfad[i + 1])
  }
  return gesamt
}

export function teilPfadLaenge(pfad: Point[], tVon: number, tBis: number): number {
  const gesamt = pfadGesamtLaenge(pfad)
  if (gesamt === 0) return 0
  const klemme = (t: number) => Math.max(0, Math.min(1, t))
  return Math.abs(klemme(tBis) - klemme(tVon)) * gesamt
}

export function teilPfad(pfad: Point[], tVon: number, tBis: number): Point[] {
  if (pfad.length < 2) return pfad.slice()
  const klemme = (t: number) => Math.max(0, Math.min(1, t))
  const rueckwaerts = klemme(tBis) < klemme(tVon)
  const [tStart, tEnde] = rueckwaerts ? [klemme(tBis), klemme(tVon)] : [klemme(tVon), klemme(tBis)]
  const gesamt = pfadGesamtLaenge(pfad)
  if (gesamt === 0) return [pfad[0], pfad[0]]

  const zielStart = tStart * gesamt
  const zielEnde = tEnde * gesamt
  const ergebnis: Point[] = [punktBeiLaenge(pfad, zielStart)]
  let laengeBis = 0
  for (let i = 0; i < pfad.length - 1; i++) {
    laengeBis += distance(pfad[i], pfad[i + 1])
    if (laengeBis > zielStart + 1e-9 && laengeBis < zielEnde - 1e-9) {
      ergebnis.push(pfad[i + 1])
    }
  }
  ergebnis.push(punktBeiLaenge(pfad, zielEnde))
  return rueckwaerts ? ergebnis.reverse() : ergebnis
}

function punktBeiLaenge(pfad: Point[], ziel: number): Point {
  let rest = ziel
  for (let i = 0; i < pfad.length - 1; i++) {
    const segLaenge = distance(pfad[i], pfad[i + 1])
    if (rest <= segLaenge || i === pfad.length - 2) {
      const lokalT = segLaenge === 0 ? 0 : Math.max(0, Math.min(1, rest / segLaenge))
      return {
        x: pfad[i].x + (pfad[i + 1].x - pfad[i].x) * lokalT,
        y: pfad[i].y + (pfad[i + 1].y - pfad[i].y) * lokalT,
      }
    }
    rest -= segLaenge
  }
  return pfad[pfad.length - 1]
}

export function naechsterPunktAufSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laengeQuadrat = dx * dx + dy * dy
  if (laengeQuadrat === 0) return a
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / laengeQuadrat
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + dx * t, y: a.y + dy * t }
}

export function distanceToPolyline(p: Point, punkte: Point[], geschlossen: boolean): number {
  if (punkte.length === 0) return Infinity
  if (punkte.length === 1) return distance(p, punkte[0])
  let min = Infinity
  for (let i = 0; i < punkte.length - 1; i++) {
    min = Math.min(min, distanceToSegment(p, punkte[i], punkte[i + 1]))
  }
  if (geschlossen) {
    min = Math.min(min, distanceToSegment(p, punkte[punkte.length - 1], punkte[0]))
  }
  return min
}

export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let innen = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]
    const pj = polygon[j]
    const schneidet =
      pi.y > p.y !== pj.y > p.y && p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x
    if (schneidet) innen = !innen
  }
  return innen
}

export function boundingBoxUeberlappt(a: BoundingBox, b: BoundingBox): boolean {
  return a.min.x <= b.max.x && a.max.x >= b.min.x && a.min.y <= b.max.y && a.max.y >= b.min.y
}

export function boundingBoxEnthaelt(aussen: BoundingBox, innen: BoundingBox): boolean {
  return (
    innen.min.x >= aussen.min.x &&
    innen.max.x <= aussen.max.x &&
    innen.min.y >= aussen.min.y &&
    innen.max.y <= aussen.max.y
  )
}
