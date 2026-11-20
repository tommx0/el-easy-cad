import type { Point } from '../document-model'
import type { Pfeil } from '../document-model'

export function pfeilLaengePx(strichstaerke: number): number {
  return Math.max(8, strichstaerke * 4)
}

export function pfeilDreieck(spitze: Point, von: Point, laengePx: number): Point[] | null {
  const dx = spitze.x - von.x
  const dy = spitze.y - von.y
  const l = Math.hypot(dx, dy)
  if (l < 1e-9) return null
  const ex = dx / l
  const ey = dy / l
  const halb = laengePx * 0.4
  const basis = { x: spitze.x - ex * laengePx, y: spitze.y - ey * laengePx }
  return [
    spitze,
    { x: basis.x - ey * halb, y: basis.y + ex * halb },
    { x: basis.x + ey * halb, y: basis.y - ex * halb },
  ]
}

export function pfeilspitzen(
  punkte: Point[],
  pfeil: Pfeil | undefined,
  laengePx: number,
): Point[][] {
  if (!pfeil || punkte.length < 2) return []
  const ergebnis: Point[][] = []
  const anEnde = (spitze: Point, rest: Point[]) => {
    const von = rest.find((p) => Math.hypot(p.x - spitze.x, p.y - spitze.y) > 1e-9)
    if (!von) return
    const dreieck = pfeilDreieck(spitze, von, laengePx)
    if (dreieck) ergebnis.push(dreieck)
  }
  if (pfeil === 'anfang' || pfeil === 'beide') anEnde(punkte[0], punkte.slice(1))
  if (pfeil === 'ende' || pfeil === 'beide') {
    anEnde(punkte[punkte.length - 1], punkte.slice(0, -1).reverse())
  }
  return ergebnis
}
