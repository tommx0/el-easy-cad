import type { Point, WandObjekt } from '../document-model'

const SUCHWEITE_METER = 500
const PROBEN = [0.25, 0.5, 0.75]

function trifft(start: Point, richtung: Point, a: Point, b: Point): boolean {
  const ex = b.x - a.x
  const ey = b.y - a.y
  const nenner = richtung.x * ey - richtung.y * ex
  if (Math.abs(nenner) < 1e-12) return false
  const dx = a.x - start.x
  const dy = a.y - start.y
  const s = (dx * ey - dy * ex) / nenner
  const t = (dx * richtung.y - dy * richtung.x) / nenner
  return s > 1e-9 && s <= SUCHWEITE_METER && t >= 0 && t <= 1
}

export type WandAchse = Pick<WandObjekt, 'id' | 'punkte' | 'staerke'>

function segmente(wand: WandAchse): [Point, Point][] {
  const ergebnis: [Point, Point][] = []
  for (let i = 1; i < wand.punkte.length; i++) ergebnis.push([wand.punkte[i - 1], wand.punkte[i]])
  return ergebnis
}

export function aussenNormalen(wand: WandAchse, alleWaende: readonly WandAchse[]): Point[] {
  const andere = alleWaende.filter((w) => w.id !== wand.id).flatMap(segmente)
  const ergebnis: Point[] = []
  for (const [a, b] of segmente(wand)) {
    const laenge = Math.hypot(b.x - a.x, b.y - a.y)
    if (laenge < 1e-6) continue
    const d = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
    for (const n of [
      { x: -d.y, y: d.x },
      { x: d.y, y: -d.x },
    ]) {
      const abstand = wand.staerke / 2 + 0.02
      const treffer = PROBEN.filter((t) => {
        const start = {
          x: a.x + (b.x - a.x) * t + n.x * abstand,
          y: a.y + (b.y - a.y) * t + n.y * abstand,
        }
        return andere.some(([p, q]) => trifft(start, n, p, q))
      }).length
      const draussen = treffer < 2
      if (draussen && !ergebnis.some((e) => Math.abs(e.x - n.x) + Math.abs(e.y - n.y) < 1e-6))
        ergebnis.push(n)
    }
  }
  return ergebnis
}

export function istVorne(normalen: readonly Point[], mitte: Point, kamera: Point): boolean {
  const zur = { x: kamera.x - mitte.x, y: kamera.y - mitte.y }
  return normalen.some((n) => n.x * zur.x + n.y * zur.y > 0)
}
