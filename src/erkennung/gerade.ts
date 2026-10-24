import type { Point } from '../document-model'
import type { Plansegment } from './plansegment'
import { segmentLaenge, segmentRichtung } from './plansegment'

export interface Gerade {
  ursprung: Point
  richtung: Point
  winkel: number
}

export function geradeAusSegment(segment: Plansegment): Gerade {
  const laenge = segmentLaenge(segment)
  const richtung =
    laenge === 0
      ? { x: 1, y: 0 }
      : { x: (segment.b.x - segment.a.x) / laenge, y: (segment.b.y - segment.a.y) / laenge }
  return { ursprung: segment.a, richtung, winkel: segmentRichtung(segment) }
}

export function seitlicherVersatz(gerade: Gerade, p: Point): number {
  const dx = p.x - gerade.ursprung.x
  const dy = p.y - gerade.ursprung.y
  return -dx * gerade.richtung.y + dy * gerade.richtung.x
}

export function projektion(gerade: Gerade, p: Point): number {
  const dx = p.x - gerade.ursprung.x
  const dy = p.y - gerade.ursprung.y
  return dx * gerade.richtung.x + dy * gerade.richtung.y
}

export function punktAufGerade(gerade: Gerade, t: number, versatz = 0): Point {
  return {
    x: gerade.ursprung.x + gerade.richtung.x * t - gerade.richtung.y * versatz,
    y: gerade.ursprung.y + gerade.richtung.y * t + gerade.richtung.x * versatz,
  }
}

export function geradenSchnittpunkt(a: Gerade, b: Gerade): Point | null {
  const nenner = a.richtung.x * b.richtung.y - a.richtung.y * b.richtung.x
  if (Math.abs(nenner) < 1e-9) return null
  const dx = b.ursprung.x - a.ursprung.x
  const dy = b.ursprung.y - a.ursprung.y
  const t = (dx * b.richtung.y - dy * b.richtung.x) / nenner
  return punktAufGerade(a, t)
}
