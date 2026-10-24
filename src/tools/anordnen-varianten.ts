import type {
  AnordnungsRegeln,
  Blatt,
  BlattGeschoss,
  BoundingBox,
  DocumentStore,
  Ebene,
  KomponentenObjekt,
  LeitungsObjekt,
  Objekt,
  Point,
  TrunkObjekt,
  Zeichenflaeche,
  Zeichnung,
  Zeichnungsart,
} from '../document-model'
import {
  distance,
  ebeneFuerNeuesObjekt,
  erzeugeId,
  expandiereTraegerMitModulen,
  neueObjektBasis,
  festerRasterSchritt,
  getBoundingBox,
  istAufgesetztesModul,
  istBearbeitbar,
  nullpunktVon,
  planUebersetzer,
  unionBoundingBox,
  zeichenflaecheBoundingBox,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import type { AnordnenEinstellungen } from './anordnen-einstellungen'
import { KREUZ_FAKTOR, STANDARD_ANORDNEN_EINSTELLUNGEN } from './anordnen-einstellungen'
import type {
  AnordnenErgebnis,
  AnordnenVariante,
  NeuerTrunk,
  TrunkLeitung,
} from './automatisch-anordnen'
import { BAUPLAN_RASTER_METER, berechneAnordnung, zaehleKnoten } from './automatisch-anordnen'
import type { Command } from './command'
import { erzeugeObjektAendernCommand } from './commands'
import { berechneTrunkRerouteMitZustand } from './gruppenverschiebung'
import { TRUNK_STANDARD_FARBE, TRUNK_STANDARD_STRICHSTAERKE } from './tools/trunk-tool'
import type { VerdrahtungErgebnis } from './verdrahtung'
import {
  bahnabstandFuer,
  berechneVerdrahtung,
  ermittleNetze,
  kreuzungenZwischen,
  wendeVerdrahtungAn,
} from './verdrahtung'
import { t } from '../sprache'

export const ANZAHL_VARIANTEN = 6

export interface AnordnenKontext {
  objekte: readonly Objekt[]
  auswahlIds: ReadonlySet<string>
  einstellungen: AnordnenEinstellungen
  zeichnungsart: Zeichnungsart
  festesRaster: number | null
  rasterBezug: Point
  zeichenflaeche: Zeichenflaeche | null
  ebenen: readonly Ebene[]
  geschoss?: BlattGeschoss
  routing: RoutingSettings
  beschriftungen?: Record<string, BoundingBox>
}

export function anordnenKontext(
  blatt: Blatt,
  zeichnung: { zeichnungsart: Zeichnungsart },
  auswahlIds: ReadonlySet<string>,
  einstellungen: AnordnenEinstellungen,
  routing: RoutingSettings,
): AnordnenKontext {
  return {
    objekte: blatt.objekte,
    auswahlIds,
    einstellungen,
    zeichnungsart: zeichnung.zeichnungsart,
    festesRaster: festerRasterSchritt(zeichnung),
    rasterBezug: nullpunktVon(blatt),
    zeichenflaeche: blatt.zeichenflaeche,
    ebenen: blatt.ebenen,
    geschoss: blatt.geschoss,
    routing,
  }
}

export interface AnordnenKennzahlen {
  kreuzungen: number
  fehlgeschlagen: number
  knicke: number
  laenge: number
  flaeche: number
  passtNicht: boolean
  ueberlappungen: number
  abweichung: number
}

export interface AnordnenVorschlag {
  schluessel: string
  variante: AnordnenVariante | null
  positionen: Map<string, Point>
  verdrahtung: VerdrahtungErgebnis
  trunkEnden: Map<string, Point[]>
  neueTrunks: NeuerTrunk[]
  trunkLeitungen: Map<string, TrunkLeitung>
  kennzahlen: AnordnenKennzahlen
  regeln: Omit<AnordnungsRegeln, 'gruppe'>
}

export function anordnenKandidaten(
  einstellungen: AnordnenEinstellungen,
  zeichnungsart: Zeichnungsart = 'bauplan',
): AnordnenVariante[] {
  const richtungen: AnordnenVariante['richtung'][] =
    einstellungen.richtung === 'automatisch'
      ? ['oben-unten', 'links-rechts']
      : [einstellungen.richtung]
  const wurzeln: AnordnenVariante['wurzel'][] = einstellungen.lageBeruecksichtigen
    ? ['oben']
    : ['oben', 'abgaenge', 'mitte']
  const reihenfolgen: AnordnenVariante['reihenfolge'][] = einstellungen.lageBeruecksichtigen
    ? ['lage']
    : ['lage', 'optimiert']
  const seitlich = einstellungen.kinderSeitlich ? [false, true] : [false]
  const trunks =
    zeichnungsart === 'bauplan' && einstellungen.buendeln && einstellungen.trunksBilden
      ? [false, true]
      : [false]
  const kandidaten: AnordnenVariante[] = []
  for (const richtung of richtungen)
    for (const wurzel of wurzeln)
      for (const reihenfolge of reihenfolgen)
        for (const s of seitlich)
          for (const t of trunks)
            kandidaten.push({
              richtung,
              wurzel,
              reihenfolge,
              seitlich: s,
              trunks: t,
              abstandFaktor: 1,
            })
  return kandidaten
}

export const ABSTAND_FAKTOREN_ENG_WEIT = [0.6, 1.8] as const
const ENG_WEIT_FUER_BESTE = 3

function abstaendeAutomatisch(einstellungen: AnordnenEinstellungen): boolean {
  return einstellungen.komponentenAbstandCm === null && einstellungen.reihenAbstandCm === null
}

export function anzahlKandidatenHoechstens(kontext: AnordnenKontext): number {
  const basis = anordnenKandidaten(kontext.einstellungen, kontext.zeichnungsart).length
  return abstaendeAutomatisch(kontext.einstellungen)
    ? basis + ENG_WEIT_FUER_BESTE * ABSTAND_FAKTOREN_ENG_WEIT.length
    : basis
}

function zuVerlegendeVerbindungen(
  objekte: readonly Objekt[],
  auswahlIds: ReadonlySet<string>,
  bewegt: ReadonlySet<string>,
  ebenen: readonly Ebene[],
): Set<string> {
  const ids = new Set<string>()
  const haengtAn = (a: { art: string; objektId?: string }) =>
    (a.art === 'dock' || a.art === 'potential') &&
    a.objektId !== undefined &&
    bewegt.has(a.objektId)
  for (const o of objekte) {
    if (!istBearbeitbar(o, ebenen)) continue
    if (o.type === 'leitung' || o.type === 'schaltverbindung') {
      if (auswahlIds.has(o.id) || haengtAn(o.start) || haengtAn(o.ziel)) ids.add(o.id)
    }
  }
  for (let neu = true; neu;) {
    neu = false
    for (const o of objekte) {
      if (o.type !== 'schaltverbindung' || ids.has(o.id) || !istBearbeitbar(o, ebenen)) continue
      const aufVerlegter = [o.start, o.ziel].some(
        (a) => a.art === 'schaltverbindung' && ids.has(a.objektId),
      )
      if (aufVerlegter) {
        ids.add(o.id)
        neu = true
      }
    }
  }
  return ids
}

function bewegteObjekte(objekte: readonly Objekt[], knotenIds: ReadonlySet<string>): Set<string> {
  const bewegt = new Set(knotenIds)
  for (const o of objekte)
    if (istAufgesetztesModul(o) && knotenIds.has(o.traegerId)) bewegt.add(o.id)
  return bewegt
}

export function zaehleAutomatischAnordnen(
  objekte: readonly Objekt[],
  auswahlIds: ReadonlySet<string>,
  ebenen: readonly Ebene[],
): { komponenten: number; verbindungen: number; vonHand: number } {
  const knoten = zaehleKnoten(objekte, auswahlIds, ebenen)
  const knotenIds = knoten.size >= 2 ? knoten : new Set<string>()
  const ids = zuVerlegendeVerbindungen(
    objekte,
    auswahlIds,
    bewegteObjekte(objekte, knotenIds),
    ebenen,
  )
  let vonHand = 0
  for (const o of objekte) {
    if (!ids.has(o.id)) continue
    if (
      (o.type === 'leitung' && o.autoRoutingAus) ||
      (o.type === 'schaltverbindung' && !o.autoRouting)
    )
      vonHand++
  }
  return { komponenten: knotenIds.size, verbindungen: ids.size, vonHand }
}

function zustaende(objekte: readonly Objekt[], positionen: ReadonlyMap<string, Point>) {
  const komponenten = new Map<string, Partial<KomponentenObjekt>>()
  const potentiale = new Map<string, Point>()
  for (const o of objekte) {
    const position = positionen.get(o.id)
    if (!position) continue
    if (o.type === 'komponente') komponenten.set(o.id, { position })
    else if (o.type === 'potential') potentiale.set(o.id, position)
  }
  expandiereTraegerMitModulen(objekte, komponenten)
  return { komponenten, potentiale }
}

function verschiebe(
  liste: readonly Objekt[],
  komponenten: ReadonlyMap<string, Partial<KomponentenObjekt>>,
  potentiale: ReadonlyMap<string, Point>,
): Objekt[] {
  return liste.map((o) => {
    if (o.type === 'komponente') {
      const zustand = komponenten.get(o.id)
      return zustand ? { ...o, ...zustand } : o
    }
    if (o.type === 'potential') {
      const position = potentiale.get(o.id)
      return position ? { ...o, position } : o
    }
    return o
  })
}

export interface TrunkVorlage {
  namen: readonly string[]
  ebeneId: string
}

function mitNeuenTrunks(
  objekte: readonly Objekt[],
  vorschlag: Pick<AnordnenVorschlag, 'neueTrunks' | 'trunkLeitungen'>,
  vorlage: TrunkVorlage,
): Objekt[] {
  if (vorschlag.neueTrunks.length === 0) return [...objekte]
  const geaendert = objekte.map((o): Objekt => {
    const lauf = o.type === 'leitung' ? vorschlag.trunkLeitungen.get(o.id) : undefined
    if (o.type !== 'leitung' || !lauf) return o
    const neu: LeitungsObjekt = {
      ...o,
      pfadSegmente: lauf.pfadSegmente,
      trunkDurchgaenge: [lauf.durchgang],
    }
    delete neu.autoRoutingAus
    return neu
  })
  const trunks = vorschlag.neueTrunks.map((t, i): TrunkObjekt => ({
    ...neueObjektBasis(vorlage.ebeneId, {
      farbe: TRUNK_STANDARD_FARBE,
      strichstaerke: TRUNK_STANDARD_STRICHSTAERKE,
    }),
    id: t.id,
    type: 'trunk',
    name: vorlage.namen[i] ?? 'Trunk',
    wegpunkte: t.wegpunkte,
    enden: [{}, {}],
  }))
  return [...geaendert, ...trunks]
}

function verlaeufeVon(o: Objekt, verdrahtung: VerdrahtungErgebnis): Point[][] {
  if (o.type === 'leitung')
    return (verdrahtung.pfadSegmente.get(o.id) ?? o.pfadSegmente).filter((s) => s.length >= 2)
  if (o.type === 'schaltverbindung') return [verdrahtung.wegpunkte.get(o.id) ?? o.wegpunkte]
  if (o.type === 'trunk') return [o.wegpunkte]
  return []
}

function polylinienLaenge(punkte: readonly Point[]): number {
  let summe = 0
  for (let i = 1; i < punkte.length; i++) summe += distance(punkte[i - 1], punkte[i])
  return summe
}

function bewerte(
  objekte: readonly Objekt[],
  beteiligt: ReadonlySet<string>,
  verdrahtung: VerdrahtungErgebnis,
  positionen: ReadonlyMap<string, Point>,
  ueberlappungen: number,
  passtNicht: boolean,
): AnordnenKennzahlen {
  const netze = ermittleNetze(objekte)
  const verbindungen = objekte
    .filter((o) => o.type === 'leitung' || o.type === 'schaltverbindung' || o.type === 'trunk')
    .map((o) => ({
      id: o.id,
      netz: o.type === 'trunk' ? `trunk:${o.id}` : (netze.get(o.id) ?? o.id),
      verlaeufe: verlaeufeVon(o, verdrahtung),
    }))
  let kreuzungen = 0
  for (let i = 0; i < verbindungen.length; i++) {
    for (let j = i + 1; j < verbindungen.length; j++) {
      const a = verbindungen[i]
      const b = verbindungen[j]
      if (a.netz === b.netz || (!beteiligt.has(a.id) && !beteiligt.has(b.id))) continue
      for (const va of a.verlaeufe)
        for (const vb of b.verlaeufe) kreuzungen += kreuzungenZwischen(va, vb)
    }
  }
  const trunkLaenge = new Map<string, number>()
  for (const o of objekte)
    if (o.type === 'trunk') trunkLaenge.set(o.id, polylinienLaenge(o.wegpunkte))
  let knicke = 0
  let laenge = 0
  for (const o of objekte) {
    if (!beteiligt.has(o.id) || o.type === 'trunk') continue
    for (const punkte of verlaeufeVon(o, verdrahtung)) {
      knicke += Math.max(0, punkte.length - 2)
      laenge += polylinienLaenge(punkte)
    }
    if (o.type === 'leitung') {
      for (const d of o.trunkDurchgaenge)
        laenge += Math.abs(d.austrittT - d.eintrittT) * (trunkLaenge.get(d.trunkId) ?? 0)
    }
  }
  let flaeche = 0
  const boxen = objekte.filter((o) => positionen.has(o.id)).map((o) => getBoundingBox(o))
  if (boxen.length > 0) {
    const h = boxen.reduce(unionBoundingBox)
    flaeche = (h.max.x - h.min.x) * (h.max.y - h.min.y)
  }
  return {
    kreuzungen,
    fehlgeschlagen: verdrahtung.fehlgeschlagen.size,
    knicke,
    laenge,
    flaeche,
    passtNicht,
    ueberlappungen,
    abweichung: 0,
  }
}

export function berechneVorschlag(
  kontext: AnordnenKontext,
  variante: AnordnenVariante | null,
): AnordnenVorschlag {
  const { objekte, auswahlIds, einstellungen, zeichnungsart } = kontext
  const schaltplan = zeichnungsart === 'schaltplan'
  const bahnabstandMeter = bahnabstandFuer(kontext, zeichnungsart, einstellungen.bahnabstandMm)
  const rahmen =
    kontext.zeichenflaeche && (schaltplan || einstellungen.lage === 'mitte')
      ? zeichenflaecheBoundingBox(kontext.zeichenflaeche)
      : null

  const anordnung: AnordnenErgebnis = variante
    ? berechneAnordnung(
        objekte,
        auswahlIds,
        {
          zeichnungsart,
          rasterSchritt: einstellungen.raster
            ? (kontext.festesRaster ?? BAUPLAN_RASTER_METER)
            : null,
          rasterBezug: kontext.rasterBezug,
          bahnabstandMeter,
          rahmen,
          einpassen: schaltplan,
          ebenen: kontext.ebenen,
          komponentenAbstand:
            einstellungen.komponentenAbstandCm === null
              ? null
              : einstellungen.komponentenAbstandCm / 100,
          reihenAbstand:
            einstellungen.reihenAbstandCm === null ? null : einstellungen.reihenAbstandCm / 100,
          buendeln: einstellungen.buendeln,
          lage: einstellungen.lage,
          beschriftungen: kontext.beschriftungen,
          trunks: {
            mindestLeitungen: einstellungen.trunkMindestLeitungen,
            mindestLaenge: einstellungen.trunkMindestLaengeM,
          },
        },
        variante,
      )
    : {
        positionen: new Map<string, Point>(),
        ueberlappungen: 0,
        passtNicht: false,
        kamm: new Map(),
        trunks: [],
        trunkLeitungen: new Map(),
      }

  const { komponenten, potentiale } = zustaende(objekte, anordnung.positionen)
  const virtuell = mitNeuenTrunks(
    verschiebe(objekte, komponenten, potentiale),
    { neueTrunks: anordnung.trunks, trunkLeitungen: anordnung.trunkLeitungen },
    { namen: [], ebeneId: '' },
  )
  const bewegt = new Set([...komponenten.keys(), ...potentiale.keys()])
  const ids = new Set(
    [...zuVerlegendeVerbindungen(objekte, auswahlIds, bewegt, kontext.ebenen)].filter(
      (id) => !anordnung.trunkLeitungen.has(id),
    ),
  )
  const verdrahtung = berechneVerdrahtung(virtuell, ids, kontext.routing, {
    bahnabstandMeter,
    geschoss: kontext.geschoss,
    nurRechtwinklig: schaltplan || einstellungen.nurRechtwinklig,
    kreuzFaktor: KREUZ_FAKTOR[einstellungen.kreuzungen],
    vorgaben: anordnung.kamm,
    nachbessern: true,
  })
  const trunkEnden = berechneTrunkRerouteMitZustand([...objekte], komponenten)
  const beteiligt = new Set([
    ...ids,
    ...anordnung.trunkLeitungen.keys(),
    ...anordnung.trunks.map((t) => t.id),
  ])
  const kennzahlen = bewerte(
    virtuell,
    beteiligt,
    verdrahtung,
    anordnung.positionen,
    anordnung.ueberlappungen,
    anordnung.passtNicht,
  )
  kennzahlen.abweichung = [...anordnung.positionen].reduce((summe, [id, p]) => {
    const o = objekte.find((x) => x.id === id) as { position: Point } | undefined
    return summe + (o ? distance(o.position, p) : 0)
  }, 0)
  const schluessel =
    [...anordnung.positionen]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, p]) => `${id}:${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`)
      .join('|') + `|T${anordnung.trunks.length}`
  return {
    schluessel,
    variante,
    positionen: anordnung.positionen,
    verdrahtung,
    trunkEnden,
    neueTrunks: anordnung.trunks,
    trunkLeitungen: anordnung.trunkLeitungen,
    kennzahlen,
    regeln: {
      bahnabstand: bahnabstandMeter,
      kreuzFaktor: KREUZ_FAKTOR[einstellungen.kreuzungen],
      rechtwinklig: schaltplan || einstellungen.nurRechtwinklig,
      kamm: variante !== null && einstellungen.buendeln,
      richtung: variante?.richtung ?? 'oben-unten',
    },
  }
}

export function* berechneVorschlaege(kontext: AnordnenKontext): Generator<AnordnenVorschlag> {
  const knoten = zaehleKnoten(kontext.objekte, kontext.auswahlIds, kontext.ebenen)
  if (knoten.size < 2) {
    yield berechneVorschlag(kontext, null)
    return
  }
  const gesehen = new Set<string>()
  const basis: AnordnenVorschlag[] = []
  for (const variante of anordnenKandidaten(kontext.einstellungen, kontext.zeichnungsart)) {
    const vorschlag = berechneVorschlag(kontext, variante)
    if (gesehen.has(vorschlag.schluessel)) continue
    gesehen.add(vorschlag.schluessel)
    basis.push(vorschlag)
    yield vorschlag
  }
  if (!abstaendeAutomatisch(kontext.einstellungen)) return
  const auswahl = auswahlRahmen(kontext.einstellungen)
  for (const bester of besteVorschlaege(basis, auswahl, ENG_WEIT_FUER_BESTE)) {
    for (const abstandFaktor of ABSTAND_FAKTOREN_ENG_WEIT) {
      const vorschlag = berechneVorschlag(kontext, { ...bester.variante!, abstandFaktor })
      if (gesehen.has(vorschlag.schluessel)) continue
      gesehen.add(vorschlag.schluessel)
      yield vorschlag
    }
  }
}

export const UMWEG_FAKTOR = 1.25

export interface VergleichsRahmen {
  lageBeruecksichtigen?: boolean
  kuerzesteLaenge?: number
}

export function vergleicheVorschlaege(
  a: AnordnenVorschlag,
  b: AnordnenVorschlag,
  { lageBeruecksichtigen = false, kuerzesteLaenge = 0 }: VergleichsRahmen = {},
): number {
  const ka = a.kennzahlen
  const kb = b.kennzahlen
  const umweg = (laenge: number) =>
    kuerzesteLaenge > 0 && laenge > kuerzesteLaenge * UMWEG_FAKTOR ? 1 : 0
  if (umweg(ka.laenge) !== umweg(kb.laenge)) return umweg(ka.laenge) - umweg(kb.laenge)
  if (ka.kreuzungen !== kb.kreuzungen) return ka.kreuzungen - kb.kreuzungen
  if (ka.fehlgeschlagen !== kb.fehlgeschlagen) return ka.fehlgeschlagen - kb.fehlgeschlagen
  if (ka.knicke !== kb.knicke) return ka.knicke - kb.knicke
  const laenge = Math.max(ka.laenge, kb.laenge)
  if (laenge > 0 && Math.abs(ka.laenge - kb.laenge) / laenge > 0.02) return ka.laenge - kb.laenge
  if (ka.passtNicht !== kb.passtNicht) return ka.passtNicht ? 1 : -1
  if (Math.abs(ka.flaeche - kb.flaeche) > 1e-6) return ka.flaeche - kb.flaeche
  return lageBeruecksichtigen ? ka.abweichung - kb.abweichung : 0
}

export interface AuswahlRahmen {
  lageBeruecksichtigen?: boolean
  nurOhneKreuzung?: boolean
}

export function auswahlRahmen(einstellungen: AnordnenEinstellungen): AuswahlRahmen {
  return {
    lageBeruecksichtigen: einstellungen.lageBeruecksichtigen,
    nurOhneKreuzung: einstellungen.kreuzungen === 'immer',
  }
}

export function besteVorschlaege(
  vorschlaege: readonly AnordnenVorschlag[],
  { lageBeruecksichtigen = false, nurOhneKreuzung = false }: AuswahlRahmen = {},
  anzahl = ANZAHL_VARIANTEN,
): AnordnenVorschlag[] {
  const zulaessig = nurOhneKreuzung
    ? vorschlaege.filter((v) => v.kennzahlen.kreuzungen === 0)
    : vorschlaege
  const laengen = zulaessig.map((v) => v.kennzahlen.laenge).filter((l) => l > 0)
  const kuerzesteLaenge = laengen.length > 0 ? Math.min(...laengen) : 0
  return [...zulaessig]
    .sort((a, b) => vergleicheVorschlaege(a, b, { lageBeruecksichtigen, kuerzesteLaenge }))
    .slice(0, anzahl)
}

export function wendeVorschlagAn(
  objekte: Objekt[],
  vorschlag: AnordnenVorschlag,
  trunkVorlage: TrunkVorlage = { namen: [], ebeneId: '' },
  gruppe: string | null = null,
): Objekt[] {
  const { komponenten, potentiale } = zustaende(objekte, vorschlag.positionen)
  const verlegt = new Set([
    ...vorschlag.verdrahtung.pfadSegmente.keys(),
    ...vorschlag.verdrahtung.wegpunkte.keys(),
    ...vorschlag.trunkLeitungen.keys(),
  ])
  const mitRegeln = (liste: Objekt[]): Objekt[] =>
    gruppe === null
      ? liste
      : liste.map((o) =>
          (o.type === 'leitung' || o.type === 'schaltverbindung') && verlegt.has(o.id)
            ? { ...o, anordnung: { ...vorschlag.regeln, gruppe } }
            : o,
        )
  return mitRegeln(
    wendeVerdrahtungAn(
      mitNeuenTrunks(
        verschiebe(objekte, komponenten, potentiale).map((o) => {
          const wegpunkte = o.type === 'trunk' ? vorschlag.trunkEnden.get(o.id) : undefined
          return wegpunkte ? { ...o, wegpunkte } : o
        }),
        vorschlag,
        trunkVorlage,
      ),
      vorschlag.verdrahtung,
    ),
  )
}

function freieTrunkNamen(zeichnung: Zeichnung, anzahl: number): string[] {
  const tp = planUebersetzer(zeichnung)
  const vergeben = new Set<string>()
  for (const blatt of zeichnung.blaetter)
    for (const o of blatt.objekte) if (o.type === 'trunk') vergeben.add(o.name)
  const namen: string[] = []
  for (let n = 1; namen.length < anzahl; n++) {
    const name = tp('plan.vorgabe.trunk', { nr: String(n) })
    if (!vergeben.has(name)) namen.push(name)
  }
  return namen
}

export function erzeugeVorschlagCommand(
  doc: DocumentStore,
  blattId: string,
  vorschlag: AnordnenVorschlag,
  label = t(
    vorschlag.variante ? 'werkzeuge.anordnen.automatisch' : 'werkzeuge.anordnen.neuVerlegen',
  ),
): Command {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const vorlage: TrunkVorlage = {
    namen: freieTrunkNamen(doc.getZeichnung(), vorschlag.neueTrunks.length),
    ebeneId: ebeneFuerNeuesObjekt('trunk', blatt.ebenen, blatt.aktiveEbeneId),
  }
  const gruppe = erzeugeId('anordnung')
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    wendeVorschlagAn(objekte, vorschlag, vorlage, gruppe),
  )
}

export interface AutomatischAnordnenErgebnis {
  command: Command | null
  fehlgeschlagen: number
  ueberlappungen: number
  passtNicht: boolean
}

export function erzeugeAutomatischAnordnenCommand(
  doc: DocumentStore,
  blattId: string,
  auswahlIds: ReadonlySet<string>,
  settings: RoutingSettings,
  einstellungen: AnordnenEinstellungen = STANDARD_ANORDNEN_EINSTELLUNGEN,
): AutomatischAnordnenErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const kontext = anordnenKontext(blatt, doc.getZeichnung(), auswahlIds, einstellungen, settings)
  const [bester] = besteVorschlaege(
    [...berechneVorschlaege(kontext)],
    auswahlRahmen(einstellungen),
    1,
  )
  const nichts =
    !bester ||
    (bester.positionen.size === 0 &&
      bester.verdrahtung.pfadSegmente.size === 0 &&
      bester.verdrahtung.wegpunkte.size === 0)
  if (nichts) return { command: null, fehlgeschlagen: 0, ueberlappungen: 0, passtNicht: false }
  return {
    command: erzeugeVorschlagCommand(doc, blattId, bester),
    fehlgeschlagen: bester.kennzahlen.fehlgeschlagen,
    ueberlappungen: bester.kennzahlen.ueberlappungen,
    passtNicht: bester.kennzahlen.passtNicht,
  }
}
