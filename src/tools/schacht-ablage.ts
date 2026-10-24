import type {
  BlattGeschoss,
  KabelschachtObjekt,
  LeitungsObjekt,
  Objekt,
  Point,
  TrunkObjekt,
} from '../document-model'
import {
  distanceToPolyline,
  istKabelschacht,
  pointInPolygon,
  rechteckEcken,
  schachtAnschlussPunkt,
} from '../document-model'
import { fuerLeitung, routePath, routingHindernisse } from '../routing'
import type { RoutingSettings } from '../routing'

export interface SchachtAblageZiel {
  schachtId: string
  punkt: Point
}

export function findeSchachtAblageZiel(
  objekte: readonly Objekt[],
  welt: Point,
  toleranz: number,
): SchachtAblageZiel | null {
  for (let i = objekte.length - 1; i >= 0; i--) {
    const objekt = objekte[i]
    if (!istKabelschacht(objekt)) continue
    const ecken = rechteckEcken(objekt)
    if (pointInPolygon(welt, ecken) || distanceToPolyline(welt, ecken, true) <= toleranz) {
      return { schachtId: objekt.id, punkt: schachtAnschlussPunkt(objekt, welt) }
    }
  }
  return null
}

function nachbarPunkt(pfad: readonly Point[], amAnfang: boolean): Point | null {
  if (pfad.length === 0) return null
  if (pfad.length === 1) return pfad[0]
  return amAnfang ? pfad[1] : pfad[pfad.length - 2]
}

function schachtVon(
  schaechte: ReadonlyMap<string, KabelschachtObjekt>,
  ref: { objektId: string } | undefined,
): KabelschachtObjekt | null {
  if (!ref) return null
  return schaechte.get(ref.objektId) ?? null
}

function letzterSegmentIndex(leitung: LeitungsObjekt): number {
  for (let i = leitung.pfadSegmente.length - 1; i >= 0; i--) {
    if (leitung.pfadSegmente[i].length > 0) return i
  }
  return -1
}

export function schachtAnschluesseNachfuehren(objekte: Objekt[]): Objekt[] {
  const schaechte = new Map<string, KabelschachtObjekt>()
  for (const o of objekte) if (istKabelschacht(o)) schaechte.set(o.id, o)
  if (schaechte.size === 0) return objekte

  return objekte.map((o): Objekt => {
    if (o.type === 'trunk') {
      if (!o.enden.some((e) => e.schachtRef)) return o
      const wegpunkte = [...o.wegpunkte]
      let geaendert = false
      o.enden.forEach((ende, index) => {
        const schacht = schachtVon(schaechte, ende.schachtRef)
        if (!schacht) return
        const amAnfang = index === 0
        const referenz = nachbarPunkt(wegpunkte, amAnfang)
        if (!referenz) return
        wegpunkte[amAnfang ? 0 : wegpunkte.length - 1] = schachtAnschlussPunkt(schacht, referenz)
        geaendert = true
      })
      return geaendert ? { ...o, wegpunkte } : o
    }
    if (o.type === 'leitung') {
      const startSchacht =
        o.start.art === 'schacht' ? schachtVon(schaechte, { objektId: o.start.objektId }) : null
      const zielSchacht =
        o.ziel.art === 'schacht' ? schachtVon(schaechte, { objektId: o.ziel.objektId }) : null
      if (!startSchacht && !zielSchacht) return o
      const segmente = o.pfadSegmente.map((s) => [...s])
      if (startSchacht && segmente[0]?.length > 0) {
        const referenz = nachbarPunkt(segmente[0], true)
        if (referenz) segmente[0][0] = schachtAnschlussPunkt(startSchacht, referenz)
      }
      const letzter = letzterSegmentIndex(o)
      if (zielSchacht && letzter >= 0) {
        const segment = segmente[letzter]
        const referenz = nachbarPunkt(segment, false)
        if (referenz) segment[segment.length - 1] = schachtAnschlussPunkt(zielSchacht, referenz)
      }
      return { ...o, pfadSegmente: segmente }
    }
    return o
  })
}

export function betroffeneLeitungenAnSchaechten(
  objekte: readonly Objekt[],
  schachtIds: ReadonlySet<string>,
): LeitungsObjekt[] {
  return objekte.filter((o): o is LeitungsObjekt => {
    if (o.type !== 'leitung') return false
    return (
      (o.start.art === 'schacht' && schachtIds.has(o.start.objektId)) ||
      (o.ziel.art === 'schacht' && schachtIds.has(o.ziel.objektId))
    )
  })
}

export function betroffeneTrunksAnSchaechten(
  objekte: readonly Objekt[],
  schachtIds: ReadonlySet<string>,
): TrunkObjekt[] {
  return objekte.filter(
    (o): o is TrunkObjekt =>
      o.type === 'trunk' &&
      o.enden.some((e) => e.schachtRef && schachtIds.has(e.schachtRef.objektId)),
  )
}

export function berechneSchachtLeitungsReroute(
  objekte: Objekt[],
  schachtIds: ReadonlySet<string>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Map<string, Point[][]> {
  const ergebnis = new Map<string, Point[][]>()
  if (schachtIds.size === 0) return ergebnis
  const nachgefuehrt = schachtAnschluesseNachfuehren(objekte)

  for (const leitung of betroffeneLeitungenAnSchaechten(nachgefuehrt, schachtIds)) {
    const hindernisse = routingHindernisse(nachgefuehrt, settings.sicherheitsabstandMeter)

    const segmente = leitung.pfadSegmente.map((s) => [...s])
    const letzter = letzterSegmentIndex(leitung)
    if (letzter < 0) continue
    const startBewegt = leitung.start.art === 'schacht' && schachtIds.has(leitung.start.objektId)
    const zielBewegt = leitung.ziel.art === 'schacht' && schachtIds.has(leitung.ziel.objektId)
    const aufruf = fuerLeitung(settings, leitung, geschoss)
    let erfolgreich = true

    if (letzter === 0 && startBewegt && zielBewegt) {
      const pfad = routePath(
        segmente[0][0],
        segmente[0][segmente[0].length - 1],
        hindernisse,
        aufruf,
      )
      if (pfad) segmente[0] = pfad
      else erfolgreich = false
    } else {
      if (startBewegt) {
        const erstes = segmente[0]
        const pfad = routePath(erstes[0], erstes[erstes.length - 1], hindernisse, aufruf)
        if (pfad) segmente[0] = pfad
        else erfolgreich = false
      }
      if (erfolgreich && zielBewegt) {
        const letztes = segmente[letzter]
        const pfad = routePath(letztes[0], letztes[letztes.length - 1], hindernisse, aufruf)
        if (pfad) segmente[letzter] = pfad
        else erfolgreich = false
      }
    }
    if (erfolgreich) ergebnis.set(leitung.id, segmente)
  }
  return ergebnis
}

export function wendeSchachtNachfuehrungAn(
  objekte: Objekt[],
  schachtIds: ReadonlySet<string>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Objekt[] {
  if (schachtIds.size === 0) return objekte
  const nachgefuehrt = schachtAnschluesseNachfuehren(objekte)
  const neueSegmente = berechneSchachtLeitungsReroute(nachgefuehrt, schachtIds, settings, geschoss)
  if (neueSegmente.size === 0) return nachgefuehrt
  return nachgefuehrt.map((o) => {
    if (o.type !== 'leitung') return o
    const pfadSegmente = neueSegmente.get(o.id)
    return pfadSegmente ? { ...o, pfadSegmente } : o
  })
}

export function schachtIdsAus(objekte: readonly Objekt[], ids: Iterable<string>): Set<string> {
  const alle = new Set<string>()
  for (const o of objekte) if (istKabelschacht(o)) alle.add(o.id)
  const treffer = new Set<string>()
  for (const id of ids) if (alle.has(id)) treffer.add(id)
  return treffer
}
