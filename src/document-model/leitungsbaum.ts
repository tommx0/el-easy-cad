import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import { pfadGesamtLaenge } from './geometry'
import {
  beschreibeSchachtStraenge,
  findeSchacht,
  gemeinsamerTrunkStrang,
  schachtVerbundIndex,
  steigstreckeMeter,
  strangTitelMitKlartext,
  trunkAnschluesseJeStrang,
} from './kabelschacht'
import type { LeitungsAbschnitt, LeitungsLaenge } from './leitungslaenge'
import {
  ermittleAbschnittsLaengen,
  ermittleAlleLeitungsLaengen,
  istLaengentauglich,
  kabelEnden,
} from './leitungslaenge'
import { istModulTraeger, moduleVonTraeger } from './modul-traeger'
import type { KomponentenObjekt, LeitungsbaumObjekt, LeitungsZiel, Objekt } from './objekte'
import { istBuendelEnde } from './objekte'
import { istVerteiler, verteilerKennzeichenText } from './verteiler'
import { ermittleVerteilerZuweisungen, verteilerAnschlussText } from './verteiler-belegung'
import {
  baueVerteilerBaum,
  ermittleStromweg,
  stromkreiseImBaum,
  typText,
  type VerteilerBaum,
} from './verteiler-baum'
import { zuordnungFuer, type StromkreisZuordnung } from './stromkreis-zuordnung'
import {
  ermittlePoeSummeWatt,
  ermittlePortBelegung,
  istPortKomponente,
  portAnzahl,
  portBezeichnung,
  sammlePortZuweisungen,
  switchBezeichnung,
} from './switch-ports'
import type { TrunkKettenGlied } from './trunk-kette'
import {
  ermittleTeilstueckNamen,
  ermittleTrunkKette,
  findeTrunkWeg,
  trunkNachbarschaft,
} from './trunk-kette'
import { planspracheVon, planUebersetzer } from './plansprache'
import { brichUm } from './tabellen'
import type { TabellenKontext } from './tabellen'
import { zeichenflaecheGroesseWelt } from './zeichenflaeche'
import type { Zeichnung } from './zeichnung'

const ZEICHEN_BREITE_ANTEIL = 0.6
export const UNTERTITEL_SKALA = 0.8
export const ZEILEN_HOEHE_ANTEIL = 1.5
export const KNOTEN_RAND_ANTEIL = 0.6
const EBENEN_ABSTAND_ANTEIL = 2.6
const GESCHWISTER_ABSTAND_ANTEIL = 1.6
const STAPEL_ABSTAND_ANTEIL = 0.5
export const STICH_ANTEIL = 4.6
const WURZEL_ABSTAND_ANTEIL = 3
const MAX_ZEICHEN = 24
const MAX_GENANNTE_FREIE_PORTS = 8
export const STANDARD_BAUM_TEXTHOEHE = 0.1
const OHNE_LAENGE = '–'

export type BaumKnotenArt =
  'verteiler' | 'trunk' | 'schacht' | 'geraet' | 'offen' | 'hinweis' | 'betriebsmittel'

export interface BaumKnoten {
  art: BaumKnotenArt
  titel: string[]
  untertitel: string[]
  kennzahl: string | null
  farbe: string
  kantenText: string | null
  quelle: { blattId: string; objektId: string } | null
  kinder: BaumKnoten[]
}

export interface BaumLayoutKnoten {
  knoten: BaumKnoten
  x: number
  y: number
  breite: number
  hoehe: number
  gestapelt: boolean
  kinder: BaumLayoutKnoten[]
}

export interface BaumModell {
  titel: string
  titelHoehe: number
  wurzeln: BaumLayoutKnoten[]
  gesamtBreite: number
  gesamtHoehe: number
  textHoehe: number
}

function meter(wert: number): string {
  return `${wert.toFixed(2)} m`
}

function knoten(
  art: BaumKnotenArt,
  titel: string,
  untertitel: (string | null)[],
  kennzahl: string | null,
  farbe: string,
  quelle: { blattId: string; objektId: string } | null,
  kinder: BaumKnoten[] = [],
  kantenText: string | null = null,
): BaumKnoten {
  return {
    art,
    titel: brichUm(titel, MAX_ZEICHEN),
    untertitel: untertitel
      .filter((z): z is string => !!z && z.trim().length > 0)
      .flatMap((zeile) => brichUm(zeile, Math.round(MAX_ZEICHEN / UNTERTITEL_SKALA))),
    kennzahl,
    farbe,
    kantenText,
    quelle,
    kinder,
  }
}

function auchVerbundenMit(tp: Uebersetzer, querverweise: readonly string[]): string | null {
  return querverweise.length > 0
    ? tp('planlisten.leitungsbaum.auchVerbundenMit', { namen: querverweise.join(', ') })
    : null
}

type Station =
  | { art: 'trunk'; blattId: string; trunkId: string }
  | { art: 'schacht'; blattId: string; schachtId: string; verbundId: string; strang: number }

function sammleTrunks(zeichnung: Zeichnung): Map<string, TrunkKettenGlied> {
  const alle = new Map<string, TrunkKettenGlied>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') alle.set(objekt.id, { blattId: blatt.id, trunk: objekt })
    }
  }
  return alle
}

function trunksAmVerteiler(alle: Map<string, TrunkKettenGlied>): Map<string, TrunkKettenGlied[]> {
  const treffer = new Map<string, TrunkKettenGlied[]>()
  for (const glied of alle.values()) {
    for (const ende of glied.trunk.enden) {
      if (!ende.dockRef) continue
      const liste = treffer.get(ende.dockRef.objektId) ?? []
      liste.push(glied)
      treffer.set(ende.dockRef.objektId, liste)
    }
  }
  return treffer
}

interface SchachtStrangEintrag {
  glieder: TrunkKettenGlied[]
  station: Extract<Station, { art: 'schacht' }>
}

function sammleSchachtStraenge(zeichnung: Zeichnung): Map<string, SchachtStrangEintrag> {
  const verbundIndex = schachtVerbundIndex(zeichnung)
  const straenge = new Map<string, SchachtStrangEintrag>()
  for (const [schluessel, anschluesse] of trunkAnschluesseJeStrang(zeichnung)) {
    const erster = anschluesse[0]
    const ref = erster.trunk.enden[erster.endeIndex].schachtRef
    if (!ref) continue
    const verbundId = verbundIndex.get(ref.objektId)
    if (verbundId === undefined) continue
    straenge.set(`schacht:${schluessel}`, {
      glieder: anschluesse.map((a) => ({ blattId: a.blattId, trunk: a.trunk })),
      station: {
        art: 'schacht',
        blattId: erster.blattId,
        schachtId: ref.objektId,
        verbundId,
        strang: ref.strang,
      },
    })
  }
  return straenge
}

function haengeTrunkFolgeAn(
  zeichnung: Zeichnung,
  stationen: Station[],
  folge: TrunkKettenGlied[],
  alle: Map<string, TrunkKettenGlied>,
) {
  for (const glied of folge) {
    const letzte = [...stationen].reverse().find((s) => s.art === 'trunk')
    if (letzte && letzte.art === 'trunk' && letzte.blattId !== glied.blattId) {
      const vorher = alle.get(letzte.trunkId)
      const strang = vorher ? gemeinsamerTrunkStrang(zeichnung, vorher, glied) : null
      if (strang) {
        stationen.push({
          art: 'schacht',
          blattId: vorher!.blattId,
          schachtId: strang.schachtA.id,
          verbundId: strang.schachtA.verbundId,
          strang: strang.strang,
        })
      }
    }
    if (stationen.some((s) => s.art === 'trunk' && s.trunkId === glied.trunk.id)) continue
    stationen.push({ art: 'trunk', blattId: glied.blattId, trunkId: glied.trunk.id })
  }
}

function buendelWeg(
  zeichnung: Zeichnung,
  blattId: string,
  startTrunkId: string,
  verteilerId: string,
  amVerteiler: Map<string, TrunkKettenGlied[]>,
): TrunkKettenGlied[] {
  let bester: TrunkKettenGlied[] | null = null
  for (const ziel of amVerteiler.get(verteilerId) ?? []) {
    const weg = findeTrunkWeg(zeichnung, blattId, startTrunkId, ziel.trunk.id)
    if (!weg) continue
    if (!bester || weg.length < bester.length) {
      bester = weg.map((g) => ({ blattId: g.blattId, trunk: g.trunk }))
    }
  }
  return bester ?? []
}

function kabelStationen(
  zeichnung: Zeichnung,
  kabel: LeitungsLaenge,
  alle: Map<string, TrunkKettenGlied>,
  amVerteiler: Map<string, TrunkKettenGlied[]>,
): Station[] {
  const stationen: Station[] = []
  kabel.glieder.forEach(({ blattId, leitung }, index) => {
    if (index > 0) {
      const ende = kabel.glieder[index - 1].leitung.ziel
      if (ende.art === 'schacht') {
        const schacht = findeSchacht(zeichnung, kabel.glieder[index - 1].blattId, ende.objektId)
        if (schacht) {
          stationen.push({
            art: 'schacht',
            blattId: kabel.glieder[index - 1].blattId,
            schachtId: schacht.id,
            verbundId: schacht.verbundId,
            strang: ende.strang,
          })
        }
      }
    }

    const durchgaenge = leitung.trunkDurchgaenge
    if (index === 0 && istBuendelEnde(leitung.start) && durchgaenge.length > 0) {
      const weg = buendelWeg(
        zeichnung,
        blattId,
        durchgaenge[0].trunkId,
        leitung.start.objektId,
        amVerteiler,
      )
      haengeTrunkFolgeAn(zeichnung, stationen, [...weg].reverse(), alle)
    }

    haengeTrunkFolgeAn(
      zeichnung,
      stationen,
      durchgaenge
        .map((d) => alle.get(d.trunkId))
        .filter((g): g is TrunkKettenGlied => g !== undefined),
      alle,
    )

    if (
      index === kabel.glieder.length - 1 &&
      istBuendelEnde(leitung.ziel) &&
      durchgaenge.length > 0
    ) {
      haengeTrunkFolgeAn(
        zeichnung,
        stationen,
        buendelWeg(
          zeichnung,
          blattId,
          durchgaenge[durchgaenge.length - 1].trunkId,
          leitung.ziel.objektId,
          amVerteiler,
        ),
        alle,
      )
    }
  })
  return stationen
}

function abschnittAmEnde(
  kabel: LeitungsLaenge,
  abschnitte: LeitungsAbschnitt[],
  seite: 'start' | 'ziel',
): number | null {
  if (kabel.glieder.length === 0) return null
  const glied = seite === 'start' ? kabel.glieder[0] : kabel.glieder[kabel.glieder.length - 1]
  const segmentIndex = seite === 'start' ? 0 : Math.max(0, glied.leitung.pfadSegmente.length - 1)
  const treffer = abschnitte.find(
    (a) => a.art === 'frei' && a.leitungId === glied.leitung.id && a.segmentIndex === segmentIndex,
  )
  return treffer ? treffer.meter : null
}

interface VerteilerDaten {
  poeJePort: Map<string, number>
  freiePorts: Map<string, string[]>
  poeSumme: Map<string, number>
  baeume: Map<string, VerteilerBaum>
}

function istBaumVerteiler(objekt: Objekt): objekt is KomponentenObjekt {
  return objekt.type === 'komponente' && (istPortKomponente(objekt) || istVerteiler(objekt))
}

function elektroVerteilerIds(zeichnung: Zeichnung): Set<string> {
  const ids = new Set<string>()
  for (const blatt of zeichnung.blaetter)
    for (const o of blatt.objekte) if (istVerteiler(o)) ids.add(o.id)
  return ids
}

function verteilerAmKabelEnde(
  ende: LeitungsZiel,
  elektroVerteiler: ReadonlySet<string>,
): string | null {
  if (istBuendelEnde(ende)) return ende.objektId
  return ende.art === 'dock' && elektroVerteiler.has(ende.objektId) ? ende.objektId : null
}

function sammleVerteilerDaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  verteilerplaene: readonly Zeichnung[] = [],
): VerteilerDaten {
  const zuweisungen = sammlePortZuweisungen(zeichnung)
  const poeJePort = new Map<string, number>()
  const freiePorts = new Map<string, string[]>()
  const poeSumme = new Map<string, number>()
  const baeume = new Map<string, VerteilerBaum>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (istVerteiler(objekt)) {
        const plan = verteilerplaene.find(
          (p) => p.verteilerKennzeichen === objekt.verteiler.kennzeichen,
        )
        const baum = baueVerteilerBaum(objekt, katalog, plan)
        const belegt = new Set(
          ermittleVerteilerZuweisungen(zeichnung, objekt.id).map(
            (z) => zuordnungFuer(objekt, baum, z.anschluss).stromkreis,
          ),
        )
        baeume.set(objekt.id, baum)
        freiePorts.set(
          objekt.id,
          stromkreiseImBaum(baum)
            .filter((k) => !belegt.has(k.kennzeichen))
            .map((k) => k.kennzeichen),
        )
        continue
      }
      if (objekt.type !== 'komponente' || !istPortKomponente(objekt)) continue
      const belegung = ermittlePortBelegung(objekt, zuweisungen.get(objekt.id), katalog)
      const frei: string[] = []
      for (const port of belegung) {
        if (!port.belegtDurch) {
          frei.push(port.bezeichnung)
          continue
        }
        if (port.poeGepflegt) poeJePort.set(`${objekt.id}#${port.portIndex}`, port.poeWatt)
      }
      freiePorts.set(objekt.id, frei)
      poeSumme.set(objekt.id, ermittlePoeSummeWatt(belegung))
    }
  }
  return { poeJePort, freiePorts, poeSumme, baeume }
}

function findeKomponente(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KomponentenObjekt | null {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const objekt = blatt?.objekte.find((o) => o.id === objektId)
  return objekt && objekt.type === 'komponente' ? objekt : null
}

function blattName(zeichnung: Zeichnung, blattId: string): string {
  return zeichnung.blaetter.find((b) => b.id === blattId)?.name ?? '?'
}

function kurzName(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
  katalog: readonly CatalogComponent[],
): string {
  return (
    switchBezeichnung(zeichnung, { blattId, objektId }, katalog) ??
    planUebersetzer(zeichnung)('planlisten.allgemein.komponente')
  )
}

function verteilerKnoten(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
  katalog: readonly CatalogComponent[],
  daten: VerteilerDaten,
  kinder: BaumKnoten[] = [],
  kantenText: string | null = null,
  querverweise: string[] = [],
): BaumKnoten {
  const tp = planUebersetzer(zeichnung)
  const instanz = findeKomponente(zeichnung, blattId, objektId)
  const ortskennzeichen = instanz?.verteiler
    ? verteilerKennzeichenText(instanz.verteiler.kennzeichen)
    : null
  const name =
    ortskennzeichen ??
    switchBezeichnung(zeichnung, { blattId, objektId }, katalog) ??
    tp('planlisten.leitungsbaum.verteiler')
  const katalogEintrag = instanz
    ? katalog.find((k) => k.id === instanz.catalogComponentId)
    : undefined
  const produkt =
    katalogEintrag && instanz
      ? aufgeloesteVariante(katalogEintrag, instanz.variantId, planspracheVon(zeichnung)).name
      : null
  const frei = daten.freiePorts.get(objektId) ?? []
  const genannt = frei.slice(0, MAX_GENANNTE_FREIE_PORTS).join(', ')
  const poe = daten.poeSumme.get(objektId) ?? 0
  const ports = instanz ? portAnzahl(instanz) : 0
  const anzahlBetriebsmittel = daten.baeume.get(objektId)?.betriebsmittel.length ?? 0
  return knoten(
    'verteiler',
    name,
    [
      ortskennzeichen && instanz?.beschriftung?.trim() ? instanz.beschriftung.trim() : null,
      produkt && produkt !== name ? produkt : null,
      blattName(zeichnung, blattId),
      frei.length > 0
        ? tp('planlisten.leitungsbaum.freiePorts', {
            anzahl: frei.length,
            ports: `${genannt}${frei.length > genannt.split(', ').length ? ', …' : ''}`,
          })
        : null,
      auchVerbundenMit(tp, querverweise),
    ],
    [
      ports > 0 ? tp('planlisten.leitungsbaum.ports', { n: ports }) : null,
      anzahlBetriebsmittel > 0
        ? tp('planlisten.leitungsbaum.betriebsmittel', { n: anzahlBetriebsmittel })
        : null,
      poe > 0 ? `${poe} W` : null,
    ]
      .filter((t): t is string => t !== null)
      .join(' · ') || null,
    instanz?.farbe ?? '#1a1a1a',
    { blattId, objektId },
    kinder,
    kantenText,
  )
}

function trunkKnoten(
  zeichnung: Zeichnung,
  glied: TrunkKettenGlied,
  anzeigeName: string,
  querverweise: string[],
  kinder: BaumKnoten[],
): BaumKnoten {
  const blatt = zeichnung.blaetter.find((b) => b.id === glied.blattId)
  const laenge =
    blatt && istLaengentauglich(blatt)
      ? meter(pfadGesamtLaenge(glied.trunk.wegpunkte))
      : OHNE_LAENGE
  return knoten(
    'trunk',
    anzeigeName,
    [
      blattName(zeichnung, glied.blattId),
      auchVerbundenMit(planUebersetzer(zeichnung), querverweise),
    ],
    laenge,
    glied.trunk.farbe,
    { blattId: glied.blattId, objektId: glied.trunk.id },
    kinder,
  )
}

function strangKlartext(
  zeichnung: Zeichnung,
  verbundId: string,
  nummer: number,
  katalog: readonly CatalogComponent[],
): string {
  const tp = planUebersetzer(zeichnung)
  const anzeige = beschreibeSchachtStraenge(zeichnung, verbundId, katalog, tp).find(
    (s) => s.nummer === nummer,
  )
  return anzeige
    ? strangTitelMitKlartext(nummer, anzeige.name, anzeige.kurz)
    : tp('planlisten.leitungsbaum.strang', { n: nummer })
}

function schachtKnoten(
  zeichnung: Zeichnung,
  station: Extract<Station, { art: 'schacht' }>,
  nachBlattId: string | null,
  katalog: readonly CatalogComponent[],
  kinder: BaumKnoten[],
): BaumKnoten {
  const schacht = findeSchacht(zeichnung, station.blattId, station.schachtId)
  const steig =
    nachBlattId !== null
      ? steigstreckeMeter(zeichnung, station.verbundId, station.blattId, nachBlattId)
      : 0
  return knoten(
    'schacht',
    `${schacht?.name ?? planUebersetzer(zeichnung)('planlisten.leitungsbaum.kabelschacht')} · ${strangKlartext(zeichnung, station.verbundId, station.strang, katalog)}`,
    [
      nachBlattId !== null
        ? `${blattName(zeichnung, station.blattId)} → ${blattName(zeichnung, nachBlattId)}`
        : blattName(zeichnung, station.blattId),
    ],
    steig > 0 ? meter(steig) : null,
    schacht?.farbe ?? '#1a1a1a',
    { blattId: station.blattId, objektId: station.schachtId },
    kinder,
  )
}

function geraeteKnoten(
  zeichnung: Zeichnung,
  kabel: LeitungsLaenge,
  seite: 'start' | 'ziel',
  gegenstelleText: string | null,
  abschnitte: LeitungsAbschnitt[],
  katalog: readonly CatalogComponent[],
  daten: VerteilerDaten,
): BaumKnoten[] {
  const tp = planUebersetzer(zeichnung)
  const enden = kabelEnden(kabel)
  if (!enden) {
    return [knoten('offen', tp('planlisten.leitungsbaum.offenesEnde'), [], null, '#1a1a1a', null)]
  }
  const ende = seite === 'start' ? enden.start : enden.ziel
  const glied = seite === 'start' ? kabel.glieder[0] : kabel.glieder[kabel.glieder.length - 1]
  const gueltig = kabel.status === 'gueltig'
  const abschnitt = abschnittAmEnde(kabel, abschnitte, seite)
  const kantenText = gueltig && abschnitt !== null && abschnitt > 0 ? meter(abschnitt) : null
  const kennzahl = gueltig ? meter(kabel.verlegeLaengeMeter) : OHNE_LAENGE
  const poe = poeAmEnde(
    ende,
    seite === 'start' ? enden.ziel : enden.start,
    katalog,
    daten,
    zeichnung,
    glied.blattId,
  )
  const untertitel = [
    [`#${kabel.nummer}`, gegenstelleText, poe].filter((t): t is string => !!t).join(' · '),
  ]

  if (ende.art === 'dock' || ende.art === 'switchport') {
    const blattId = ende.art === 'switchport' ? ende.blattId : glied.blattId
    const instanz = findeKomponente(zeichnung, blattId, ende.objektId)

    const module = instanz ? modulKnoten(zeichnung, blattId, instanz, katalog) : []
    const kinder = module.map((modul) =>
      knoten('geraet', modul.titel, [modul.poe], null, modul.farbe, {
        blattId,
        objektId: modul.objektId,
      }),
    )

    return [
      knoten(
        'geraet',
        kurzName(zeichnung, blattId, ende.objektId, katalog),
        untertitel,
        kennzahl,
        instanz?.farbe ?? '#1a1a1a',
        { blattId, objektId: ende.objektId },
        kinder,
        kantenText,
      ),
    ]
  }
  const titel = tp(
    ende.art === 'schacht'
      ? 'planlisten.leitungsbaum.imKabelschacht'
      : 'planlisten.leitungsbaum.offenesEnde',
  )
  return [knoten('offen', titel, untertitel, kennzahl, '#1a1a1a', null, [], kantenText)]
}

function modulKnoten(
  zeichnung: Zeichnung,
  blattId: string,
  traeger: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
): { titel: string; farbe: string; objektId: string; poe: string | null }[] {
  if (!istModulTraeger(traeger)) return []
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  return moduleVonTraeger(blatt.objekte, traeger.id)
    .slice()
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((modul) => {
      const eintrag = katalog.find((k) => k.id === modul.catalogComponentId)
      const watt = eintrag?.poeLeistungWatt ?? eintrag?.wattzahl
      return {
        titel: kurzName(zeichnung, blattId, modul.id, katalog),
        farbe: modul.farbe,
        objektId: modul.id,
        poe: watt === undefined ? null : `${watt} W`,
      }
    })
}

function poeAmEnde(
  ende: LeitungsZiel,
  gegenende: LeitungsZiel,
  katalog: readonly CatalogComponent[],
  daten: VerteilerDaten,
  zeichnung: Zeichnung,
  blattId: string,
): string | null {
  if (gegenende.art === 'switchport') {
    const watt = daten.poeJePort.get(`${gegenende.objektId}#${gegenende.portIndex}`)
    return watt === undefined ? null : `${watt} W`
  }
  if (ende.art !== 'dock') return null
  const instanz = findeKomponente(zeichnung, blattId, ende.objektId)
  const watt = instanz
    ? katalog.find((k) => k.id === instanz.catalogComponentId)?.poeLeistungWatt
    : undefined
  return watt === undefined ? null : `${watt} W`
}

function gegenstelle(
  zeichnung: Zeichnung,
  kabel: LeitungsLaenge,
  seite: 'start' | 'ziel',
  katalog: readonly CatalogComponent[],
): string | null {
  const enden = kabelEnden(kabel)
  if (!enden || kabel.glieder.length === 0) return null
  const gegenende = seite === 'start' ? enden.ziel : enden.start
  const glied = seite === 'start' ? kabel.glieder[kabel.glieder.length - 1] : kabel.glieder[0]
  const imVerteiler = verteilerAnschlussText(
    zeichnung,
    glied.blattId,
    glied.leitung,
    seite === 'start' ? 'ziel' : 'start',
    planUebersetzer(zeichnung),
  )
  if (imVerteiler) return imVerteiler
  switch (gegenende.art) {
    case 'verteiler':
      return kurzName(zeichnung, gegenende.blattId, gegenende.objektId, katalog)
    case 'switchport':
      return `${kurzName(zeichnung, gegenende.blattId, gegenende.objektId, katalog)} ${portBezeichnung(gegenende.portIndex)}`
    case 'dock':
      return kurzName(zeichnung, glied.blattId, gegenende.objektId, katalog)
    case 'schacht':
      return planUebersetzer(zeichnung)('planlisten.leitungsbaum.kabelschacht')
    default:
      return null
  }
}

interface EndeAmTrunk {
  trunkId: string
  kabel: LeitungsLaenge
  seite: 'start' | 'ziel'
  abschnitte: LeitungsAbschnitt[]
}

function endenJeTrunk(
  zeichnung: Zeichnung,
  kabelListe: LeitungsLaenge[],
  alle: Map<string, TrunkKettenGlied>,
  amVerteiler: Map<string, TrunkKettenGlied[]>,
): { jeTrunk: Map<string, EndeAmTrunk[]>; ohneTrunk: EndeAmTrunk[] } {
  const elektroVerteiler = elektroVerteilerIds(zeichnung)
  const jeTrunk = new Map<string, EndeAmTrunk[]>()
  const ohneTrunk: EndeAmTrunk[] = []
  for (const kabel of kabelListe) {
    if (kabel.glieder.length === 0) continue
    const abschnitte = ermittleAbschnittsLaengen(
      zeichnung,
      kabel.glieder[0].blattId,
      kabel.glieder[0].leitung.id,
    )
    const stationen = kabelStationen(zeichnung, kabel, alle, amVerteiler)
    const trunkStationen = stationen.filter((s) => s.art === 'trunk')
    const enden = kabelEnden(kabel)
    if (!enden) continue

    for (const seite of ['start', 'ziel'] as const) {
      const ende = seite === 'start' ? enden.start : enden.ziel
      const gegenende = seite === 'start' ? enden.ziel : enden.start
      if (
        verteilerAmKabelEnde(ende, elektroVerteiler) !== null &&
        gegenende.art === 'dock' &&
        !elektroVerteiler.has(gegenende.objektId)
      )
        continue
      const station =
        seite === 'start' ? trunkStationen[0] : trunkStationen[trunkStationen.length - 1]
      const eintrag: EndeAmTrunk = { trunkId: '', kabel, seite, abschnitte }
      if (!station || station.art !== 'trunk') {
        ohneTrunk.push(eintrag)
        continue
      }
      eintrag.trunkId = station.trunkId
      const liste = jeTrunk.get(station.trunkId) ?? []
      liste.push(eintrag)
      jeTrunk.set(station.trunkId, liste)
    }
  }
  return { jeTrunk, ohneTrunk }
}

interface TrunkBaumKontext {
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  daten: VerteilerDaten
  alle: Map<string, TrunkKettenGlied>
  amVerteiler: Map<string, TrunkKettenGlied[]>
  jeTrunk: Map<string, EndeAmTrunk[]>
  straenge: Map<string, SchachtStrangEintrag>
  namen: Map<string, string>
}

function baueTrunkTeilbaum(
  kontext: TrunkBaumKontext,
  glied: TrunkKettenGlied,
  besucht: Set<string>,
  wurzelVerteilerId: string | null,
  herkunftTrunkId: string | null = null,
): BaumKnoten {
  besucht.add(`trunk:${glied.trunk.id}`)
  const kinder: BaumKnoten[] = []
  const querverweise: string[] = []

  for (const ende of glied.trunk.enden) {
    if (!ende.dockRef || ende.dockRef.objektId === wurzelVerteilerId) continue
    if (besucht.has(`verteiler:${ende.dockRef.objektId}`)) continue
    besucht.add(`verteiler:${ende.dockRef.objektId}`)
    kinder.push(
      verteilerKnoten(
        kontext.zeichnung,
        glied.blattId,
        ende.dockRef.objektId,
        kontext.katalog,
        kontext.daten,
      ),
    )
  }

  for (const ende of glied.trunk.enden) {
    const nachbarId = ende.verbundenesEnde?.trunkId ?? ende.verbundenerPfad?.trunkId
    if (nachbarId === undefined) continue
    const nachbar = kontext.alle.get(nachbarId)
    if (!nachbar) continue
    if (nachbarId === herkunftTrunkId) continue
    if (besucht.has(`trunk:${nachbarId}`)) {
      querverweise.push(kontext.namen.get(nachbarId) ?? nachbar.trunk.name)
      continue
    }
    kinder.push(baueTrunkTeilbaum(kontext, nachbar, besucht, null, glied.trunk.id))
  }
  for (const anderer of kontext.alle.values()) {
    const zeigtHierher = anderer.trunk.enden.some(
      (e) => e.verbundenerPfad?.trunkId === glied.trunk.id,
    )
    if (!zeigtHierher) continue
    if (besucht.has(`trunk:${anderer.trunk.id}`)) continue
    kinder.push(baueTrunkTeilbaum(kontext, anderer, besucht, null, glied.trunk.id))
  }

  for (const [schluessel, strang] of kontext.straenge) {
    if (besucht.has(schluessel)) continue
    if (!strang.glieder.some((g) => g.trunk.id === glied.trunk.id)) continue
    besucht.add(schluessel)
    const weitere = strang.glieder.filter(
      (g) => g.trunk.id !== glied.trunk.id && !besucht.has(`trunk:${g.trunk.id}`),
    )
    const nachBlattId = weitere.find((g) => g.blattId !== glied.blattId)?.blattId ?? null
    kinder.push(
      schachtKnoten(
        kontext.zeichnung,
        { ...strang.station, blattId: glied.blattId },
        nachBlattId,
        kontext.katalog,
        weitere.map((g) => baueTrunkTeilbaum(kontext, g, besucht, null)),
      ),
    )
  }

  for (const ende of kontext.jeTrunk.get(glied.trunk.id) ?? []) {
    kinder.push(
      ...geraeteKnoten(
        kontext.zeichnung,
        ende.kabel,
        ende.seite,
        gegenstelle(kontext.zeichnung, ende.kabel, ende.seite, kontext.katalog),
        ende.abschnitte,
        kontext.katalog,
        kontext.daten,
      ),
    )
  }

  return trunkKnoten(
    kontext.zeichnung,
    glied,
    kontext.namen.get(glied.trunk.id) ?? glied.trunk.name,
    querverweise,
    kinder,
  )
}

function baueTrunkWurzeln(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: LeitungsbaumObjekt['umfang'],
  katalog: readonly CatalogComponent[],
): BaumKnoten[] {
  const alle = sammleTrunks(zeichnung)
  const amVerteiler = trunksAmVerteiler(alle)
  const daten = sammleVerteilerDaten(zeichnung, katalog)
  const kabelListe = ermittleAlleLeitungsLaengen(zeichnung)
  const { jeTrunk, ohneTrunk } = endenJeTrunk(zeichnung, kabelListe, alle, amVerteiler)

  const straenge = sammleSchachtStraenge(zeichnung)

  const kanten = trunkNachbarschaft(zeichnung)
  const erledigt = new Set<string>()
  const wurzeln: BaumKnoten[] = []

  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk' || erledigt.has(objekt.id)) continue
      const kette = ermittleTrunkKette(zeichnung, blatt.id, objekt.id, kanten)
      for (const g of kette) erledigt.add(g.trunk.id)
      if (umfang === 'blatt' && !kette.some((g) => g.blattId === blattId)) continue

      const namen = ermittleTeilstueckNamen(zeichnung, kette)
      const kontext: TrunkBaumKontext = {
        zeichnung,
        katalog,
        daten,
        alle,
        amVerteiler,
        jeTrunk,
        straenge,
        namen,
      }
      const mitVerteiler = kette.find((g) => g.trunk.enden.some((e) => e.dockRef))
      const start = mitVerteiler ?? kette[0]
      const dockRef = mitVerteiler?.trunk.enden.find((e) => e.dockRef)?.dockRef ?? null
      const besucht = new Set<string>()
      const teilbaum = baueTrunkTeilbaum(kontext, start, besucht, dockRef?.objektId ?? null)
      wurzeln.push(
        dockRef
          ? verteilerKnoten(zeichnung, start.blattId, dockRef.objektId, katalog, daten, [teilbaum])
          : teilbaum,
      )
    }
  }

  const direkte = ohneTrunk.filter(
    (e) => umfang === 'projekt' || e.kabel.glieder.some((g) => g.blattId === blattId),
  )
  if (direkte.length > 0) {
    wurzeln.push(
      knoten(
        'hinweis',
        planUebersetzer(zeichnung)('planlisten.leitungsbaum.direktverbindungen'),
        [planUebersetzer(zeichnung)('planlisten.leitungsbaum.ohneTrunkGezeichnet')],
        null,
        '#1a1a1a',
        null,
        direkte.flatMap((e) =>
          geraeteKnoten(
            zeichnung,
            e.kabel,
            e.seite,
            gegenstelle(zeichnung, e.kabel, e.seite, katalog),
            e.abschnitte,
            katalog,
            daten,
          ),
        ),
      ),
    )
  }
  return wurzeln
}

interface TrunkGruppe {
  schluessel: string
  blattId: string
  name: string
  glieder: TrunkKettenGlied[]
}

interface TrunkGruppen {
  jeSchluessel: Map<string, TrunkGruppe>
  vonTrunk: Map<string, string>
}

function sammleTrunkGruppen(zeichnung: Zeichnung): TrunkGruppen {
  const kanten = trunkNachbarschaft(zeichnung)
  const jeSchluessel = new Map<string, TrunkGruppe>()
  const vonTrunk = new Map<string, string>()
  const erledigt = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk' || erledigt.has(objekt.id)) continue
      for (const glied of ermittleTrunkKette(zeichnung, blatt.id, objekt.id, kanten)) {
        erledigt.add(glied.trunk.id)
        const schluessel = `gruppe:${objekt.id}#${glied.blattId}`
        vonTrunk.set(glied.trunk.id, schluessel)
        const vorhanden = jeSchluessel.get(schluessel)
        if (vorhanden) vorhanden.glieder.push(glied)
        else {
          jeSchluessel.set(schluessel, {
            schluessel,
            blattId: glied.blattId,
            name: glied.trunk.name,
            glieder: [glied],
          })
        }
      }
    }
  }
  return { jeSchluessel, vonTrunk }
}

function trunkGruppenKnoten(
  zeichnung: Zeichnung,
  gruppe: TrunkGruppe,
  querverweise: string[],
  kinder: BaumKnoten[],
): BaumKnoten {
  const blatt = zeichnung.blaetter.find((b) => b.id === gruppe.blattId)
  const summe = gruppe.glieder.reduce((s, g) => s + pfadGesamtLaenge(g.trunk.wegpunkte), 0)
  return knoten(
    'trunk',
    gruppe.name,
    [
      blattName(zeichnung, gruppe.blattId),
      gruppe.glieder.length > 1
        ? planUebersetzer(zeichnung)('planlisten.leitungsbaum.teilstuecke', {
            n: gruppe.glieder.length,
          })
        : null,
      auchVerbundenMit(planUebersetzer(zeichnung), querverweise),
    ],
    blatt && istLaengentauglich(blatt) ? meter(summe) : OHNE_LAENGE,
    gruppe.glieder[0].trunk.farbe,
    { blattId: gruppe.blattId, objektId: gruppe.glieder[0].trunk.id },
    kinder,
  )
}

function sammleVerteilerBlaetter(zeichnung: Zeichnung): Map<string, string> {
  const blaetter = new Map<string, string>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (istBaumVerteiler(objekt)) blaetter.set(objekt.id, blatt.id)
    }
  }
  return blaetter
}

function zeichenReihenfolgeIndex(zeichnung: Zeichnung, gruppen: TrunkGruppen): Map<string, number> {
  const index = new Map<string, number>()
  let n = 0
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') {
        const schluessel = gruppen.vonTrunk.get(objekt.id)
        if (schluessel !== undefined && !index.has(schluessel)) index.set(schluessel, n)
        n++
      } else if (istBaumVerteiler(objekt)) {
        index.set(`verteiler:${objekt.id}`, n++)
      }
    }
  }
  return index
}

function sammleVerteilerVerteilerKanten(kabelListe: LeitungsLaenge[]): Map<string, string[]> {
  const kanten = new Map<string, string[]>()
  const ergaenze = (von: string, nach: string) => {
    const liste = kanten.get(von) ?? []
    liste.push(nach)
    kanten.set(von, liste)
  }
  for (const kabel of kabelListe) {
    const enden = kabelEnden(kabel)
    if (!enden || enden.start.art !== 'switchport' || enden.ziel.art !== 'switchport') continue
    ergaenze(enden.start.objektId, enden.ziel.objektId)
    ergaenze(enden.ziel.objektId, enden.start.objektId)
  }
  return kanten
}

interface NetzGeraeteEnde {
  eintrag: EndeAmTrunk
  gruppe: string | null
}

function verteileGeraeteEnden(
  jeTrunk: Map<string, EndeAmTrunk[]>,
  ohneTrunk: EndeAmTrunk[],
  gruppen: TrunkGruppen,
  elektroVerteiler: ReadonlySet<string> = new Set(),
): {
  jeVerteiler: Map<string, NetzGeraeteEnde[]>
  jeGruppe: Map<string, EndeAmTrunk[]>
  direkte: EndeAmTrunk[]
} {
  const jeVerteiler = new Map<string, NetzGeraeteEnde[]>()
  const jeGruppe = new Map<string, EndeAmTrunk[]>()
  const direkte: EndeAmTrunk[] = []
  const alleEnden: NetzGeraeteEnde[] = [
    ...[...jeTrunk.values()].flatMap((liste) =>
      liste.map((eintrag) => ({
        eintrag,
        gruppe: gruppen.vonTrunk.get(eintrag.trunkId) ?? null,
      })),
    ),
    ...ohneTrunk.map((eintrag) => ({ eintrag, gruppe: null })),
  ]
  for (const ende of alleEnden) {
    const enden = kabelEnden(ende.eintrag.kabel)
    if (!enden) continue
    const eigen = ende.eintrag.seite === 'start' ? enden.start : enden.ziel
    const gegen = ende.eintrag.seite === 'start' ? enden.ziel : enden.start
    const eigenerVerteiler = verteilerAmKabelEnde(eigen, elektroVerteiler)
    const gegenVerteiler = verteilerAmKabelEnde(gegen, elektroVerteiler)
    if (eigenerVerteiler !== null && gegenVerteiler !== null) continue
    if (gegenVerteiler !== null) {
      const liste = jeVerteiler.get(gegenVerteiler) ?? []
      liste.push(ende)
      jeVerteiler.set(gegenVerteiler, liste)
      continue
    }
    if (ende.gruppe === null) {
      direkte.push(ende.eintrag)
      continue
    }
    const liste = jeGruppe.get(ende.gruppe) ?? []
    liste.push(ende.eintrag)
    jeGruppe.set(ende.gruppe, liste)
  }
  return { jeVerteiler, jeGruppe, direkte }
}

function gegenstellePortNurNummer(kabel: LeitungsLaenge, seite: 'start' | 'ziel'): string | null {
  const enden = kabelEnden(kabel)
  if (!enden) return null
  const gegen = seite === 'start' ? enden.ziel : enden.start
  return gegen.art === 'switchport' ? portBezeichnung(gegen.portIndex) : null
}

interface NetzBaumKontext {
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  daten: VerteilerDaten
  gruppen: TrunkGruppen
  straenge: Map<string, SchachtStrangEintrag>
  verteilerBlaetter: Map<string, string>
  jeVerteiler: Map<string, NetzGeraeteEnde[]>
  jeGruppe: Map<string, EndeAmTrunk[]>
  nachbarn: Map<string, Set<string>>
  trunksAnzeigen: boolean
  elektroVerteiler: ReadonlySet<string>
}

function trunkTrunkNachbarn(
  alle: Map<string, TrunkKettenGlied>,
  glied: TrunkKettenGlied,
): TrunkKettenGlied[] {
  const nachbarn: TrunkKettenGlied[] = []
  for (const ende of glied.trunk.enden) {
    const nachbarId = ende.verbundenesEnde?.trunkId ?? ende.verbundenerPfad?.trunkId
    if (nachbarId === undefined) continue
    const nachbar = alle.get(nachbarId)
    if (nachbar) nachbarn.push(nachbar)
  }
  for (const anderer of alle.values()) {
    const zeigtHierher = anderer.trunk.enden.some(
      (e) => e.verbundenerPfad?.trunkId === glied.trunk.id,
    )
    if (zeigtHierher) nachbarn.push(anderer)
  }
  return nachbarn
}

function baueNetzGraph(
  alle: Map<string, TrunkKettenGlied>,
  gruppen: TrunkGruppen,
  amVerteiler: Map<string, TrunkKettenGlied[]>,
  straenge: Map<string, SchachtStrangEintrag>,
  verteilerKanten: Map<string, string[]>,
  verteilerIds: ReadonlySet<string>,
): Map<string, Set<string>> {
  const nachbarn = new Map<string, Set<string>>()
  const verbinde = (a: string, b: string) => {
    const menge = nachbarn.get(a)
    if (menge) menge.add(b)
    else nachbarn.set(a, new Set([b]))
  }
  const symmetrisch = (a: string, b: string) => {
    if (a === b) return
    verbinde(a, b)
    verbinde(b, a)
  }
  for (const id of verteilerIds)
    if (!nachbarn.has(`verteiler:${id}`)) nachbarn.set(`verteiler:${id}`, new Set())
  for (const schluessel of gruppen.jeSchluessel.keys())
    if (!nachbarn.has(schluessel)) nachbarn.set(schluessel, new Set())

  for (const glied of alle.values()) {
    const eigene = gruppen.vonTrunk.get(glied.trunk.id)
    if (eigene === undefined) continue
    for (const nachbar of trunkTrunkNachbarn(alle, glied)) {
      const andere = gruppen.vonTrunk.get(nachbar.trunk.id)
      if (andere !== undefined) symmetrisch(eigene, andere)
    }
  }
  for (const [schluessel, strang] of straenge) {
    for (const glied of strang.glieder) {
      const gruppe = gruppen.vonTrunk.get(glied.trunk.id)
      if (gruppe !== undefined) symmetrisch(schluessel, gruppe)
    }
  }
  for (const [verteilerId, glieder] of amVerteiler) {
    for (const glied of glieder) {
      const gruppe = gruppen.vonTrunk.get(glied.trunk.id)
      if (gruppe !== undefined) symmetrisch(`verteiler:${verteilerId}`, gruppe)
    }
  }
  for (const [verteilerId, nachbarIds] of verteilerKanten) {
    for (const nachbarId of nachbarIds)
      symmetrisch(`verteiler:${verteilerId}`, `verteiler:${nachbarId}`)
  }
  return nachbarn
}

function komponenten(nachbarn: Map<string, Set<string>>): string[][] {
  const besucht = new Set<string>()
  const ergebnis: string[][] = []
  for (const start of nachbarn.keys()) {
    if (besucht.has(start)) continue
    const gruppe: string[] = []
    const warteschlange = [start]
    besucht.add(start)
    while (warteschlange.length > 0) {
      const aktuell = warteschlange.shift()!
      gruppe.push(aktuell)
      for (const nachbar of nachbarn.get(aktuell) ?? []) {
        if (besucht.has(nachbar)) continue
        besucht.add(nachbar)
        warteschlange.push(nachbar)
      }
    }
    ergebnis.push(gruppe)
  }
  return ergebnis
}

function waehleWurzel(mitglieder: string[], index: Map<string, number>): string {
  const rang = (s: string) => index.get(s) ?? Number.POSITIVE_INFINITY
  const verteiler = mitglieder.filter((m) => m.startsWith('verteiler:'))
  const kandidaten =
    verteiler.length > 0 ? verteiler : mitglieder.filter((m) => m.startsWith('gruppe:'))
  return (kandidaten.length > 0 ? kandidaten : mitglieder).reduce((bester, m) =>
    rang(m) < rang(bester) ? m : bester,
  )
}

function komponenteBeruehrtBlatt(
  mitglieder: string[],
  blattId: string,
  gruppen: TrunkGruppen,
  verteilerBlaetter: Map<string, string>,
): boolean {
  return mitglieder.some((m) => {
    if (m.startsWith('gruppe:')) return gruppen.jeSchluessel.get(m)?.blattId === blattId
    if (m.startsWith('verteiler:')) {
      return verteilerBlaetter.get(m.slice('verteiler:'.length)) === blattId
    }
    return false
  })
}

function anzeigeName(kontext: NetzBaumKontext, schluessel: string): string {
  if (schluessel.startsWith('gruppe:')) {
    return kontext.gruppen.jeSchluessel.get(schluessel)?.name ?? '?'
  }
  const tp = planUebersetzer(kontext.zeichnung)
  if (schluessel.startsWith('verteiler:')) {
    const id = schluessel.slice('verteiler:'.length)
    const blattId = kontext.verteilerBlaetter.get(id) ?? ''
    return (
      switchBezeichnung(kontext.zeichnung, { blattId, objektId: id }, kontext.katalog) ??
      tp('planlisten.leitungsbaum.verteiler')
    )
  }
  const strang = kontext.straenge.get(schluessel)
  const schacht =
    strang && findeSchacht(kontext.zeichnung, strang.station.blattId, strang.station.schachtId)
  return strang
    ? `${schacht?.name ?? tp('planlisten.leitungsbaum.kabelschacht')} · ${strangKlartext(kontext.zeichnung, strang.station.verbundId, strang.station.strang, kontext.katalog)}`
    : '?'
}

function eigeneBlattId(
  kontext: NetzBaumKontext,
  schluessel: string,
  herkunftBlattId: string | null,
): string | null {
  if (schluessel.startsWith('gruppe:')) {
    return kontext.gruppen.jeSchluessel.get(schluessel)?.blattId ?? herkunftBlattId
  }
  if (schluessel.startsWith('verteiler:')) {
    return kontext.verteilerBlaetter.get(schluessel.slice('verteiler:'.length)) ?? herkunftBlattId
  }
  const strang = kontext.straenge.get(schluessel)
  return strang?.glieder.find((g) => g.blattId !== herkunftBlattId)?.blattId ?? herkunftBlattId
}

function baueGeraeteLeaf(
  kontext: NetzBaumKontext,
  entry: EndeAmTrunk,
  direkt: boolean,
): BaumKnoten[] {
  const gegenstelleText = direkt
    ? gegenstellePortNurNummer(entry.kabel, entry.seite)
    : gegenstelle(kontext.zeichnung, entry.kabel, entry.seite, kontext.katalog)
  return geraeteKnoten(
    kontext.zeichnung,
    entry.kabel,
    entry.seite,
    gegenstelleText,
    entry.abschnitte,
    kontext.katalog,
    kontext.daten,
  )
}

function findeGruppenKnoten(
  kinder: readonly BaumKnoten[],
  gruppen: TrunkGruppen,
  schluessel: string,
): BaumKnoten | null {
  for (const kind of kinder) {
    if (
      kind.art === 'trunk' &&
      kind.quelle &&
      gruppen.vonTrunk.get(kind.quelle.objektId) === schluessel
    ) {
      return kind
    }
    const tiefer = findeGruppenKnoten(kind.kinder, gruppen, schluessel)
    if (tiefer) return tiefer
  }
  return null
}

function haengeGeraeteAn(kontext: NetzBaumKontext, verteilerId: string, kinder: BaumKnoten[]) {
  if (kontext.elektroVerteiler.has(verteilerId)) {
    haengeGeraeteAnBetriebsmittel(kontext, verteilerId, kinder)
    return
  }
  const ergaenzt = new Map<string, BaumKnoten>()
  for (const { eintrag, gruppe } of kontext.jeVerteiler.get(verteilerId) ?? []) {
    if (gruppe === null || !kontext.trunksAnzeigen) {
      kinder.push(...baueGeraeteLeaf(kontext, eintrag, true))
      continue
    }
    const station = findeGruppenKnoten(kinder, kontext.gruppen, gruppe) ?? ergaenzt.get(gruppe)
    if (station) {
      station.kinder.push(...baueGeraeteLeaf(kontext, eintrag, false))
      continue
    }
    const eintragGruppe = kontext.gruppen.jeSchluessel.get(gruppe)
    if (!eintragGruppe) {
      kinder.push(...baueGeraeteLeaf(kontext, eintrag, true))
      continue
    }
    const neu = trunkGruppenKnoten(
      kontext.zeichnung,
      eintragGruppe,
      [],
      baueGeraeteLeaf(kontext, eintrag, false),
    )
    ergaenzt.set(gruppe, neu)
    kinder.push(neu)
  }
}

function haengeGeraeteAnBetriebsmittel(
  kontext: NetzBaumKontext,
  verteilerId: string,
  kinder: BaumKnoten[],
) {
  const baum = kontext.daten.baeume.get(verteilerId)
  const instanz = findeKomponente(
    kontext.zeichnung,
    kontext.verteilerBlaetter.get(verteilerId) ?? '',
    verteilerId,
  )
  const jeKreis = new Map<string, { geraete: BaumKnoten[]; zuordnungen: StromkreisZuordnung[] }>()
  for (const { eintrag } of kontext.jeVerteiler.get(verteilerId) ?? []) {
    const kabel = eintrag.kabel
    const verteilerSeite = eintrag.seite === 'start' ? 'ziel' : 'start'
    const glied =
      verteilerSeite === 'start' ? kabel.glieder[0] : kabel.glieder[kabel.glieder.length - 1]
    const anschluesse = (glied?.leitung.verteilerAnschluesse ?? []).filter(
      (a) => a.ende === verteilerSeite,
    )
    const zuordnungen =
      instanz && baum ? anschluesse.map((a) => zuordnungFuer(instanz, baum, a)) : []
    const schluessel =
      zuordnungen.find((z) => z.stromkreis)?.stromkreis ?? zuordnungen[0]?.knoten ?? ''
    const gruppe = jeKreis.get(schluessel) ?? { geraete: [], zuordnungen: [] }
    gruppe.geraete.push(...baueGeraeteLeaf(kontext, eintrag, false))
    gruppe.zuordnungen.push(...zuordnungen)
    jeKreis.set(schluessel, gruppe)
  }
  const farbe = instanz?.farbe ?? '#1a1a1a'
  const tp = planUebersetzer(kontext.zeichnung)
  for (const k of baum?.knoten ?? []) {
    const gruppe = jeKreis.get(k.kennzeichen)
    if (!gruppe || k.kanal) continue
    jeKreis.delete(k.kennzeichen)
    const weg = ermittleStromweg(k)
    const klemmen = [
      ...new Set(gruppe.zuordnungen.map((z) => z.klemme).filter((t): t is string => !!t)),
    ]
    kinder.push(
      knoten(
        'betriebsmittel',
        [k.kennzeichen, typText(k.geraet)].filter(Boolean).join(' '),
        [
          k.eintrag.bezeichnung ?? null,
          weg.phase,
          weg.rcd ? `RCD ${weg.rcd.kennzeichen}` : null,
          klemmen.length > 0 ? klemmen.join(', ') : null,
        ],
        null,
        farbe,
        null,
        gruppe.geraete,
      ),
    )
  }
  for (const [schluessel, gruppe] of jeKreis) {
    const bekannt = baum?.betriebsmittel.some((b) => schluessel.split(':')[0] === b.kennzeichen)
    kinder.push(
      knoten(
        'betriebsmittel',
        !schluessel
          ? tp('planlisten.leitungsbaum.ohneAnschluss')
          : bekannt
            ? schluessel
            : tp('planlisten.allgemein.fehlt', { kennzeichen: schluessel }),
        [],
        null,
        farbe,
        null,
        gruppe.geraete,
      ),
    )
  }
}

function baueNetzTeilbaum(
  kontext: NetzBaumKontext,
  schluessel: string,
  besucht: Set<string>,
  herkunftSchluessel: string | null,
  herkunftBlattId: string | null,
): BaumKnoten[] {
  besucht.add(schluessel)
  const eigeneBlatt = eigeneBlattId(kontext, schluessel, herkunftBlattId)
  const kinder: BaumKnoten[] = []
  const querverweise: string[] = []

  for (const nachbar of kontext.nachbarn.get(schluessel) ?? []) {
    if (nachbar === herkunftSchluessel) continue
    if (besucht.has(nachbar)) {
      if (kontext.trunksAnzeigen || nachbar.startsWith('verteiler:')) {
        querverweise.push(anzeigeName(kontext, nachbar))
      }
      continue
    }
    kinder.push(...baueNetzTeilbaum(kontext, nachbar, besucht, schluessel, eigeneBlatt))
  }

  if (schluessel.startsWith('gruppe:')) {
    for (const eintrag of kontext.jeGruppe.get(schluessel) ?? []) {
      kinder.push(...baueGeraeteLeaf(kontext, eintrag, false))
    }
    const gruppe = kontext.gruppen.jeSchluessel.get(schluessel)
    if (!kontext.trunksAnzeigen || !gruppe) return kinder
    return [trunkGruppenKnoten(kontext.zeichnung, gruppe, querverweise, kinder)]
  }
  if (schluessel.startsWith('schacht:')) {
    const strang = kontext.straenge.get(schluessel)
    if (!kontext.trunksAnzeigen || !strang) return kinder
    return [
      schachtKnoten(
        kontext.zeichnung,
        { ...strang.station, blattId: herkunftBlattId ?? strang.station.blattId },
        eigeneBlatt,
        kontext.katalog,
        kinder,
      ),
    ]
  }

  const id = schluessel.slice('verteiler:'.length)
  haengeGeraeteAn(kontext, id, kinder)
  return [
    verteilerKnoten(
      kontext.zeichnung,
      kontext.verteilerBlaetter.get(id) ?? '',
      id,
      kontext.katalog,
      kontext.daten,
      kinder,
      null,
      querverweise,
    ),
  ]
}

function baueVerteilerWurzeln(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: LeitungsbaumObjekt['umfang'],
  katalog: readonly CatalogComponent[],
  trunksAnzeigen: boolean,
  verteilerplaene: readonly Zeichnung[] = [],
): BaumKnoten[] {
  const alle = sammleTrunks(zeichnung)
  const amVerteiler = trunksAmVerteiler(alle)
  const daten = sammleVerteilerDaten(zeichnung, katalog, verteilerplaene)
  const kabelListe = ermittleAlleLeitungsLaengen(zeichnung)
  const { jeTrunk, ohneTrunk } = endenJeTrunk(zeichnung, kabelListe, alle, amVerteiler)
  const gruppen = sammleTrunkGruppen(zeichnung)
  const elektroVerteiler = elektroVerteilerIds(zeichnung)
  const { jeVerteiler, jeGruppe, direkte } = verteileGeraeteEnden(
    jeTrunk,
    ohneTrunk,
    gruppen,
    elektroVerteiler,
  )
  const straenge = sammleSchachtStraenge(zeichnung)
  const verteilerBlaetter = sammleVerteilerBlaetter(zeichnung)
  const verteilerKanten = sammleVerteilerVerteilerKanten(kabelListe)

  const nachbarn = baueNetzGraph(
    alle,
    gruppen,
    amVerteiler,
    straenge,
    verteilerKanten,
    new Set(verteilerBlaetter.keys()),
  )
  const index = zeichenReihenfolgeIndex(zeichnung, gruppen)
  const kontext: NetzBaumKontext = {
    zeichnung,
    katalog,
    daten,
    gruppen,
    straenge,
    verteilerBlaetter,
    jeVerteiler,
    jeGruppe,
    nachbarn,
    trunksAnzeigen,
    elektroVerteiler,
  }

  const komponentenListe = komponenten(nachbarn)
    .filter(
      (mitglieder) =>
        umfang === 'projekt' ||
        komponenteBeruehrtBlatt(mitglieder, blattId, gruppen, verteilerBlaetter),
    )
    .sort((a, b) => {
      const kleinsterRang = (m: string[]) => Math.min(...m.map((s) => index.get(s) ?? Infinity))
      return kleinsterRang(a) - kleinsterRang(b)
    })

  const wurzeln: BaumKnoten[] = []
  for (const mitglieder of komponentenListe) {
    const teil = baueNetzTeilbaum(kontext, waehleWurzel(mitglieder, index), new Set(), null, null)
    if (teil.length === 1) {
      wurzeln.push(teil[0])
      continue
    }
    if (teil.length === 0) continue
    const tp = planUebersetzer(zeichnung)
    wurzeln.push(
      knoten(
        'hinweis',
        tp('planlisten.leitungsbaum.ohneVerteiler'),
        [tp('planlisten.leitungsbaum.anTrunksOhneSwitch')],
        null,
        '#1a1a1a',
        null,
        teil,
      ),
    )
  }

  const direkteImUmfang = direkte.filter(
    (e) => umfang === 'projekt' || e.kabel.glieder.some((g) => g.blattId === blattId),
  )
  if (direkteImUmfang.length > 0) {
    wurzeln.push(
      knoten(
        'hinweis',
        planUebersetzer(zeichnung)('planlisten.leitungsbaum.direktverbindungen'),
        [planUebersetzer(zeichnung)('planlisten.leitungsbaum.ohneTrunkGezeichnet')],
        null,
        '#1a1a1a',
        null,
        direkteImUmfang.flatMap((e) =>
          geraeteKnoten(
            zeichnung,
            e.kabel,
            e.seite,
            gegenstelle(zeichnung, e.kabel, e.seite, katalog),
            e.abschnitte,
            katalog,
            daten,
          ),
        ),
      ),
    )
  }
  return wurzeln
}

interface Masse {
  textHoehe: number
  zeichenBreite: number
  zeilenHoehe: number
  knotenRand: number
  ebenenAbstand: number
  geschwisterAbstand: number
  stapelAbstand: number
  stich: number
}

function masse(textHoehe: number): Masse {
  return {
    textHoehe,
    zeichenBreite: textHoehe * ZEICHEN_BREITE_ANTEIL,
    zeilenHoehe: textHoehe * ZEILEN_HOEHE_ANTEIL,
    knotenRand: textHoehe * KNOTEN_RAND_ANTEIL,
    ebenenAbstand: textHoehe * EBENEN_ABSTAND_ANTEIL,
    geschwisterAbstand: textHoehe * GESCHWISTER_ABSTAND_ANTEIL,
    stapelAbstand: textHoehe * STAPEL_ABSTAND_ANTEIL,
    stich: textHoehe * STICH_ANTEIL,
  }
}

function istGestapelt(knotenArt: BaumKnotenArt): boolean {
  return knotenArt === 'geraet' || knotenArt === 'offen'
}

function knotenGroesse(k: BaumKnoten, m: Masse): { breite: number; hoehe: number } {
  const titelZeichen = Math.max(...k.titel.map((z) => z.length), 0)
  const kennzahlZeichen = k.kennzahl ? k.kennzahl.length + 2 : 0
  const untertitelZeichen = Math.max(...k.untertitel.map((z) => z.length), 0) * UNTERTITEL_SKALA
  const zeichen = Math.max(titelZeichen + kennzahlZeichen, untertitelZeichen)
  const zeilen = k.titel.length + k.untertitel.length
  return {
    breite: zeichen * m.zeichenBreite + 2 * m.knotenRand,
    hoehe: zeilen * m.zeilenHoehe + m.knotenRand,
  }
}

interface Block {
  layouts: BaumLayoutKnoten[]
  breite: number
  ankerX: number
}

function verschiebe(layout: BaumLayoutKnoten, dx: number) {
  layout.x += dx
  for (const kind of layout.kinder) verschiebe(kind, dx)
}

function stapelBlock(blaetter: BaumKnoten[], y: number, m: Masse): Block {
  const layouts: BaumLayoutKnoten[] = []
  let aktuellesY = y
  let breite = 0
  for (const blatt of blaetter) {
    const groesse = knotenGroesse(blatt, m)
    layouts.push({
      knoten: blatt,
      x: m.stich,
      y: aktuellesY,
      breite: groesse.breite,
      hoehe: groesse.hoehe,
      gestapelt: true,
      kinder: [],
    })
    aktuellesY += groesse.hoehe + m.stapelAbstand
    breite = Math.max(breite, m.stich + groesse.breite)
  }
  return { layouts, breite, ankerX: 0 }
}

function platziere(k: BaumKnoten, y: number, m: Masse): Block {
  const groesse = knotenGroesse(k, m)
  const kinderY = y + groesse.hoehe + m.ebenenAbstand
  const blaetter = k.kinder.filter((kind) => istGestapelt(kind.art) && kind.kinder.length === 0)
  const struktur = k.kinder.filter((kind) => !istGestapelt(kind.art) || kind.kinder.length > 0)

  const bloecke: Block[] = []
  if (blaetter.length > 0) bloecke.push(stapelBlock(blaetter, kinderY, m))
  for (const kind of struktur) bloecke.push(platziere(kind, kinderY, m))

  let kinderBreite = 0
  for (const [index, block] of bloecke.entries()) {
    if (index > 0) kinderBreite += m.geschwisterAbstand
    verschiebeBlock(block, kinderBreite)
    kinderBreite += block.breite
  }

  const gesamtBreite = Math.max(groesse.breite, kinderBreite)
  const kinderVersatz = (gesamtBreite - kinderBreite) / 2
  const kopfVersatz = (gesamtBreite - groesse.breite) / 2
  for (const block of bloecke) verschiebeBlock(block, kinderVersatz)

  const layout: BaumLayoutKnoten = {
    knoten: k,
    x: kopfVersatz,
    y,
    breite: groesse.breite,
    hoehe: groesse.hoehe,
    gestapelt: false,
    kinder: bloecke.flatMap((block) => block.layouts),
  }
  return { layouts: [layout], breite: gesamtBreite, ankerX: kopfVersatz + groesse.breite / 2 }
}

function verschiebeBlock(block: Block, dx: number) {
  for (const layout of block.layouts) verschiebe(layout, dx)
  block.ankerX += dx
}

function hoeheVon(layout: BaumLayoutKnoten): number {
  return Math.max(layout.y + layout.hoehe, ...layout.kinder.map((kind) => hoeheVon(kind)))
}

function zaehleKnoten(layout: BaumLayoutKnoten): number {
  return 1 + layout.kinder.reduce((summe, kind) => summe + zaehleKnoten(kind), 0)
}

export function leitungsbaumTitel(objekt: LeitungsbaumObjekt, uebersetze: Uebersetzer = t): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  const projekt = objekt.umfang === 'projekt'
  if (objekt.gliederung === 'trunk') {
    return uebersetze(
      projekt
        ? 'planlisten.leitungsbaum.titelTrunkZeichnung'
        : 'planlisten.leitungsbaum.titelTrunkBlatt',
    )
  }
  return uebersetze(
    projekt
      ? 'planlisten.leitungsbaum.titelVerteilerZeichnung'
      : 'planlisten.leitungsbaum.titelVerteilerBlatt',
  )
}

export function baueLeitungsbaumModell(
  objekt: LeitungsbaumObjekt,
  kontext: TabellenKontext,
): BaumModell {
  const blatt = kontext.zeichnung.blaetter.find((b) => b.id === kontext.blattId)
  const zeichenflaecheBreite = blatt?.zeichenflaeche
    ? zeichenflaecheGroesseWelt(blatt.zeichenflaeche).breite
    : undefined
  const wurzeln =
    objekt.gliederung === 'trunk'
      ? baueTrunkWurzeln(kontext.zeichnung, kontext.blattId, objekt.umfang, kontext.katalog)
      : baueVerteilerWurzeln(
          kontext.zeichnung,
          kontext.blattId,
          objekt.umfang,
          kontext.katalog,
          objekt.trunksAnzeigen,
          kontext.verteilerplaene,
        )

  const m = masse(objekt.textHoehe)
  const titelHoehe = m.zeilenHoehe
  const inhalt: BaumLayoutKnoten[] = []
  let breite = 0
  const tp = planUebersetzer(kontext.zeichnung)
  const bloecke = (wurzeln.length > 0 ? wurzeln : [leererBaumHinweis(tp)]).map((wurzel) =>
    platziere(wurzel, titelHoehe, m),
  )
  for (const block of bloecke) {
    if (breite > 0) breite += m.textHoehe * WURZEL_ABSTAND_ANTEIL
    verschiebeBlock(block, breite)
    breite += block.breite
    inhalt.push(...block.layouts)
  }

  const hoehe = Math.max(titelHoehe, ...inhalt.map((layout) => hoeheVon(layout)))
  const ziel = objekt.zielBreite ?? zeichenflaecheBreite ?? null
  const faktor = objekt.einpassen && ziel !== null && breite > ziel ? ziel / breite : 1
  const knotenZahl = inhalt.reduce((summe, layout) => summe + zaehleKnoten(layout), 0)

  return {
    titel:
      faktor < 1
        ? tp('planlisten.leitungsbaum.titelMitKnoten', {
            titel: leitungsbaumTitel(objekt, tp),
            n: knotenZahl,
          })
        : leitungsbaumTitel(objekt, tp),
    titelHoehe: titelHoehe * faktor,
    wurzeln: faktor === 1 ? inhalt : inhalt.map((layout) => skaliere(layout, faktor)),
    gesamtBreite: breite * faktor,
    gesamtHoehe: hoehe * faktor,
    textHoehe: objekt.textHoehe * faktor,
  }
}

function leererBaumHinweis(tp: Uebersetzer): BaumKnoten {
  return knoten(
    'hinweis',
    tp('planlisten.leitungsbaum.leer'),
    [tp('planlisten.leitungsbaum.nichtsZuZeigen')],
    null,
    '#1a1a1a',
    null,
  )
}

function skaliere(layout: BaumLayoutKnoten, faktor: number): BaumLayoutKnoten {
  return {
    ...layout,
    x: layout.x * faktor,
    y: layout.y * faktor,
    breite: layout.breite * faktor,
    hoehe: layout.hoehe * faktor,
    kinder: layout.kinder.map((kind) => skaliere(kind, faktor)),
  }
}
