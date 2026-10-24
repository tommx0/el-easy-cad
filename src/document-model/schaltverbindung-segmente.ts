import type { Point } from './geometry'
import { distance } from './geometry'
import { erzeugeId } from './id'
import type {
  KnotenpunktObjekt,
  Objekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from './objekte'
import { naechsterPunktAufPolylinie } from './schaltverbindung-abzweig'
import { polylinienLaenge, vereinfacheWegpunkte } from './schaltverbindung-geometrie'
import { unterbrechungsEnde } from './blattverweis'

export type SegmentEnde = 'start' | 'ziel'
type Ende = SegmentEnde

const NAH = 1e-6

function endpunkt(s: SchaltverbindungObjekt, ende: Ende): Point {
  return ende === 'start' ? s.wegpunkte[0] : s.wegpunkte[s.wegpunkte.length - 1]
}

function mitEnde(
  s: SchaltverbindungObjekt,
  ende: Ende,
  anschluss: SchaltverbindungAnschluss,
  punkt?: Point,
): SchaltverbindungObjekt {
  const wegpunkte = punkt
    ? s.wegpunkte.map((p, i) => (i === (ende === 'start' ? 0 : s.wegpunkte.length - 1) ? punkt : p))
    : s.wegpunkte
  return ende === 'start'
    ? { ...s, start: anschluss, wegpunkte }
    : { ...s, ziel: anschluss, wegpunkte }
}

function neuerKnoten(vorlage: SchaltverbindungObjekt, position: Point): KnotenpunktObjekt {
  return {
    id: erzeugeId('objekt'),
    ebeneId: vorlage.ebeneId,
    farbe: vorlage.farbe,
    strichstaerke: vorlage.strichstaerke,
    linientyp: vorlage.linientyp,
    type: 'knotenpunkt',
    position,
  }
}

export function mitPassenderUnterbrechung(s: SchaltverbindungObjekt): SchaltverbindungObjekt {
  if (s.unterbrechung === undefined || unterbrechungsEnde(s)) return s
  const { unterbrechung: _weg, ...ohne } = s
  void _weg
  return ohne
}

function hatAbzweig(o: Objekt): o is SchaltverbindungObjekt {
  return (
    o.type === 'schaltverbindung' &&
    (o.start.art === 'schaltverbindung' || o.ziel.art === 'schaltverbindung')
  )
}

function endenJeKnoten(objekte: readonly Objekt[]): Map<string, number> {
  const anzahl = new Map<string, number>()
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung') continue
    for (const a of [o.start, o.ziel])
      if (a.art === 'knoten') anzahl.set(a.objektId, (anzahl.get(a.objektId) ?? 0) + 1)
  }
  return anzahl
}

function ohneLeereKnoten(objekte: readonly Objekt[]): Objekt[] {
  const anzahl = endenJeKnoten(objekte)
  const weg = new Set(
    objekte.filter((o) => o.type === 'knotenpunkt' && (anzahl.get(o.id) ?? 0) < 2).map((o) => o.id),
  )
  if (weg.size === 0) return objekte as Objekt[]
  return objekte.flatMap((o): Objekt[] => {
    if (weg.has(o.id)) return []
    if (o.type !== 'schaltverbindung') return [o]
    const frei = (a: SchaltverbindungAnschluss) => a.art === 'knoten' && weg.has(a.objektId)
    if (!frei(o.start) && !frei(o.ziel)) return [o]
    return [
      {
        ...o,
        start: frei(o.start) ? { art: 'frei' } : o.start,
        ziel: frei(o.ziel) ? { art: 'frei' } : o.ziel,
      },
    ]
  })
}

export function knotenAusAbzweigen(objekte: readonly Objekt[]): Objekt[] {
  if (!objekte.some(hatAbzweig)) return ohneLeereKnoten(objekte)

  let liste: Objekt[] = [...objekte]
  const familie = new Map<string, string[]>()
  const familieVon = (id: string) => familie.get(id) ?? [id]
  const zurFamilie = (id: string, neu: string) => {
    for (const ids of familie.values()) if (ids.includes(id)) return void ids.push(neu)
    familie.set(id, [id, neu])
  }
  const ersetze = (alt: Objekt, ...neu: Objekt[]) => {
    const i = liste.findIndex((o) => o.id === alt.id)
    liste = [...liste.slice(0, i), ...neu, ...liste.slice(i + 1)]
  }
  const finde = (id: string) => liste.find((o) => o.id === id)

  for (let runde = 0; runde < objekte.length * 4 + 10; runde++) {
    const s = liste.find(hatAbzweig)
    if (!s) break
    const ende: Ende = s.start.art === 'schaltverbindung' ? 'start' : 'ziel'
    const ref = (ende === 'start' ? s.start : s.ziel) as { objektId: string }
    const p = endpunkt(s, ende)
    const kandidaten = familieVon(ref.objektId)
      .map(finde)
      .filter(
        (o): o is SchaltverbindungObjekt =>
          o?.type === 'schaltverbindung' && o.id !== s.id && o.wegpunkte.length >= 2,
      )
    if (kandidaten.length === 0) {
      ersetze(s, mitEnde(s, ende, { art: 'frei' }))
      continue
    }
    const treffer = kandidaten
      .map((t) => ({ t, lage: naechsterPunktAufPolylinie(p, t.wegpunkte) }))
      .sort((a, b) => a.lage.abstand - b.lage.abstand)[0]
    const t = treffer.t
    const q = treffer.lage.punkt
    const tEnde: Ende | null =
      distance(q, endpunkt(t, 'start')) < NAH
        ? 'start'
        : distance(q, endpunkt(t, 'ziel')) < NAH
          ? 'ziel'
          : null

    if (tEnde) {
      const anschluss = tEnde === 'start' ? t.start : t.ziel
      if (anschluss.art === 'schaltverbindung') {
        ersetze(s, mitEnde(s, ende, anschluss))
        continue
      }
      if (anschluss.art === 'frei') {
        const k = neuerKnoten(t, q)
        const kRef = { art: 'knoten', objektId: k.id } as const
        ersetze(t, mitEnde(t, tEnde, kRef, q), k)
        ersetze(s, mitEnde(s, ende, kRef, q))
      } else {
        ersetze(s, mitEnde(s, ende, anschluss, q))
      }
      continue
    }

    const i = treffer.lage.segment
    const w = t.wegpunkte
    const k = neuerKnoten(t, q)
    const kRef = { art: 'knoten', objektId: k.id } as const
    const vorne: SchaltverbindungObjekt = mitPassenderUnterbrechung({
      ...t,
      wegpunkte: vereinfacheWegpunkte([...w.slice(0, i + 1), q]),
      ziel: kRef,
    })
    const hintenId = erzeugeId('objekt')
    const { anordnung: _anordnung, ...ohneAnordnung } = t
    void _anordnung
    const hinten: SchaltverbindungObjekt = mitPassenderUnterbrechung({
      ...ohneAnordnung,
      id: hintenId,
      wegpunkte: vereinfacheWegpunkte([q, ...w.slice(i + 1)]),
      start: kRef,
      ...(t.bezeichnung ? { bezeichnungSichtbar: false } : {}),
    })
    zurFamilie(t.id, hintenId)
    ersetze(t, vorne, k, hinten)
    ersetze(s, mitEnde(s, ende, kRef, q))
  }

  return ohneLeereKnoten(liste)
}

export function endenAmKnoten(
  objekte: readonly Objekt[],
  knotenId: string,
): { segment: SchaltverbindungObjekt; ende: Ende }[] {
  const enden: { segment: SchaltverbindungObjekt; ende: Ende }[] = []
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung') continue
    if (o.start.art === 'knoten' && o.start.objektId === knotenId)
      enden.push({ segment: o, ende: 'start' })
    if (o.ziel.art === 'knoten' && o.ziel.objektId === knotenId)
      enden.push({ segment: o, ende: 'ziel' })
  }
  return enden
}

function umgedreht(s: SchaltverbindungObjekt): SchaltverbindungObjekt {
  const unterbrechung =
    s.unterbrechung === 'quelle' ? 'ziel' : s.unterbrechung === 'ziel' ? 'quelle' : undefined
  return {
    ...s,
    wegpunkte: [...s.wegpunkte].reverse(),
    start: s.ziel,
    ziel: s.start,
    ...(unterbrechung ? { unterbrechung } : {}),
  }
}

export function verbindeSegmente(
  a: SchaltverbindungObjekt,
  aEnde: Ende,
  b: SchaltverbindungObjekt,
  bEnde: Ende,
  vorlage: SchaltverbindungObjekt,
): SchaltverbindungObjekt {
  const vorne = aEnde === 'ziel' ? a : umgedreht(a)
  const hinten = bEnde === 'start' ? b : umgedreht(b)
  return mitPassenderUnterbrechung({
    ...vorlage,
    wegpunkte: vereinfacheWegpunkte([...vorne.wegpunkte, ...hinten.wegpunkte]),
    start: vorne.start,
    ziel: hinten.ziel,
  })
}

export function raeumeKnotenAuf(objekte: readonly Objekt[], knotenIds: Iterable<string>): Objekt[] {
  let liste: Objekt[] = [...objekte]
  for (const id of knotenIds) {
    const knoten = liste.find((o) => o.id === id)
    if (knoten?.type !== 'knotenpunkt') continue
    const enden = endenAmKnoten(liste, id)
    if (enden.length >= 3) continue
    if (enden.length === 1) {
      const { segment, ende } = enden[0]
      liste = liste.map((o) => (o.id === segment.id ? mitEnde(segment, ende, { art: 'frei' }) : o))
    } else if (enden.length === 2 && enden[0].segment.id !== enden[1].segment.id) {
      const [a0, b0] = enden
      const laenger =
        polylinienLaenge(a0.segment.wegpunkte) >= polylinienLaenge(b0.segment.wegpunkte)
          ? a0.segment
          : b0.segment
      const kuerzer = laenger === a0.segment ? b0.segment : a0.segment
      const zusammen = verbindeSegmente(a0.segment, a0.ende, b0.segment, b0.ende, laenger)
      liste = liste
        .filter((o) => o.id !== kuerzer.id)
        .map((o) => (o.id === laenger.id ? zusammen : o))
    } else if (enden.length === 2) {
      continue
    }
    liste = liste.filter((o) => o.id !== id)
  }
  return liste
}

export function segmentNetz(objekte: readonly Objekt[], segmentId: string): Set<string> {
  const knotenVon = new Map<string, string[]>()
  const segmenteAm = new Map<string, string[]>()
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung') continue
    const knoten = [o.start, o.ziel].flatMap((a) => (a.art === 'knoten' ? [a.objektId] : []))
    knotenVon.set(o.id, knoten)
    for (const k of knoten) segmenteAm.set(k, [...(segmenteAm.get(k) ?? []), o.id])
  }
  const netz = new Set<string>([segmentId])
  const offen = [segmentId]
  while (offen.length > 0) {
    const id = offen.pop()!
    for (const k of knotenVon.get(id) ?? [])
      for (const nachbar of segmenteAm.get(k) ?? [])
        if (!netz.has(nachbar)) {
          netz.add(nachbar)
          offen.push(nachbar)
        }
  }
  return netz
}
