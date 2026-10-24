import type { Point } from './geometry'
import { versetztePolylinie } from './wand'

export const SCHALTPLAN_POLABSTAND = 0.24

function linkeNormale(a: Point, b: Point): Point | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge = Math.hypot(dx, dy)
  if (laenge < 1e-9) return null
  return { x: -dy / laenge, y: dx / laenge }
}

export function standardAderSeite(punkte: Point[]): 1 | -1 {
  for (let i = 0; i < punkte.length - 1; i++) {
    const n = linkeNormale(punkte[i], punkte[i + 1])
    if (!n) continue
    const dx = Math.abs(punkte[i + 1].x - punkte[i].x)
    const dy = Math.abs(punkte[i + 1].y - punkte[i].y)
    const gewuenscht = dx < dy ? { x: 1, y: 0 } : { x: 0, y: -1 }
    return n.x * gewuenscht.x + n.y * gewuenscht.y >= 0 ? 1 : -1
  }
  return 1
}

export function ermittleAderverlaeufe(
  punkte: Point[],
  anzahl: number,
  seite: 1 | -1,
  abstand: number = SCHALTPLAN_POLABSTAND,
): Point[][] {
  const bereinigt = punkte.filter((p, i) => i === 0 || linkeNormale(punkte[i - 1], p) !== null)
  const verlaeufe: Point[][] = []
  for (let i = 0; i < anzahl; i++)
    verlaeufe.push(versetztePolylinie(bereinigt, seite * i * abstand))
  return verlaeufe
}
