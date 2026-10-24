import type { Point } from './geometry'

export const GLEICH = 1e-6

export function istWaagrecht(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) < GLEICH && Math.abs(a.x - b.x) >= GLEICH
}

export function istSenkrecht(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < GLEICH && Math.abs(a.y - b.y) >= GLEICH
}

function gleich(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < GLEICH && Math.abs(a.y - b.y) < GLEICH
}

export function vereinfacheWegpunkte(wegpunkte: readonly Point[]): Point[] {
  const ohneDoppelte: Point[] = []
  for (const p of wegpunkte)
    if (ohneDoppelte.length === 0 || !gleich(ohneDoppelte[ohneDoppelte.length - 1], p))
      ohneDoppelte.push(p)
  if (ohneDoppelte.length < 2) return [...wegpunkte.slice(0, 1), ...wegpunkte.slice(-1)]
  const ergebnis: Point[] = [ohneDoppelte[0]]
  for (let i = 1; i < ohneDoppelte.length - 1; i++) {
    const a = ergebnis[ergebnis.length - 1]
    const b = ohneDoppelte[i]
    const c = ohneDoppelte[i + 1]
    const kreuz = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
    const vorwaerts = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) >= 0
    if (Math.abs(kreuz) < GLEICH * GLEICH && vorwaerts) continue
    ergebnis.push(b)
  }
  ergebnis.push(ohneDoppelte[ohneDoppelte.length - 1])
  return ergebnis
}

export function rechtwinkligNachfuehren(
  wegpunkte: readonly Point[],
  ende: 'start' | 'ziel',
  neu: Point,
): Point[] {
  const n = wegpunkte.length
  if (n < 2) return [...wegpunkte]
  const index = ende === 'start' ? 0 : n - 1
  const nachbar = ende === 'start' ? 1 : n - 2
  const alt = wegpunkte[index]
  if (gleich(alt, neu)) return [...wegpunkte]
  const anderer = wegpunkte[nachbar]
  if (n === 2) {
    if (Math.abs(neu.x - anderer.x) < GLEICH || Math.abs(neu.y - anderer.y) < GLEICH)
      return ende === 'start' ? [neu, anderer] : [anderer, neu]
    let knick: Point | null = null
    if (istSenkrecht(alt, anderer)) knick = { x: neu.x, y: anderer.y }
    else if (istWaagrecht(alt, anderer)) knick = { x: anderer.x, y: neu.y }
    if (!knick) return ende === 'start' ? [neu, anderer] : [anderer, neu]
    return ende === 'start' ? [neu, knick, anderer] : [anderer, knick, neu]
  }
  const ergebnis = [...wegpunkte]
  if (istWaagrecht(alt, anderer)) ergebnis[nachbar] = { x: anderer.x, y: neu.y }
  else if (istSenkrecht(alt, anderer)) ergebnis[nachbar] = { x: neu.x, y: anderer.y }
  ergebnis[index] = neu
  return ergebnis
}

export function polylinienLaenge(wegpunkte: readonly Point[]): number {
  let summe = 0
  for (let i = 1; i < wegpunkte.length; i++)
    summe += Math.hypot(wegpunkte[i].x - wegpunkte[i - 1].x, wegpunkte[i].y - wegpunkte[i - 1].y)
  return summe
}
