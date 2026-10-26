export interface P {
  x: number
  y: number
}

export type Matrix = readonly [number, number, number, number, number, number]

export const EINHEIT: Matrix = [1, 0, 0, 1, 0, 0]

export function grad(rad: number): number {
  return (rad * 180) / Math.PI
}

export function rad(grad: number): number {
  return (grad * Math.PI) / 180
}

export function anwenden(m: Matrix, p: P): P {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] }
}

export function verketten(aussen: Matrix, innen: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = aussen
  const [a2, b2, c2, d2, e2, f2] = innen
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ]
}

export function invertieren(m: Matrix): Matrix {
  const [a, b, c, d, e, f] = m
  const det = a * d - b * c
  if (Math.abs(det) < 1e-12) return EINHEIT
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]
}

export function verschiebung(dx: number, dy: number): Matrix {
  return [1, 0, 0, 1, dx, dy]
}

export function skalierung(sx: number, sy: number, um: P = { x: 0, y: 0 }): Matrix {
  return [sx, 0, 0, sy, um.x - sx * um.x, um.y - sy * um.y]
}

export function drehung(winkelGrad: number, um: P = { x: 0, y: 0 }): Matrix {
  const cos = Math.cos(rad(winkelGrad))
  const sin = Math.sin(rad(winkelGrad))
  return [cos, sin, -sin, cos, um.x - cos * um.x + sin * um.y, um.y - sin * um.x - cos * um.y]
}

export function alsAehnlichkeit(
  m: Matrix,
): { massstab: number; winkel: number; gespiegelt: boolean } | null {
  const [a, b, c, d] = m
  const s1 = a * a + b * b
  const s2 = c * c + d * d
  if (
    Math.abs(s1 - s2) > 1e-6 * Math.max(1, s1) ||
    Math.abs(a * c + b * d) > 1e-6 * Math.max(1, s1)
  ) {
    return null
  }
  const det = a * d - b * c
  return { massstab: Math.sqrt(s1), winkel: grad(Math.atan2(b, a)), gespiegelt: det < 0 }
}

export function mittlererMassstab(m: Matrix): number {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))
}

export function abstand(a: P, b: P): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function abstandZurStrecke(p: P, a: P, b: P): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  if (laenge2 === 0) return abstand(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2))
  return abstand(p, { x: a.x + t * dx, y: a.y + t * dy })
}

export function abstandZumLinienzug(p: P, punkte: P[], geschlossen: boolean): number {
  if (punkte.length === 0) return Infinity
  if (punkte.length === 1) return abstand(p, punkte[0])
  let min = Infinity
  const n = geschlossen ? punkte.length : punkte.length - 1
  for (let i = 0; i < n; i++) {
    min = Math.min(min, abstandZurStrecke(p, punkte[i], punkte[(i + 1) % punkte.length]))
  }
  return min
}

export function punktImPolygon(p: P, punkte: P[]): boolean {
  let innen = false
  for (let i = 0, j = punkte.length - 1; i < punkte.length; j = i++) {
    const a = punkte[i]
    const b = punkte[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      innen = !innen
    }
  }
  return innen
}

export interface Rahmen {
  x: number
  y: number
  breite: number
  hoehe: number
}

export function rahmenUm(punkte: P[]): Rahmen | null {
  if (punkte.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of punkte) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { x: minX, y: minY, breite: maxX - minX, hoehe: maxY - minY }
}

export function rahmenEcken(r: Rahmen): P[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.breite, y: r.y },
    { x: r.x + r.breite, y: r.y + r.hoehe },
    { x: r.x, y: r.y + r.hoehe },
  ]
}

export function rahmenMitte(r: Rahmen): P {
  return { x: r.x + r.breite / 2, y: r.y + r.hoehe / 2 }
}

export function rahmenSchneiden(a: Rahmen, b: Rahmen): boolean {
  return (
    a.x <= b.x + b.breite && b.x <= a.x + a.breite && a.y <= b.y + b.hoehe && b.y <= a.y + a.hoehe
  )
}

export function rahmenEnthaelt(aussen: Rahmen, innen: Rahmen): boolean {
  return (
    innen.x >= aussen.x &&
    innen.y >= aussen.y &&
    innen.x + innen.breite <= aussen.x + aussen.breite &&
    innen.y + innen.hoehe <= aussen.y + aussen.hoehe
  )
}

export function kubischBei(p0: P, c1: P, c2: P, p1: P, t: number): P {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
  }
}

export function quadratischBei(p0: P, c: P, p1: P, t: number): P {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  }
}

export function bogenAlsKubisch(
  mitte: P,
  rx: number,
  ry: number,
  drehungGrad: number,
  startGrad: number,
  spanneGrad: number,
): { c1: P; c2: P; p: P }[] {
  const stuecke = Math.max(1, Math.ceil(Math.abs(spanneGrad) / 90 - 1e-9))
  const schritt = rad(spanneGrad / stuecke)
  const k = (4 / 3) * Math.tan(schritt / 4)
  const m = verketten(verschiebung(mitte.x, mitte.y), drehung(drehungGrad))
  const aufEllipse = (w: number, f: number) =>
    anwenden(m, {
      x: rx * (Math.cos(w) - f * Math.sin(w)),
      y: ry * (Math.sin(w) + f * Math.cos(w)),
    })
  const ergebnis: { c1: P; c2: P; p: P }[] = []
  let w = rad(startGrad)
  for (let i = 0; i < stuecke; i++) {
    const w2 = w + schritt
    ergebnis.push({ c1: aufEllipse(w, k), c2: aufEllipse(w2, -k), p: aufEllipse(w2, 0) })
    w = w2
  }
  return ergebnis
}

export function einrasten(wert: number, raster: number): number {
  return raster > 0 ? Math.round(wert / raster) * raster : wert
}

export function runde(wert: number, stellen = 2): number {
  const f = 10 ** stellen
  const r = Math.round(wert * f) / f
  return Object.is(r, -0) ? 0 : r
}
