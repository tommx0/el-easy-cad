import type {
  BlattGeschoss,
  LeitungsObjekt,
  Objekt,
  Point,
  TrunkDurchgang,
  TrunkObjekt,
} from '../document-model'
import {
  abgeleitetePfadSegmente,
  distance,
  distanceToSegment,
  punktAufPfad,
} from '../document-model'
import { fuerLeitung, routePath, routingHindernisse } from '../routing'
import type { RoutingHindernisseEingabe, RoutingSettings } from '../routing'

export const LEITUNG_GRIFF_TOLERANZ_PX = 8

export function findeEndeIndex(pfad: Point[], punkt: Point, toleranz: number): 0 | 1 | null {
  if (pfad.length < 2) return null
  const distanzStart = distance(punkt, pfad[0])
  const distanzEnde = distance(punkt, pfad[pfad.length - 1])
  if (distanzStart > toleranz && distanzEnde > toleranz) return null
  return distanzStart <= distanzEnde ? 0 : 1
}

export function vorschauEndeVerschieben(
  pfad: Point[],
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  endeIndex: 0 | 1,
  neuePosition: Point,
): Point[] | null {
  if (pfad.length < 2) return null
  if (endeIndex === 0) {
    const neuerAbschnitt = routePath(neuePosition, pfad[1], hindernisse, settings)
    if (!neuerAbschnitt) return null
    return [...neuerAbschnitt, ...pfad.slice(2)]
  }
  const nachbarIndex = pfad.length - 2
  const neuerAbschnitt = routePath(pfad[nachbarIndex], neuePosition, hindernisse, settings)
  if (!neuerAbschnitt) return null
  return [...pfad.slice(0, nachbarIndex), ...neuerAbschnitt]
}

export function findeWegpunktIndex(pfad: Point[], punkt: Point, toleranz: number): number | null {
  let bester: number | null = null
  let besteDistanz = toleranz
  for (let i = 1; i < pfad.length - 1; i++) {
    const d = distance(punkt, pfad[i])
    if (d <= besteDistanz) {
      besteDistanz = d
      bester = i
    }
  }
  return bester
}

export function findeSegmentIndex(pfad: Point[], punkt: Point, toleranz: number): number | null {
  let bester: number | null = null
  let besteDistanz = toleranz
  for (let i = 0; i < pfad.length - 1; i++) {
    const d = distanceToSegment(punkt, pfad[i], pfad[i + 1])
    if (d <= besteDistanz) {
      besteDistanz = d
      bester = i
    }
  }
  return bester
}

export function vorschauSegmentVerschieben(
  pfad: Point[],
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  segmentIndex: number,
  neuePosition: Point,
): Point[] | null {
  if (segmentIndex < 0 || segmentIndex >= pfad.length - 1) return null
  const linksFixIndex = segmentIndex === 0 ? 0 : segmentIndex - 1
  const rechtsFixIndex = segmentIndex + 1 >= pfad.length - 1 ? pfad.length - 1 : segmentIndex + 2

  const linksPfad = routePath(pfad[linksFixIndex], neuePosition, hindernisse, settings)
  if (!linksPfad) return null
  const rechtsPfad = routePath(neuePosition, pfad[rechtsFixIndex], hindernisse, settings)
  if (!rechtsPfad) return null

  return [
    ...pfad.slice(0, linksFixIndex),
    ...linksPfad,
    ...rechtsPfad.slice(1),
    ...pfad.slice(rechtsFixIndex + 1),
  ]
}

export function vorschauWegpunktEntfernen(
  pfad: Point[],
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  wegpunktIndex: number,
): Point[] | null {
  if (wegpunktIndex <= 0 || wegpunktIndex >= pfad.length - 1) return null
  const linksIndex = wegpunktIndex - 1
  const rechtsIndex = wegpunktIndex + 1
  const neuerPfad = routePath(pfad[linksIndex], pfad[rechtsIndex], hindernisse, settings)
  if (!neuerPfad) return null
  return [...pfad.slice(0, linksIndex), ...neuerPfad, ...pfad.slice(rechtsIndex + 1)]
}

export function vorschauSegmentVerschiebenFrei(
  pfad: Point[],
  segmentIndex: number,
  neuePosition: Point,
): Point[] | null {
  if (segmentIndex < 0 || segmentIndex >= pfad.length - 1) return null
  const linksFixIndex = segmentIndex === 0 ? 0 : segmentIndex - 1
  const rechtsFixIndex = segmentIndex + 1 >= pfad.length - 1 ? pfad.length - 1 : segmentIndex + 2
  return [...pfad.slice(0, linksFixIndex + 1), neuePosition, ...pfad.slice(rechtsFixIndex)]
}

export function vorschauWegpunktEntfernenFrei(
  pfad: Point[],
  wegpunktIndex: number,
): Point[] | null {
  if (wegpunktIndex <= 0 || wegpunktIndex >= pfad.length - 1) return null
  return [...pfad.slice(0, wegpunktIndex), ...pfad.slice(wegpunktIndex + 1)]
}

export interface TrunkDurchgangVerschiebenErgebnis {
  trunkDurchgaenge: TrunkDurchgang[]
  pfadSegmente: Point[][]
}

export function vorschauTrunkDurchgangVerschieben(
  leitung: LeitungsObjekt,
  trunk: TrunkObjekt,
  objekteAufBlatt: Objekt[],
  hindernisse: RoutingHindernisseEingabe,
  settings: RoutingSettings,
  art: 'eintritt' | 'austritt',
  neuerT: number,
): TrunkDurchgangVerschiebenErgebnis | null {
  const durchgangIndex = leitung.trunkDurchgaenge.findIndex((d) => d.trunkId === trunk.id)
  if (durchgangIndex === -1) return null
  const neuerTGeklemmt = Math.max(0, Math.min(1, neuerT))
  const neuerPunkt = punktAufPfad(trunk.wegpunkte, neuerTGeklemmt)
  const aktuelleSegmente = abgeleitetePfadSegmente(leitung, objekteAufBlatt)

  const segmentIndex = art === 'eintritt' ? durchgangIndex : durchgangIndex + 1
  const betroffenesSegment = aktuelleSegmente[segmentIndex]
  if (!betroffenesSegment || betroffenesSegment.length === 0) return null

  const neuerPfad =
    art === 'eintritt'
      ? routePath(betroffenesSegment[0], neuerPunkt, hindernisse, settings)
      : routePath(
          neuerPunkt,
          betroffenesSegment[betroffenesSegment.length - 1],
          hindernisse,
          settings,
        )
  if (!neuerPfad) return null

  const neueSegmente = [...aktuelleSegmente]
  neueSegmente[segmentIndex] = neuerPfad
  const neueDurchgaenge = leitung.trunkDurchgaenge.map((d, i) =>
    i === durchgangIndex
      ? { ...d, [art === 'eintritt' ? 'eintrittT' : 'austrittT']: neuerTGeklemmt }
      : d,
  )
  return { trunkDurchgaenge: neueDurchgaenge, pfadSegmente: neueSegmente }
}

export function berechneLeitungenReroutingBeiTrunkAenderung(
  objekte: Objekt[],
  trunkId: string,
  neueWegpunkte: Point[],
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Map<string, Point[][]> {
  const ergebnis = new Map<string, Point[][]>()
  for (const o of objekte) {
    if (o.type !== 'leitung') continue
    const durchgangIndex = o.trunkDurchgaenge.findIndex((d) => d.trunkId === trunkId)
    if (durchgangIndex === -1) continue
    const durchgang = o.trunkDurchgaenge[durchgangIndex]
    const neueSegmente = [...o.pfadSegmente]

    const eintrittsPunkt = punktAufPfad(neueWegpunkte, durchgang.eintrittT)
    const austrittsPunkt = punktAufPfad(neueWegpunkte, durchgang.austrittT)

    if (o.autoRoutingAus) {
      const segEintritt = neueSegmente[durchgangIndex]
      neueSegmente[durchgangIndex] = [...segEintritt.slice(0, -1), eintrittsPunkt]
      const segAustritt = neueSegmente[durchgangIndex + 1]
      neueSegmente[durchgangIndex + 1] = [austrittsPunkt, ...segAustritt.slice(1)]
      ergebnis.set(o.id, neueSegmente)
      continue
    }

    const hindernisse = routingHindernisse(objekte, settings.sicherheitsabstandMeter)
    const aufruf = fuerLeitung(settings, o, geschoss)
    let erfolgreich = true

    const segEintritt = neueSegmente[durchgangIndex]
    const eintrittsPfad = routePath(segEintritt[0], eintrittsPunkt, hindernisse, aufruf)
    if (!eintrittsPfad) erfolgreich = false
    else neueSegmente[durchgangIndex] = eintrittsPfad

    if (erfolgreich) {
      const segAustritt = neueSegmente[durchgangIndex + 1]
      const austrittsPfad = routePath(
        austrittsPunkt,
        segAustritt[segAustritt.length - 1],
        hindernisse,
        aufruf,
      )
      if (!austrittsPfad) erfolgreich = false
      else neueSegmente[durchgangIndex + 1] = austrittsPfad
    }

    if (erfolgreich) ergebnis.set(o.id, neueSegmente)
  }
  return ergebnis
}

export interface LeitungsGriffTreffer {
  art: 'wegpunkt' | 'segment'
  segmentArrIndex: number
  lokalerIndex: number
}

export function findeLeitungsGriff(
  pfadSegmente: Point[][],
  punkt: Point,
  toleranz: number,
): LeitungsGriffTreffer | null {
  for (let s = 0; s < pfadSegmente.length; s++) {
    const wegpunktIndex = findeWegpunktIndex(pfadSegmente[s], punkt, toleranz)
    if (wegpunktIndex !== null) {
      return { art: 'wegpunkt', segmentArrIndex: s, lokalerIndex: wegpunktIndex }
    }
  }
  for (let s = 0; s < pfadSegmente.length; s++) {
    const segmentIndex = findeSegmentIndex(pfadSegmente[s], punkt, toleranz)
    if (segmentIndex !== null) {
      return { art: 'segment', segmentArrIndex: s, lokalerIndex: segmentIndex }
    }
  }
  return null
}
