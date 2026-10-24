import type { Point } from './geometry'
import type { Objekt, SchaltverbindungAnschluss, SchaltverbindungObjekt } from './objekte'

const EPSILON = 1e-6
const GLEICHE_RICHTUNG = 1 - 1e-6

function anschlussSchluessel(anschluss: SchaltverbindungAnschluss): string | null {
  if (anschluss.art === 'dock') return `dock:${anschluss.objektId}:${anschluss.dockpunktIndizes[0]}`
  if (anschluss.art === 'potential') return `potential:${anschluss.objektId}`
  if (anschluss.art === 'knoten') return `knoten:${anschluss.objektId}`
  return null
}

function verbundeneGruppen(verbindungen: SchaltverbindungObjekt[]): SchaltverbindungObjekt[][] {
  const eltern = new Map<string, string>(verbindungen.map((v) => [v.id, v.id]))
  const wurzel = (id: string): string => {
    let w = id
    while (eltern.get(w) !== w) w = eltern.get(w)!
    eltern.set(id, w)
    return w
  }
  const vereinige = (a: string, b: string) => {
    if (eltern.has(a) && eltern.has(b)) eltern.set(wurzel(a), wurzel(b))
  }
  const erstesAn = new Map<string, string>()
  for (const v of verbindungen) {
    for (const anschluss of [v.start, v.ziel]) {
      if (anschluss.art === 'schaltverbindung') {
        vereinige(v.id, anschluss.objektId)
        continue
      }
      const schluessel = anschlussSchluessel(anschluss)
      if (!schluessel) continue
      const erste = erstesAn.get(schluessel)
      if (erste) vereinige(v.id, erste)
      else erstesAn.set(schluessel, v.id)
    }
  }
  const gruppen = new Map<string, SchaltverbindungObjekt[]>()
  for (const v of verbindungen) {
    const w = wurzel(v.id)
    gruppen.set(w, [...(gruppen.get(w) ?? []), v])
  }
  return [...gruppen.values()].filter((g) => g.length >= 2)
}

function einheit(von: Point, nach: Point): Point {
  const dx = nach.x - von.x
  const dy = nach.y - von.y
  const laenge = Math.hypot(dx, dy)
  return { x: dx / laenge, y: dy / laenge }
}

function richtungenAb(p: Point, a: Point, b: Point): Point[] {
  const laenge = Math.hypot(b.x - a.x, b.y - a.y)
  if (laenge < EPSILON) return []
  if (Math.hypot(p.x - a.x, p.y - a.y) < EPSILON) return [einheit(a, b)]
  if (Math.hypot(p.x - b.x, p.y - b.y) < EPSILON) return [einheit(b, a)]
  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (laenge * laenge)
  if (t <= 0 || t >= 1) return []
  const lot = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
  if (Math.hypot(p.x - lot.x, p.y - lot.y) >= EPSILON) return []
  return [einheit(a, b), einheit(b, a)]
}

export function ermittleKnotenpunkte(objekte: readonly Objekt[]): Point[] {
  const verbindungen = objekte.filter(
    (o): o is SchaltverbindungObjekt => o.type === 'schaltverbindung' && o.wegpunkte.length >= 2,
  )
  const knoten: Point[] = []
  for (const gruppe of verbundeneGruppen(verbindungen)) {
    const strecken: [Point, Point][] = gruppe.flatMap((v) =>
      v.wegpunkte.slice(1).map((b, i): [Point, Point] => [v.wegpunkte[i], b]),
    )
    const kandidaten: Point[] = []
    for (const p of gruppe.flatMap((v) => v.wegpunkte)) {
      if (!kandidaten.some((k) => Math.hypot(k.x - p.x, k.y - p.y) < EPSILON)) kandidaten.push(p)
    }
    for (const p of kandidaten) {
      const richtungen: Point[] = []
      for (const [a, b] of strecken) {
        for (const r of richtungenAb(p, a, b)) {
          if (!richtungen.some((q) => q.x * r.x + q.y * r.y > GLEICHE_RICHTUNG)) richtungen.push(r)
        }
      }
      if (richtungen.length >= 3) knoten.push(p)
    }
  }
  return knoten
}
