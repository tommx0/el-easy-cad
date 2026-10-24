import type { Point } from '../document-model'
import { distance } from '../document-model'

export interface Plansegment {
  a: Point
  b: Point
  farbe?: string
}

export interface Planbogen {
  mittelpunkt: Point
  radius: number
  startWinkel: number
  endWinkel: number
}

export type Planherkunft = 'dxf' | 'pdf-vektor' | 'raster'

export interface Planlinien {
  herkunft: Planherkunft
  segmente: Plansegment[]
  boegen: Planbogen[]
}

export type RohZuWelt = (roh: Point) => Point

export function segmentLaenge(s: Plansegment): number {
  return distance(s.a, s.b)
}

export function segmentRichtung(s: Plansegment): number {
  const winkel = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x)
  return winkel < 0 ? winkel + Math.PI : winkel % Math.PI
}

export function richtungsDifferenz(winkelA: number, winkelB: number): number {
  const diff = Math.abs(winkelA - winkelB) % Math.PI
  return Math.min(diff, Math.PI - diff)
}

export function segmentRichtungsVektor(s: Plansegment): Point {
  const laenge = segmentLaenge(s)
  if (laenge === 0) return { x: 1, y: 0 }
  return { x: (s.b.x - s.a.x) / laenge, y: (s.b.y - s.a.y) / laenge }
}
