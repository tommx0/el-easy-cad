import { getDockpoints } from './dockpoints'
import type { Point } from './geometry'
import { distance, naechsterPunktAufSegment } from './geometry'
import type { Objekt, SchaltverbindungAnschluss, SchaltverbindungObjekt } from './objekte'
import { rechtwinkligNachfuehren } from './schaltverbindung-geometrie'

const EPSILON = 1e-9
const PARALLEL_TOLERANZ = 0.05

export interface PunktAufLinie {
  punkt: Point
  segment: number
  abstand: number
}

export function naechsterPunktAufPolylinie(p: Point, wegpunkte: Point[]): PunktAufLinie {
  let bestes: PunktAufLinie = {
    punkt: wegpunkte[0],
    segment: 0,
    abstand: distance(p, wegpunkte[0]),
  }
  for (let i = 0; i < wegpunkte.length - 1; i++) {
    const punkt = naechsterPunktAufSegment(p, wegpunkte[i], wegpunkte[i + 1])
    const abstand = distance(p, punkt)
    if (abstand < bestes.abstand) bestes = { punkt, segment: i, abstand }
  }
  return bestes
}

interface Schnitt {
  punkt: Point
  t: number
  segment: number
}

function schnitteMitPolylinie(aufpunkt: Point, richtung: Point, wegpunkte: Point[]): Schnitt[] {
  const schnitte: Schnitt[] = []
  for (let i = 0; i < wegpunkte.length - 1; i++) {
    const a = wegpunkte[i]
    const s = { x: wegpunkte[i + 1].x - a.x, y: wegpunkte[i + 1].y - a.y }
    const nenner = richtung.x * s.y - richtung.y * s.x
    if (Math.abs(nenner) < EPSILON) continue
    const d = { x: a.x - aufpunkt.x, y: a.y - aufpunkt.y }
    const t = (d.x * s.y - d.y * s.x) / nenner
    const u = (d.x * richtung.y - d.y * richtung.x) / nenner
    if (u < -EPSILON || u > 1 + EPSILON) continue
    schnitte.push({
      punkt: { x: aufpunkt.x + t * richtung.x, y: aufpunkt.y + t * richtung.y },
      t,
      segment: i,
    })
  }
  return schnitte
}

function endTeilstueck(
  wegpunkte: Point[],
  ende: 'start' | 'ziel',
): { nachbar: Point; endpunkt: Point } {
  const n = wegpunkte.length
  return ende === 'ziel'
    ? { nachbar: wegpunkte[n - 2], endpunkt: wegpunkte[n - 1] }
    : { nachbar: wegpunkte[1], endpunkt: wegpunkte[0] }
}

export function abzweigEndpunkt(
  wegpunkte: Point[],
  ende: 'start' | 'ziel',
  sammel: Point[],
): Point {
  if (wegpunkte.length < 2 || sammel.length < 2) {
    const endpunkt = ende === 'ziel' ? wegpunkte[wegpunkte.length - 1] : wegpunkte[0]
    return sammel.length > 0 ? naechsterPunktAufPolylinie(endpunkt, sammel).punkt : endpunkt
  }
  const { nachbar, endpunkt } = endTeilstueck(wegpunkte, ende)
  const richtung = { x: endpunkt.x - nachbar.x, y: endpunkt.y - nachbar.y }
  if (Math.hypot(richtung.x, richtung.y) < EPSILON)
    return naechsterPunktAufPolylinie(endpunkt, sammel).punkt
  const vorwaerts = schnitteMitPolylinie(nachbar, richtung, sammel).filter((s) => s.t > EPSILON)
  if (vorwaerts.length === 0) return naechsterPunktAufPolylinie(endpunkt, sammel).punkt
  vorwaerts.sort((a, b) => Math.abs(a.t - 1) - Math.abs(b.t - 1))
  return vorwaerts[0].punkt
}

export const GERADE_AUSRICHTEN_PAPIER_METER = 0.01

export function geradeAufSchaltverbindung(
  anker: Point,
  klick: Point,
  linie: readonly Point[],
  maxVersatz: number,
): Point {
  let bester = klick
  let besterAbstand = Infinity
  for (let i = 0; i + 1 < linie.length; i++) {
    const a = linie[i]
    const b = linie[i + 1]
    for (const kandidat of [
      schnittMitAchse(a, b, 'x', anker.x),
      schnittMitAchse(a, b, 'y', anker.y),
    ]) {
      if (!kandidat || distance(kandidat, anker) < EPSILON) continue
      const abstand = distance(kandidat, klick)
      if (abstand <= maxVersatz + EPSILON && abstand < besterAbstand) {
        bester = kandidat
        besterAbstand = abstand
      }
    }
  }
  return bester
}

function schnittMitAchse(a: Point, b: Point, achse: 'x' | 'y', wert: number): Point | null {
  const d = b[achse] - a[achse]
  if (Math.abs(d) < EPSILON) return null
  const t = (wert - a[achse]) / d
  if (t < -EPSILON || t > 1 + EPSILON) return null
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
}

export interface SchaltverbindungTreffer {
  objekt: SchaltverbindungObjekt
  punkt: Point
  segment: number
}

export function sucheSchaltverbindungTreffer(
  objekte: readonly Objekt[],
  p: Point,
  toleranz: number,
  ausser: ReadonlySet<string> = new Set(),
): SchaltverbindungTreffer | null {
  let bestes: SchaltverbindungTreffer | null = null
  let besterAbstand = toleranz
  for (const objekt of objekte) {
    if (objekt.type !== 'schaltverbindung' || ausser.has(objekt.id)) continue
    if (objekt.wegpunkte.length < 2) continue
    const naechster = naechsterPunktAufPolylinie(p, objekt.wegpunkte)
    if (naechster.abstand <= besterAbstand) {
      bestes = { objekt, punkt: naechster.punkt, segment: naechster.segment }
      besterAbstand = naechster.abstand
    }
  }
  return bestes
}

function einheit(a: Point, b: Point): Point | null {
  const laenge = distance(a, b)
  return laenge < EPSILON ? null : { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
}

export function ordneSammelleitung(
  objekte: readonly Objekt[],
  getroffen: SchaltverbindungTreffer,
  ersteAder: { nachbar: Point; endpunkt: Point },
  ausser: ReadonlySet<string> = new Set(),
): SchaltverbindungObjekt[] {
  const richtung = einheit(ersteAder.nachbar, ersteAder.endpunkt)
  const sammelRichtung = einheit(
    getroffen.objekt.wegpunkte[getroffen.segment],
    getroffen.objekt.wegpunkte[getroffen.segment + 1],
  )
  if (!richtung || !sammelRichtung) return [getroffen.objekt]
  const t0 =
    (getroffen.punkt.x - ersteAder.endpunkt.x) * richtung.x +
    (getroffen.punkt.y - ersteAder.endpunkt.y) * richtung.y

  const kandidaten: { objekt: SchaltverbindungObjekt; versatz: number }[] = []
  for (const objekt of objekte) {
    if (objekt.type !== 'schaltverbindung' || objekt.id === getroffen.objekt.id) continue
    if (ausser.has(objekt.id)) continue
    const schnitte = schnitteMitPolylinie(ersteAder.endpunkt, richtung, objekt.wegpunkte).filter(
      (s) => {
        const r = einheit(objekt.wegpunkte[s.segment], objekt.wegpunkte[s.segment + 1])
        return (
          r !== null &&
          Math.abs(r.x * sammelRichtung.y - r.y * sammelRichtung.x) < PARALLEL_TOLERANZ
        )
      },
    )
    if (schnitte.length === 0) continue
    const naechster = schnitte.reduce((a, b) => (Math.abs(a.t - t0) <= Math.abs(b.t - t0) ? a : b))
    kandidaten.push({ objekt, versatz: naechster.t - t0 })
  }

  const alleBenannt =
    Boolean(getroffen.objekt.bezeichnung) && kandidaten.every((k) => Boolean(k.objekt.bezeichnung))
  if (alleBenannt) {
    const vergleiche = (a: SchaltverbindungObjekt, b: SchaltverbindungObjekt) =>
      (a.bezeichnung ?? '').localeCompare(b.bezeichnung ?? '', 'de', { numeric: true })
    const danach = kandidaten
      .map((k) => k.objekt)
      .filter((o) => vergleiche(o, getroffen.objekt) > 0)
      .sort(vergleiche)
    return [getroffen.objekt, ...danach]
  }
  const zurueck = kandidaten.filter((k) => k.versatz < 0).sort((a, b) => b.versatz - a.versatz)
  const voraus = kandidaten.filter((k) => k.versatz > 0).sort((a, b) => a.versatz - b.versatz)
  return [getroffen.objekt, ...(zurueck.length > 0 ? zurueck : voraus).map((k) => k.objekt)]
}

export function treppenEndpunkt(
  wegpunkte: Point[],
  ende: 'start' | 'ziel',
  partner: Point[],
): Point | null {
  if (wegpunkte.length < 2) return null
  const { nachbar, endpunkt } = endTeilstueck(wegpunkte, ende)
  const richtung = { x: endpunkt.x - nachbar.x, y: endpunkt.y - nachbar.y }
  if (Math.hypot(richtung.x, richtung.y) < EPSILON) return null
  const vorwaerts = schnitteMitPolylinie(nachbar, richtung, partner).filter((s) => s.t > EPSILON)
  if (vorwaerts.length === 0) return null
  vorwaerts.sort((a, b) => Math.abs(a.t - 1) - Math.abs(b.t - 1))
  return vorwaerts[0].punkt
}

const MAX_RUNDEN = 4

export function fuehreSchaltverbindungenNach(objekte: Objekt[]): Objekt[] {
  if (!objekte.some((o) => o.type === 'schaltverbindung')) return objekte
  let stand = objekte
  for (let runde = 0; runde < MAX_RUNDEN; runde++) {
    const nachId = new Map(stand.map((o) => [o.id, o]))
    let geaendert = false
    const neu = stand.map((objekt) => {
      if (objekt.type !== 'schaltverbindung' || objekt.wegpunkte.length < 2) return objekt
      let wegpunkte = objekt.wegpunkte
      let start = objekt.start
      let ziel = objekt.ziel
      for (const ende of ['start', 'ziel'] as const) {
        const anschluss = ende === 'start' ? start : ziel
        const ergebnis = loeseAnschlussAuf(anschluss, objekt.id, wegpunkte, ende, nachId)
        if (!ergebnis) continue
        const index = ende === 'start' ? 0 : wegpunkte.length - 1
        if (ergebnis.anschluss !== anschluss) {
          if (ende === 'start') start = ergebnis.anschluss
          else ziel = ergebnis.anschluss
        }
        if (ergebnis.punkt && distance(ergebnis.punkt, wegpunkte[index]) > EPSILON) {
          wegpunkte = rechtwinkligNachfuehren(wegpunkte, ende, ergebnis.punkt)
        }
      }
      if (wegpunkte === objekt.wegpunkte && start === objekt.start && ziel === objekt.ziel)
        return objekt
      geaendert = true
      return { ...objekt, wegpunkte, start, ziel }
    })
    if (!geaendert) return stand
    stand = neu
  }
  return stand
}

function loeseAnschlussAuf(
  anschluss: SchaltverbindungAnschluss,
  eigeneId: string,
  wegpunkte: Point[],
  ende: 'start' | 'ziel',
  nachId: Map<string, Objekt>,
): { anschluss: SchaltverbindungAnschluss; punkt: Point | null } | null {
  if (anschluss.art === 'frei') return null
  const ziel = nachId.get(anschluss.objektId)
  const frei = { anschluss: { art: 'frei' } as const, punkt: null }
  if (anschluss.art === 'dock') {
    if (ziel?.type !== 'komponente') return frei
    const punkt = getDockpoints(ziel)[anschluss.dockpunktIndizes[0]]
    return punkt ? { anschluss, punkt } : frei
  }
  if (anschluss.art === 'potential') {
    return ziel?.type === 'potential' ? { anschluss, punkt: ziel.position } : frei
  }
  if (anschluss.art === 'knoten') {
    return ziel?.type === 'knotenpunkt' ? { anschluss, punkt: ziel.position } : frei
  }
  if (ziel?.type !== 'schaltverbindung' || ziel.id === eigeneId || ziel.wegpunkte.length < 2)
    return frei
  return { anschluss, punkt: abzweigEndpunkt(wegpunkte, ende, ziel.wegpunkte) }
}
