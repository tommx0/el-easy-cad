import type { Point } from '../document-model'
import { snapAufGrid } from '../rendering'

export function wendeSnapAn(punkt: Point, aktiv: boolean, schritt: number, bezug?: Point): Point {
  return aktiv ? snapAufGrid(punkt, schritt, bezug) : punkt
}

export function fangpunktVerschiebung(
  fangStart: Point,
  rohDelta: Point,
  schritt: number,
  bezug?: Point,
): Point {
  const ziel = snapAufGrid(
    { x: fangStart.x + rohDelta.x, y: fangStart.y + rohDelta.y },
    schritt,
    bezug,
  )
  return { x: ziel.x - fangStart.x, y: ziel.y - fangStart.y }
}

export function wendeWinkelSnapAn(start: Point, punkt: Point, aktiv: boolean): Point {
  if (!aktiv) return punkt
  const dx = punkt.x - start.x
  const dy = punkt.y - start.y
  const laenge = Math.hypot(dx, dy)
  if (laenge === 0) return punkt
  const winkel = Math.atan2(dy, dx)
  const schritt = Math.PI / 4
  const gefangenerWinkel = Math.round(winkel / schritt) * schritt
  return {
    x: start.x + Math.cos(gefangenerWinkel) * laenge,
    y: start.y + Math.sin(gefangenerWinkel) * laenge,
  }
}
