import type { LeitungsObjekt, Objekt, Point } from '../document-model'
import type { WandStrecke } from '../routing'

const MAX_BAHNEN = 8
const MIN_STUECK_METER = 0.25
const WAND_NAEHE = 0.3
const GLEICH = 1e-3
const UEBERLAPP_MIN = 0.01

type Strecke = [Point, Point]

function strecken(linie: readonly Point[]): Strecke[] {
  return linie.slice(1).map((p, i) => [linie[i], p])
}

export function belegteStrecken(objekte: readonly Objekt[], ohne: ReadonlySet<string>): Strecke[] {
  return objekte.flatMap((o) =>
    o.type === 'leitung' && !ohne.has(o.id) ? o.pfadSegmente.flatMap(strecken) : [],
  )
}

export function streckenVon(segmente: readonly Point[][]): Strecke[] {
  return segmente.flatMap(strecken)
}

function naechsteWand(m: Point, waende: readonly WandStrecke[]): Point | null {
  let beste: { abstand: number; punkt: Point } | null = null
  for (const w of waende) {
    const dx = w.b.x - w.a.x
    const dy = w.b.y - w.a.y
    const l2 = dx * dx + dy * dy
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((m.x - w.a.x) * dx + (m.y - w.a.y) * dy) / l2)) : 0
    const punkt = { x: w.a.x + t * dx, y: w.a.y + t * dy }
    const abstand = Math.hypot(m.x - punkt.x, m.y - punkt.y) - w.halbeStaerke
    if (abstand <= WAND_NAEHE && (!beste || abstand < beste.abstand)) beste = { abstand, punkt }
  }
  return beste?.punkt ?? null
}

function deckt(a: Point, b: Point, belegt: readonly Strecke[]): boolean {
  const laenge = Math.hypot(b.x - a.x, b.y - a.y)
  const u = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
  for (const [c, d] of belegt) {
    const lf = Math.hypot(d.x - c.x, d.y - c.y)
    if (lf < 1e-9) continue
    if (Math.abs(((d.x - c.x) * u.y - (d.y - c.y) * u.x) / lf) > GLEICH) continue
    if (Math.abs((c.x - a.x) * u.y - (c.y - a.y) * u.x) > GLEICH) continue
    const tc = (c.x - a.x) * u.x + (c.y - a.y) * u.y
    const td = (d.x - a.x) * u.x + (d.y - a.y) * u.y
    if (Math.min(laenge, Math.max(tc, td)) - Math.max(0, Math.min(tc, td)) > UEBERLAPP_MIN)
      return true
  }
  return false
}

function abschnittInFreieBahn(
  punkte: readonly Point[],
  belegt: readonly Strecke[],
  abstand: number,
  waende: readonly WandStrecke[],
): Point[] {
  if (punkte.length < 2 || abstand <= 0) return [...punkte]
  const anzahl = punkte.length - 1
  const versaetze = strecken(punkte).map(([a, b], j): Point => {
    const laenge = Math.hypot(b.x - a.x, b.y - a.y)
    const amEnde = anzahl > 1 && (j === 0 || j === anzahl - 1)
    if (amEnde || laenge < MIN_STUECK_METER || !deckt(a, b, belegt)) return { x: 0, y: 0 }
    const u = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
    let n = { x: -u.y, y: u.x }
    const mitte = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const wand = naechsteWand(mitte, waende)
    const seite = wand
      ? n.x * (mitte.x - wand.x) + n.y * (mitte.y - wand.y)
      : Math.abs(n.x) > Math.abs(n.y)
        ? n.x
        : n.y
    if (seite < 0) n = { x: -n.x, y: -n.y }
    for (let k = 1; k <= MAX_BAHNEN; k++) {
      const v = { x: n.x * k * abstand, y: n.y * k * abstand }
      const a2 = { x: a.x + v.x, y: a.y + v.y }
      const b2 = { x: b.x + v.x, y: b.y + v.y }
      if (!deckt(a2, b2, belegt)) return v
    }
    return { x: 0, y: 0 }
  })
  const plus = (p: Point, ...v: Point[]) => v.reduce((q, w) => ({ x: q.x + w.x, y: q.y + w.y }), p)
  const n = punkte.length
  const innen = punkte.map((p, i) =>
    i === 0 || i === n - 1 ? p : plus(p, versaetze[i - 1], versaetze[i]),
  )
  const ergebnis: Point[] = [innen[0]]
  const erster = versaetze[0]
  if (erster.x !== 0 || erster.y !== 0) ergebnis.push(plus(punkte[0], erster))
  ergebnis.push(...innen.slice(1, -1))
  const letzter = versaetze[versaetze.length - 1]
  if (letzter.x !== 0 || letzter.y !== 0) ergebnis.push(plus(punkte[n - 1], letzter))
  ergebnis.push(innen[n - 1])
  return ergebnis.filter(
    (p, i) => i === 0 || Math.hypot(p.x - ergebnis[i - 1].x, p.y - ergebnis[i - 1].y) > 1e-9,
  )
}

export function inFreieBahnen(
  segmente: readonly Point[][],
  belegt: readonly Strecke[],
  abstand: number,
  waende: readonly WandStrecke[],
): Point[][] {
  return segmente.map((s) => abschnittInFreieBahn(s, belegt, abstand, waende))
}

export function vergebeBahnen(
  objekte: readonly Objekt[],
  neu: ReadonlyMap<string, Point[][]>,
  abstand: number,
  waende: readonly WandStrecke[],
): Map<string, Point[][]> {
  if (!(abstand > 0)) return new Map(neu)
  const ergebnis = new Map<string, Point[][]>()
  const belegt = belegteStrecken(objekte, new Set(neu.keys()))
  for (const [id, segmente] of neu) {
    const leitung = objekte.find((o): o is LeitungsObjekt => o.type === 'leitung' && o.id === id)
    const bahnen = leitung?.autoRoutingAus
      ? segmente
      : inFreieBahnen(segmente, belegt, abstand, waende)
    ergebnis.set(id, bahnen)
    belegt.push(...streckenVon(bahnen))
  }
  return ergebnis
}
