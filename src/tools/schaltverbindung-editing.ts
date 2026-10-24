import type { KomponentenObjekt, Objekt, Point, SchaltverbindungAnschluss } from '../document-model'
import {
  distance,
  findeNaechstenDockpunkt,
  istSenkrecht,
  istWaagrecht,
  naechsterPunktAufPolylinie,
  rechtwinkligNachfuehren,
  vereinfacheWegpunkte,
} from '../document-model'

export type SchaltGriff =
  | { art: 'ende'; ende: 'start' | 'ziel' }
  | { art: 'ecke'; index: number }
  | { art: 'teilstueck'; index: number }

function mitte(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function findeSchaltGriff(
  wegpunkte: readonly Point[],
  punkt: Point,
  toleranz: number,
): SchaltGriff | null {
  const n = wegpunkte.length
  if (n < 2) return null
  if (distance(punkt, wegpunkte[0]) <= toleranz) return { art: 'ende', ende: 'start' }
  if (distance(punkt, wegpunkte[n - 1]) <= toleranz) return { art: 'ende', ende: 'ziel' }
  for (let i = 1; i < n - 1; i++)
    if (distance(punkt, wegpunkte[i]) <= toleranz) return { art: 'ecke', index: i }
  for (let i = 0; i < n - 1; i++)
    if (distance(punkt, mitte(wegpunkte[i], wegpunkte[i + 1])) <= toleranz)
      return { art: 'teilstueck', index: i }
  return null
}

function ausrichtung(a: Point, b: Point): 'w' | 's' | null {
  return istWaagrecht(a, b) ? 'w' : istSenkrecht(a, b) ? 's' : null
}

function teilstueckVerschieben(
  w: readonly Point[],
  i: number,
  ziel: Point,
  frei: boolean,
): Point[] {
  const n = w.length
  const a = w[i]
  const b = w[i + 1]
  const art = frei ? null : ausrichtung(a, b)
  const d = { x: ziel.x - mitte(a, b).x, y: ziel.y - mitte(a, b).y }
  const neu = (q: Point): Point =>
    art === 'w'
      ? { x: q.x, y: ziel.y }
      : art === 's'
        ? { x: ziel.x, y: q.y }
        : { x: q.x + d.x, y: q.y + d.y }
  const a2 = neu(a)
  const b2 = neu(b)
  const quer = (u: Point, v: Point) =>
    art !== null && ausrichtung(u, v) !== null && ausrichtung(u, v) !== art
  const linksErsetzen = i > 0 && quer(w[i - 1], a)
  const rechtsErsetzen = i + 1 < n - 1 && quer(b, w[i + 2])
  const links = linksErsetzen ? [...w.slice(0, i), a2] : [...w.slice(0, i + 1), a2]
  const rechts = rechtsErsetzen ? [b2, ...w.slice(i + 2)] : [b2, ...w.slice(i + 1)]
  return vereinfacheWegpunkte([...links, ...rechts])
}

function eckeVerschieben(w: readonly Point[], i: number, ziel: Point, frei: boolean): Point[] {
  if (frei) return vereinfacheWegpunkte(w.map((p, j) => (j === i ? ziel : p)))
  const n = w.length
  const nachbar = (j: number): Point | null => {
    const art = ausrichtung(w[j], w[i])
    if (art === 'w') return { x: w[j].x, y: ziel.y }
    if (art === 's') return { x: ziel.x, y: w[j].y }
    return null
  }
  const vor = nachbar(i - 1)
  const nach = nachbar(i + 1)
  const links = vor ? (i - 1 === 0 ? [w[0], vor] : [...w.slice(0, i - 1), vor]) : w.slice(0, i)
  const rechts = nach
    ? i + 1 === n - 1
      ? [nach, w[n - 1]]
      : [nach, ...w.slice(i + 2)]
    : w.slice(i + 1)
  return vereinfacheWegpunkte([...links, ziel, ...rechts])
}

export function zieheSchaltGriff(
  wegpunkte: readonly Point[],
  griff: SchaltGriff,
  ziel: Point,
  frei = false,
): Point[] {
  if (griff.art === 'teilstueck') return teilstueckVerschieben(wegpunkte, griff.index, ziel, frei)
  if (griff.art === 'ecke') return eckeVerschieben(wegpunkte, griff.index, ziel, frei)
  if (frei) {
    const i = griff.ende === 'start' ? 0 : wegpunkte.length - 1
    return wegpunkte.map((p, j) => (j === i ? ziel : p))
  }
  return vereinfacheWegpunkte(rechtwinkligNachfuehren(wegpunkte, griff.ende, ziel))
}

export function knickEinfuegen(
  wegpunkte: readonly Point[],
  punkt: Point,
  toleranz: number,
): { wegpunkte: Point[]; index: number } | null {
  const lage = naechsterPunktAufPolylinie(punkt, [...wegpunkte])
  if (lage.abstand > toleranz) return null
  const i = lage.segment
  return {
    wegpunkte: [...wegpunkte.slice(0, i + 1), lage.punkt, ...wegpunkte.slice(i + 1)],
    index: i + 1,
  }
}

export function knickEntfernen(wegpunkte: readonly Point[], index: number): Point[] {
  if (wegpunkte.length <= 2 || index <= 0 || index >= wegpunkte.length - 1) return [...wegpunkte]
  return vereinfacheWegpunkte(wegpunkte.filter((_, j) => j !== index))
}

export function sucheEndeZiel(
  objekte: readonly Objekt[],
  punkt: Point,
  toleranz: number,
  eigeneId: string,
): { anschluss: SchaltverbindungAnschluss; punkt: Point } | null {
  for (const o of objekte)
    if (o.type === 'knotenpunkt' && distance(o.position, punkt) <= toleranz)
      return { anschluss: { art: 'knoten', objektId: o.id }, punkt: o.position }
  const komponenten = objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
  const dock = findeNaechstenDockpunkt(komponenten, punkt, toleranz)
  if (dock)
    return {
      anschluss: { art: 'dock', objektId: dock.objektId, dockpunktIndizes: [dock.dockpunktIndex] },
      punkt: dock.punkt,
    }
  for (const o of objekte)
    if (o.type === 'potential' && distance(o.position, punkt) <= toleranz)
      return { anschluss: { art: 'potential', objektId: o.id }, punkt: o.position }
  let beste: { anschluss: SchaltverbindungAnschluss; punkt: Point; abstand: number } | null = null
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung' || o.id === eigeneId || o.wegpunkte.length < 2) continue
    const lage = naechsterPunktAufPolylinie(punkt, o.wegpunkte)
    if (lage.abstand <= toleranz && (!beste || lage.abstand < beste.abstand))
      beste = {
        anschluss: { art: 'schaltverbindung', objektId: o.id },
        punkt: lage.punkt,
        abstand: lage.abstand,
      }
  }
  return beste ? { anschluss: beste.anschluss, punkt: beste.punkt } : null
}
