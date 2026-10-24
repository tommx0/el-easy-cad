import type {
  KomponentenObjekt,
  Objekt,
  Point,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from '../document-model'
import {
  distance,
  getDockpoints,
  naechsterPunktAufPolylinie,
  rechtwinkligNachfuehren,
} from '../document-model'
import type {
  BelegungsAufruf,
  RoutingHindernisse,
  RoutingHindernisseEingabe,
  RoutingSettings,
} from '../routing'
import { ROUTING_ZELLGROESSE_METER, routePath, routingHindernisse } from '../routing'

export const SCHALTPLAN_SICHERHEITSABSTAND_METER = 0

export function schaltplanHindernisse(objekte: Objekt[]): RoutingHindernisse {
  return routingHindernisse(objekte, SCHALTPLAN_SICHERHEITSABSTAND_METER)
}

export function routeSchaltverbindung(
  von: Point,
  bis: Point,
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  belegung: BelegungsAufruf | null = null,
): Point[] | null {
  return routePath(von, bis, hindernisse, settings, ROUTING_ZELLGROESSE_METER, true, belegung)
}

const ABZWEIG_ANLAUF_METER = 2 * ROUTING_ZELLGROESSE_METER

function anlaufPunkt(
  anschluss: SchaltverbindungAnschluss,
  punkt: Point,
  gegenpunkt: Point,
  objekte: readonly Objekt[],
  eigeneId?: string,
): Point | null {
  if (anschluss.art === 'knoten')
    return knotenAnlauf(anschluss.objektId, punkt, gegenpunkt, objekte, eigeneId)
  if (anschluss.art !== 'schaltverbindung') return null
  const sammel = objekte.find((o) => o.id === anschluss.objektId)
  if (sammel?.type !== 'schaltverbindung' || sammel.wegpunkte.length < 2) return null
  const { segment } = naechsterPunktAufPolylinie(punkt, sammel.wegpunkte)
  const a = sammel.wegpunkte[segment]
  const b = sammel.wegpunkte[segment + 1]
  const laenge = distance(a, b)
  if (laenge < 1e-9) return null
  let nx = -(b.y - a.y) / laenge
  let ny = (b.x - a.x) / laenge
  if ((gegenpunkt.x - punkt.x) * nx + (gegenpunkt.y - punkt.y) * ny < 0) {
    nx = -nx
    ny = -ny
  }
  return { x: punkt.x + nx * ABZWEIG_ANLAUF_METER, y: punkt.y + ny * ABZWEIG_ANLAUF_METER }
}

function knotenAnlauf(
  knotenId: string,
  punkt: Point,
  gegenpunkt: Point,
  objekte: readonly Objekt[],
  eigeneId?: string,
): Point | null {
  const belegt: Point[] = []
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung' || o.id === eigeneId || o.wegpunkte.length < 2) continue
    const w = o.wegpunkte
    if (o.start.art === 'knoten' && o.start.objektId === knotenId) belegt.push(richtung(w[0], w[1]))
    if (o.ziel.art === 'knoten' && o.ziel.objektId === knotenId)
      belegt.push(richtung(w[w.length - 1], w[w.length - 2]))
  }
  const hin = { x: gegenpunkt.x - punkt.x, y: gegenpunkt.y - punkt.y }
  const frei = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ].filter((r) => !belegt.some((b) => b.x * r.x + b.y * r.y > 0.99))
  if (frei.length === 0) return null
  const beste = frei.sort((a, b) => b.x * hin.x + b.y * hin.y - (a.x * hin.x + a.y * hin.y))[0]
  return {
    x: punkt.x + beste.x * ABZWEIG_ANLAUF_METER,
    y: punkt.y + beste.y * ABZWEIG_ANLAUF_METER,
  }
}

function richtung(von: Point, nach: Point): Point {
  const l = distance(von, nach) || 1
  return { x: (nach.x - von.x) / l, y: (nach.y - von.y) / l }
}

function ohneGeradeZwischenpunkte(punkte: Point[]): Point[] {
  const ergebnis: Point[] = []
  for (const p of punkte) {
    const n = ergebnis.length
    if (n > 0 && distance(ergebnis[n - 1], p) < 1e-9) continue
    if (n >= 2) {
      const a = ergebnis[n - 2]
      const b = ergebnis[n - 1]
      const kreuz = (b.x - a.x) * (p.y - b.y) - (b.y - a.y) * (p.x - b.x)
      const skalar = (b.x - a.x) * (p.x - b.x) + (b.y - a.y) * (p.y - b.y)
      if (Math.abs(kreuz) < 1e-9 && skalar > 0) ergebnis.pop()
    }
    ergebnis.push(p)
  }
  return ergebnis
}

export function verlegeSchaltverbindung(
  von: Point,
  bis: Point,
  startAnschluss: SchaltverbindungAnschluss,
  zielAnschluss: SchaltverbindungAnschluss,
  objekte: readonly Objekt[],
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  belegung: BelegungsAufruf | null = null,
  eigeneId?: string,
): Point[] | null {
  const vonAnlauf = anlaufPunkt(startAnschluss, von, bis, objekte, eigeneId)
  const bisAnlauf = anlaufPunkt(zielAnschluss, bis, von, objekte, eigeneId)
  const pfad = routeSchaltverbindung(
    vonAnlauf ?? von,
    bisAnlauf ?? bis,
    hindernisse,
    settings,
    belegung,
  )
  if (!pfad) return null
  return ohneGeradeZwischenpunkte([
    ...(vonAnlauf ? [von] : []),
    ...pfad,
    ...(bisAnlauf ? [bis] : []),
  ])
}

function haengtAn(anschluss: SchaltverbindungAnschluss, komponentenIds: ReadonlySet<string>) {
  return anschluss.art === 'dock' && komponentenIds.has(anschluss.objektId)
}

export function betroffeneSchaltverbindungen(
  objekte: Objekt[],
  komponentenIds: ReadonlySet<string>,
): SchaltverbindungObjekt[] {
  return objekte.filter(
    (o): o is SchaltverbindungObjekt =>
      o.type === 'schaltverbindung' &&
      o.wegpunkte.length >= 2 &&
      (haengtAn(o.start, komponentenIds) || haengtAn(o.ziel, komponentenIds)),
  )
}

function dockpunktPosition(
  anschluss: SchaltverbindungAnschluss,
  komponenten: ReadonlyMap<string, KomponentenObjekt>,
  fallback: Point,
): Point {
  if (anschluss.art !== 'dock') return fallback
  const komponente = komponenten.get(anschluss.objektId)
  if (!komponente) return fallback
  return getDockpoints(komponente)[anschluss.dockpunktIndizes[0]] ?? fallback
}

export function berechneSchaltverbindungReroute(
  objekte: Objekt[],
  neueZustaende: ReadonlyMap<string, Partial<KomponentenObjekt>>,
  settings: RoutingSettings,
  ausgenommen: ReadonlySet<string> = new Set(),
  knotenNeu: ReadonlyMap<string, Point> = new Map(),
): Map<string, Point[]> {
  const ergebnis = new Map<string, Point[]>()
  if (neueZustaende.size === 0 && knotenNeu.size === 0) return ergebnis
  const komponentenIds = new Set(neueZustaende.keys())
  const amKnoten = (a: SchaltverbindungAnschluss) => a.art === 'knoten' && knotenNeu.has(a.objektId)
  const betroffen = objekte
    .filter(
      (o): o is SchaltverbindungObjekt =>
        o.type === 'schaltverbindung' &&
        o.wegpunkte.length >= 2 &&
        (haengtAn(o.start, komponentenIds) ||
          haengtAn(o.ziel, komponentenIds) ||
          amKnoten(o.start) ||
          amKnoten(o.ziel)),
    )
    .filter((s) => !ausgenommen.has(s.id))
  if (betroffen.length === 0) return ergebnis

  const virtuelleObjekte = objekte.map((o): Objekt => {
    if (o.type !== 'komponente') return o
    const patch = neueZustaende.get(o.id)
    return patch ? { ...o, ...patch } : o
  })
  const komponenten = new Map<string, KomponentenObjekt>()
  for (const o of virtuelleObjekte) if (o.type === 'komponente') komponenten.set(o.id, o)
  let hindernisse: RoutingHindernisseEingabe | null = null

  const lage = (a: SchaltverbindungAnschluss, alt: Point) =>
    haengtAn(a, komponentenIds)
      ? dockpunktPosition(a, komponenten, alt)
      : a.art === 'knoten'
        ? (knotenNeu.get(a.objektId) ?? alt)
        : alt
  for (const verbindung of betroffen) {
    const alt = verbindung.wegpunkte
    const von = lage(verbindung.start, alt[0])
    const bis = lage(verbindung.ziel, alt[alt.length - 1])
    if (verbindung.autoRouting) {
      hindernisse ??= schaltplanHindernisse(virtuelleObjekte)
      const pfad = verlegeSchaltverbindung(
        von,
        bis,
        verbindung.start,
        verbindung.ziel,
        virtuelleObjekte,
        hindernisse,
        settings,
        null,
        verbindung.id,
      )
      if (pfad && pfad.length >= 2) {
        ergebnis.set(verbindung.id, pfad)
        continue
      }
    }
    ergebnis.set(
      verbindung.id,
      rechtwinkligNachfuehren(rechtwinkligNachfuehren(alt, 'start', von), 'ziel', bis),
    )
  }
  return ergebnis
}
