import type { Blatt } from './blatt'
import type { BoundingBox, Point } from './geometry'

export type HintergrundLage = Pick<Blatt, 'ursprung' | 'massstab' | 'hintergrundDrehung'>

export function hintergrundMassstab(blatt: Pick<Blatt, 'massstab'>): number {
  return blatt.massstab ?? 1
}

export function hintergrundDrehungVon(blatt: Pick<Blatt, 'hintergrundDrehung'>): number {
  return blatt.hintergrundDrehung ?? 0
}

export function rohZuWelt(blatt: HintergrundLage, roh: Point): Point {
  const m = hintergrundMassstab(blatt)
  const w = hintergrundDrehungVon(blatt)
  if (w === 0) return { x: blatt.ursprung.x + roh.x * m, y: blatt.ursprung.y + roh.y * m }
  const cos = Math.cos(w)
  const sin = Math.sin(w)
  return {
    x: blatt.ursprung.x + (roh.x * cos - roh.y * sin) * m,
    y: blatt.ursprung.y + (roh.x * sin + roh.y * cos) * m,
  }
}

export function weltZuRoh(blatt: HintergrundLage, welt: Point): Point {
  const m = hintergrundMassstab(blatt)
  const w = hintergrundDrehungVon(blatt)
  const dx = (welt.x - blatt.ursprung.x) / m
  const dy = (welt.y - blatt.ursprung.y) / m
  if (w === 0) return { x: dx, y: dy }
  const cos = Math.cos(w)
  const sin = Math.sin(w)
  return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
}

export function rohWinkelZuWelt(blatt: Pick<Blatt, 'hintergrundDrehung'>, winkel: number): number {
  return winkel + hintergrundDrehungVon(blatt)
}

export function hintergrundEcken(
  blatt: HintergrundLage,
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
): [Point, Point, Point, Point] {
  const { breiteRoh: b, hoeheRoh: h } = rohGroesse
  return [
    rohZuWelt(blatt, { x: 0, y: 0 }),
    rohZuWelt(blatt, { x: b, y: 0 }),
    rohZuWelt(blatt, { x: b, y: h }),
    rohZuWelt(blatt, { x: 0, y: h }),
  ]
}

export function hintergrundRahmen(
  blatt: HintergrundLage,
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
): BoundingBox {
  const ecken = hintergrundEcken(blatt, rohGroesse)
  const xs = ecken.map((p) => p.x)
  const ys = ecken.map((p) => p.y)
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  }
}

export function ursprungFuerMitte(
  lage: Pick<Blatt, 'massstab' | 'hintergrundDrehung'>,
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  mitte: Point,
): Point {
  const rahmen = hintergrundRahmen({ ...lage, ursprung: { x: 0, y: 0 } }, rohGroesse)
  return {
    x: mitte.x - (rahmen.min.x + rahmen.max.x) / 2,
    y: mitte.y - (rahmen.min.y + rahmen.max.y) / 2,
  }
}
