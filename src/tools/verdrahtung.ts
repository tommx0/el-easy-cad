import type {
  Blatt,
  BlattGeschoss,
  BoundingBox,
  DocumentStore,
  LeitungsObjekt,
  LeitungsZiel,
  Objekt,
  Point,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
  Zeichnungsart,
} from '../document-model'
import {
  abzweigEndpunkt,
  boundingBoxFromPoints,
  boundingBoxUeberlappt,
  distance,
  ermittleAderverlaeufe,
  fuehreSchaltverbindungenNach,
  getDockpoints,
  SCHALTPLAN_POLABSTAND,
} from '../document-model'
import type { BelegteBahn, Belegung, RoutingHindernisse, RoutingSettings } from '../routing'
import { fuerLeitung, ROUTING_ZELLGROESSE_METER, routePath, routingHindernisse } from '../routing'
import { BAUPLAN_BAHNABSTAND_MM, SCHALTPLAN_BAHNABSTAND_MM } from './anordnen-einstellungen'
import type { Command } from './command'
import { erzeugeObjektAendernCommand } from './commands'
import { schaltplanHindernisse, verlegeSchaltverbindung } from './schaltverbindung-routing'
import { t } from '../sprache'

export const SCHALTPLAN_BAHNABSTAND_METER = 0.1
const MASSSTAB_OHNE_ZEICHENFLAECHE = { bauplan: 50, schaltplan: 40 } as const

const BUENDEL_TOLERANZ_METER = 0.02

export function bahnabstandFuer(
  blatt: Pick<Blatt, 'zeichenflaeche'>,
  zeichnungsart: Zeichnungsart,
  bahnabstandMm: number | null = null,
): number {
  const schaltplan = zeichnungsart === 'schaltplan'
  const mm = bahnabstandMm ?? (schaltplan ? SCHALTPLAN_BAHNABSTAND_MM : BAUPLAN_BAHNABSTAND_MM)
  const nenner = blatt.zeichenflaeche?.massstabNenner ?? MASSSTAB_OHNE_ZEICHENFLAECHE[zeichnungsart]
  return Math.max((mm / 1000) * nenner, ROUTING_ZELLGROESSE_METER)
}

export interface VerdrahtungOptionen {
  bahnabstandMeter: number
  geschoss?: BlattGeschoss
  nurRechtwinklig?: boolean
  kreuzFaktor?: number
  vorgaben?: ReadonlyMap<string, Point[]>
  nachbessern?: boolean
}

const NACHBESSER_RUNDEN = 3

export interface VerdrahtungErgebnis {
  pfadSegmente: Map<string, Point[][]>
  wegpunkte: Map<string, Point[]>
  fehlgeschlagen: Set<string>
}

const KREUZ_EPSILON = 1e-9

function richtung(a: Point, b: Point, c: Point): number {
  const wert = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  return Math.abs(wert) < KREUZ_EPSILON ? 0 : Math.sign(wert)
}

function streckenSchneiden(a: Point, b: Point, c: Point, d: Point): boolean {
  const r1 = richtung(a, b, c)
  const r2 = richtung(a, b, d)
  const r3 = richtung(c, d, a)
  const r4 = richtung(c, d, b)
  if (r1 * r2 < 0 && r3 * r4 < 0) return true
  if (r1 !== 0 || r2 !== 0) return false
  const lx = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
  const proj = (p: Point) => (lx ? p.x : p.y)
  const von = Math.max(Math.min(proj(a), proj(b)), Math.min(proj(c), proj(d)))
  const bis = Math.min(Math.max(proj(a), proj(b)), Math.max(proj(c), proj(d)))
  return bis - von > 1e-6
}

export function kreuzungenZwischen(a: readonly Point[], b: readonly Point[]): number {
  let summe = 0
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      if (streckenSchneiden(a[i], a[i + 1], b[j], b[j + 1])) summe++
    }
  }
  return summe
}

export function ermittleNetze(objekte: readonly Objekt[]): Map<string, string> {
  const eltern = new Map<string, string>()
  const finde = (k: string): string => {
    let w = k
    while (eltern.has(w) && eltern.get(w) !== w) w = eltern.get(w)!
    eltern.set(k, w)
    return w
  }
  const vereinige = (a: string, b: string) => {
    const wa = finde(a)
    const wb = finde(b)
    if (wa !== wb) eltern.set(wa, wb)
  }
  const potentialNamen = new Map<string, string>()
  for (const o of objekte) if (o.type === 'potential') potentialNamen.set(o.id, o.name)

  const verbindungen: string[] = []
  for (const o of objekte) {
    const knoten = `v:${o.id}`
    if (o.type === 'leitung') {
      verbindungen.push(o.id)
      finde(knoten)
    } else if (o.type === 'schaltverbindung') {
      verbindungen.push(o.id)
      finde(knoten)
      for (const ende of [o.start, o.ziel]) {
        if (ende.art === 'dock') {
          for (const i of ende.dockpunktIndizes) vereinige(knoten, `dock:${ende.objektId}:${i}`)
        } else if (ende.art === 'potential') {
          vereinige(knoten, `potential:${potentialNamen.get(ende.objektId) ?? ende.objektId}`)
        } else if (ende.art === 'schaltverbindung') {
          vereinige(knoten, `v:${ende.objektId}`)
        } else if (ende.art === 'knoten') {
          vereinige(knoten, `knoten:${ende.objektId}`)
        }
      }
      const bezeichnung = o.bezeichnung?.trim()
      if (bezeichnung) vereinige(knoten, `potential:${bezeichnung}`)
    }
  }
  return new Map(verbindungen.map((id) => [id, finde(`v:${id}`)]))
}

interface Auftrag {
  id: string
  art: 'leitung' | 'schaltverbindung'
  segmentIndex: number
  von: Point
  bis: Point
  alt: Point[]
  netz: string
}

function leitungsEnde(ende: LeitungsZiel, objekte: ReadonlyMap<string, Objekt>, alt: Point): Point {
  if (ende.art !== 'dock') return alt
  const komponente = objekte.get(ende.objektId)
  if (komponente?.type !== 'komponente') return alt
  return getDockpoints(komponente)[ende.dockpunktIndex] ?? alt
}

function leitungsAuftraege(
  leitung: LeitungsObjekt,
  objekte: ReadonlyMap<string, Objekt>,
  netz: string,
): Auftrag[] {
  const segmente = leitung.pfadSegmente
  const letzter = segmente.length - 1
  const auftraege: Auftrag[] = []
  const erstes = segmente[0]
  if (erstes.length >= 2) {
    const von = leitungsEnde(leitung.start, objekte, erstes[0])
    const bis =
      letzter === 0
        ? leitungsEnde(leitung.ziel, objekte, erstes[erstes.length - 1])
        : erstes[erstes.length - 1]
    auftraege.push({ id: leitung.id, art: 'leitung', segmentIndex: 0, von, bis, alt: erstes, netz })
  }
  const letztes = segmente[letzter]
  if (letzter > 0 && letztes.length >= 2) {
    const bis = leitungsEnde(leitung.ziel, objekte, letztes[letztes.length - 1])
    auftraege.push({
      id: leitung.id,
      art: 'leitung',
      segmentIndex: letzter,
      von: letztes[0],
      bis,
      alt: letztes,
      netz,
    })
  }
  return auftraege
}

function istAbzweig(s: SchaltverbindungObjekt): boolean {
  return s.start.art === 'schaltverbindung' || s.ziel.art === 'schaltverbindung'
}

interface Buendel {
  adern: { auftrag: Auftrag; original: Auftrag; umgedreht: boolean }[]
}

function einzelnerDock(a: SchaltverbindungAnschluss): { objektId: string } | null {
  return a.art === 'dock' && a.dockpunktIndizes.length === 1 ? { objektId: a.objektId } : null
}

function imPolabstand(punkte: Point[]): boolean {
  for (let i = 1; i < punkte.length; i++) {
    if (
      Math.abs(distance(punkte[i - 1], punkte[i]) - SCHALTPLAN_POLABSTAND) > BUENDEL_TOLERANZ_METER
    )
      return false
  }
  const a = punkte[0]
  const b = punkte[punkte.length - 1]
  const laenge = distance(a, b)
  return punkte.every(
    (p) =>
      Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / laenge <=
      BUENDEL_TOLERANZ_METER,
  )
}

function findeBuendel(
  auftraege: readonly Auftrag[],
  verbindungen: ReadonlyMap<string, SchaltverbindungObjekt>,
): Buendel[] {
  const gruppen = new Map<string, Auftrag[]>()
  for (const auftrag of auftraege) {
    const s = verbindungen.get(auftrag.id)
    if (!s || s.polzahl !== 1) continue
    const a = einzelnerDock(s.start)
    const b = einzelnerDock(s.ziel)
    if (!a || !b || a.objektId === b.objektId) continue
    const schluessel = [a.objektId, b.objektId].sort().join('|')
    gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), auftrag])
  }
  const buendel: Buendel[] = []
  for (const [schluessel, mitglieder] of gruppen) {
    if (mitglieder.length < 2) continue
    const erste = schluessel.split('|')[0]
    const adern = mitglieder.map((auftrag) => {
      const s = verbindungen.get(auftrag.id)!
      const umgedreht = s.start.art === 'dock' && s.start.objektId !== erste
      return {
        auftrag: umgedreht ? { ...auftrag, von: auftrag.bis, bis: auftrag.von } : auftrag,
        original: auftrag,
        umgedreht,
      }
    })
    const anker = adern[0].auftrag.von
    let fern = adern[0].auftrag.von
    for (const a of adern)
      if (distance(a.auftrag.von, anker) > distance(fern, anker)) fern = a.auftrag.von
    const richtung = { x: fern.x - anker.x, y: fern.y - anker.y }
    if (Math.hypot(richtung.x, richtung.y) < 1e-9) continue
    adern.sort(
      (p, q) =>
        (p.auftrag.von.x - q.auftrag.von.x) * richtung.x +
        (p.auftrag.von.y - q.auftrag.von.y) * richtung.y,
    )
    if (!imPolabstand(adern.map((a) => a.auftrag.von))) continue
    if (!imPolabstand(adern.map((a) => a.auftrag.bis))) continue
    buendel.push({ adern })
  }
  return buendel
}

function mitteKollidiert(punkte: Point[], boxen: readonly BoundingBox[]): boolean {
  for (let i = 1; i < punkte.length - 2; i++) {
    const strecke = boundingBoxFromPoints([punkte[i], punkte[i + 1]])
    for (const bb of boxen) {
      const innen: BoundingBox = {
        min: { x: bb.min.x + 0.005, y: bb.min.y + 0.005 },
        max: { x: bb.max.x - 0.005, y: bb.max.y - 0.005 },
      }
      if (boundingBoxUeberlappt(strecke, innen)) return true
    }
  }
  return false
}

export function berechneVerdrahtung(
  objekteRoh: readonly Objekt[],
  ids: ReadonlySet<string>,
  settings: RoutingSettings,
  optionen: VerdrahtungOptionen,
): VerdrahtungErgebnis {
  const ergebnis: VerdrahtungErgebnis = {
    pfadSegmente: new Map(),
    wegpunkte: new Map(),
    fehlgeschlagen: new Set(),
  }
  const objekte = fuehreSchaltverbindungenNach([...objekteRoh])
  const stand = new Map(objekte.map((o) => [o.id, o]))
  const netze = ermittleNetze(objekte)

  const auftraege: Auftrag[] = []
  const schaltverbindungen = new Map<string, SchaltverbindungObjekt>()
  for (const o of objekte) {
    if (!ids.has(o.id)) continue
    const netz = netze.get(o.id) ?? o.id
    if (o.type === 'leitung') auftraege.push(...leitungsAuftraege(o, stand, netz))
    else if (o.type === 'schaltverbindung' && o.wegpunkte.length >= 2) {
      schaltverbindungen.set(o.id, o)
      const alt = o.wegpunkte
      auftraege.push({
        id: o.id,
        art: 'schaltverbindung',
        segmentIndex: 0,
        von: alt[0],
        bis: alt[alt.length - 1],
        alt,
        netz,
      })
    }
  }
  if (auftraege.length === 0) return ergebnis

  const belegung: Belegung = {
    bahnen: [],
    bahnabstandMeter: optionen.bahnabstandMeter,
    kreuzFaktor: optionen.kreuzFaktor,
  }
  const verlegt = new Set(auftraege.map((a) => `${a.id}#${a.segmentIndex}`))
  for (const o of objekte) {
    const netz = netze.get(o.id) ?? o.id
    if (o.type === 'leitung') {
      o.pfadSegmente.forEach((punkte, i) => {
        if (!verlegt.has(`${o.id}#${i}`) && punkte.length >= 2)
          belegung.bahnen.push({ punkte, netz })
      })
    } else if (o.type === 'schaltverbindung' && !verlegt.has(`${o.id}#0`)) {
      if (o.wegpunkte.length >= 2) belegung.bahnen.push({ punkte: o.wegpunkte, netz })
    } else if (o.type === 'trunk' && o.wegpunkte.length >= 2) {
      belegung.bahnen.push({ punkte: o.wegpunkte, netz: `trunk:${o.id}` })
    }
  }

  let leitungsHindernisse: RoutingHindernisse | null = null
  let schaltHindernisse: RoutingHindernisse | null = null
  const neueSegmente = new Map<string, Point[][]>()

  const schluesselVon = (auftrag: Auftrag) => `${auftrag.id}#${auftrag.segmentIndex}`
  const merke = (auftrag: Auftrag, punkte: Point[], erfolg: boolean) => {
    if (!erfolg) ergebnis.fehlgeschlagen.add(auftrag.id)
    const schluessel = schluesselVon(auftrag)
    belegung.bahnen = belegung.bahnen.filter((b) => b.schluessel !== schluessel)
    belegung.bahnen.push({ punkte, netz: auftrag.netz, schluessel } satisfies BelegteBahn)
    if (auftrag.art === 'leitung') {
      const leitung = stand.get(auftrag.id) as LeitungsObjekt
      const segmente = neueSegmente.get(auftrag.id) ?? [...leitung.pfadSegmente]
      segmente[auftrag.segmentIndex] = punkte
      neueSegmente.set(auftrag.id, segmente)
      ergebnis.pfadSegmente.set(auftrag.id, segmente)
    } else {
      ergebnis.wegpunkte.set(auftrag.id, punkte)
      const alt = stand.get(auftrag.id) as SchaltverbindungObjekt
      stand.set(auftrag.id, { ...alt, wegpunkte: punkte })
    }
  }

  const endenFuer = (auftrag: Auftrag): { von: Point; bis: Point } => {
    const s = schaltverbindungen.get(auftrag.id)
    if (!s) return auftrag
    const lage = (anschluss: SchaltverbindungAnschluss, ende: 'start' | 'ziel', p: Point) => {
      if (anschluss.art !== 'schaltverbindung') return p
      const sammel = stand.get(anschluss.objektId)
      if (sammel?.type !== 'schaltverbindung' || sammel.wegpunkte.length < 2) return p
      return abzweigEndpunkt(auftrag.alt, ende, sammel.wegpunkte)
    }
    return { von: lage(s.start, 'start', auftrag.von), bis: lage(s.ziel, 'ziel', auftrag.bis) }
  }

  const verlegeEinzeln = (auftrag: Auftrag): Point[] | null => {
    const { von, bis } = endenFuer(auftrag)
    const aufrufBelegung = { belegung, netz: auftrag.netz }
    if (auftrag.art === 'leitung') {
      leitungsHindernisse ??= routingHindernisse(
        [...stand.values()],
        settings.sicherheitsabstandMeter,
      )
      const leitung = stand.get(auftrag.id) as LeitungsObjekt
      const aufruf = fuerLeitung(settings, leitung, optionen.geschoss)
      return routePath(
        von,
        bis,
        leitungsHindernisse,
        aufruf,
        undefined,
        optionen.nurRechtwinklig ?? false,
        aufrufBelegung,
      )
    }
    schaltHindernisse ??= schaltplanHindernisse([...stand.values()])
    const s = schaltverbindungen.get(auftrag.id)!
    return verlegeSchaltverbindung(
      von,
      bis,
      s.start,
      s.ziel,
      [...stand.values()],
      schaltHindernisse,
      settings,
      aufrufBelegung,
    )
  }

  const rueckfall = (auftrag: Auftrag): Point[] => {
    const { von, bis } = endenFuer(auftrag)
    return [von, ...auftrag.alt.slice(1, -1), bis]
  }

  const verlegeBuendel = (buendel: Buendel): boolean => {
    schaltHindernisse ??= schaltplanHindernisse([...stand.values()])
    const boxen = schaltHindernisse.boxen
    for (const reihe of [buendel.adern, [...buendel.adern].reverse()]) {
      const rand = reihe[0]
      const s = schaltverbindungen.get(rand.original.id)!
      const pfad = verlegeSchaltverbindung(
        rand.auftrag.von,
        rand.auftrag.bis,
        rand.umgedreht ? s.ziel : s.start,
        rand.umgedreht ? s.start : s.ziel,
        [...stand.values()],
        schaltHindernisse,
        settings,
        { belegung, netz: rand.auftrag.netz },
      )
      if (!pfad) continue
      for (const seite of [1, -1] as const) {
        const verlaeufe = ermittleAderverlaeufe(pfad, reihe.length, seite)
        const passt = verlaeufe.every((v, i) => {
          const { von, bis } = reihe[i].auftrag
          return (
            v.length >= 2 &&
            distance(v[0], von) <= BUENDEL_TOLERANZ_METER &&
            distance(v[v.length - 1], bis) <= BUENDEL_TOLERANZ_METER &&
            !mitteKollidiert(v, boxen)
          )
        })
        if (!passt) continue
        verlaeufe.forEach((v, i) => {
          const { auftrag, original, umgedreht } = reihe[i]
          const genau = [auftrag.von, ...v.slice(1, -1), auftrag.bis]
          merke(original, umgedreht ? genau.reverse() : genau, true)
        })
        return true
      }
    }
    return false
  }

  const buendel = findeBuendel(auftraege, schaltverbindungen)
  const imBuendel = new Map<string, Buendel>()
  for (const b of buendel) for (const a of b.adern) imBuendel.set(a.auftrag.id, b)
  const rang = (a: Auftrag) => {
    const s = schaltverbindungen.get(a.id)
    return s && istAbzweig(s) ? 1 : 0
  }
  const reihenfolge = [...auftraege].sort(
    (a, b) => rang(a) - rang(b) || distance(a.von, a.bis) - distance(b.von, b.bis),
  )
  const vorgegeben = new Set<string>()
  for (const auftrag of auftraege) {
    const vorgabe = optionen.vorgaben?.get(auftrag.id)
    if (!vorgabe || vorgabe.length < 2) continue
    if (
      auftrag.art === 'leitung' &&
      (stand.get(auftrag.id) as LeitungsObjekt).pfadSegmente.length !== 1
    )
      continue
    merke(auftrag, vorgabe, true)
    vorgegeben.add(auftrag.id)
  }

  const erledigt = new Set<Buendel>()
  for (const auftrag of reihenfolge) {
    if (vorgegeben.has(auftrag.id)) continue
    const b = imBuendel.get(auftrag.id)
    if (b) {
      if (erledigt.has(b)) continue
      erledigt.add(b)
      if (verlegeBuendel(b)) continue
      for (const { original } of b.adern) {
        const pfad = verlegeEinzeln(original)
        merke(original, pfad ?? rueckfall(original), pfad !== null)
      }
      continue
    }
    const pfad = verlegeEinzeln(auftrag)
    merke(auftrag, pfad ?? rueckfall(auftrag), pfad !== null)
  }

  if (optionen.nachbessern) {
    const kreuzungenVon = (auftrag: Auftrag, punkte: Point[]) =>
      belegung.bahnen
        .filter((b) => b.netz !== auftrag.netz && b.schluessel !== schluesselVon(auftrag))
        .reduce((summe, b) => summe + kreuzungenZwischen(punkte, b.punkte), 0)
    const aktuell = (auftrag: Auftrag) =>
      belegung.bahnen.find((b) => b.schluessel === schluesselVon(auftrag))!.punkte
    const beweglich = auftraege.filter(
      (a) => !vorgegeben.has(a.id) && !imBuendel.has(a.id) && !ergebnis.fehlgeschlagen.has(a.id),
    )
    for (let runde = 0; runde < NACHBESSER_RUNDEN; runde++) {
      let besser = false
      const mitKreuzung = beweglich
        .map((a) => ({ a, zahl: kreuzungenVon(a, aktuell(a)) }))
        .filter((k) => k.zahl > 0)
        .sort((p, q) => q.zahl - p.zahl)
      for (const { a } of mitKreuzung) {
        const vorher = aktuell(a)
        const zahlVorher = kreuzungenVon(a, vorher)
        if (zahlVorher === 0) continue
        belegung.bahnen = belegung.bahnen.filter((b) => b.schluessel !== schluesselVon(a))
        const neu = verlegeEinzeln(a)
        if (neu && kreuzungenVon(a, neu) < zahlVorher) {
          merke(a, neu, true)
          besser = true
        } else {
          belegung.bahnen.push({ punkte: vorher, netz: a.netz, schluessel: schluesselVon(a) })
        }
      }
      if (!besser) break
    }
  }
  return ergebnis
}

export function wendeVerdrahtungAn(objekte: Objekt[], ergebnis: VerdrahtungErgebnis): Objekt[] {
  return objekte.map((o) => {
    if (o.type === 'leitung') {
      const pfadSegmente = ergebnis.pfadSegmente.get(o.id)
      if (!pfadSegmente) return o
      const neu: LeitungsObjekt = { ...o, pfadSegmente }
      delete neu.autoRoutingAus
      return neu
    }
    if (o.type === 'schaltverbindung') {
      const wegpunkte = ergebnis.wegpunkte.get(o.id)
      return wegpunkte ? { ...o, wegpunkte, autoRouting: true } : o
    }
    return o
  })
}

export function erzeugeVerdrahtungCommand(
  doc: DocumentStore,
  blattId: string,
  ids: ReadonlySet<string>,
  settings: RoutingSettings,
  label = t('werkzeuge.verdrahtung.verlegen'),
): { command: Command | null; fehlgeschlagen: number } {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const ergebnis = berechneVerdrahtung(blatt.objekte, ids, settings, {
    bahnabstandMeter: bahnabstandFuer(blatt, doc.getZeichnung().zeichnungsart),
    geschoss: blatt.geschoss,
  })
  if (ergebnis.pfadSegmente.size === 0 && ergebnis.wegpunkte.size === 0) {
    return { command: null, fehlgeschlagen: 0 }
  }
  const command = erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    wendeVerdrahtungAn(objekte, ergebnis),
  )
  return { command, fehlgeschlagen: ergebnis.fehlgeschlagen.size }
}
