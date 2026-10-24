import { t } from '../sprache'
import type { Schluessel, Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import type { Point } from './geometry'
import type { KomponentenTyp, Slot, SlotMatrix } from './geraetegruppe'
import { ansteuerungBezeichnung, typBezeichnung } from './geraete-regelwerk'
import { gruppiereSlotsNachZeile, typHatSlotMatrix } from './geraetegruppe'
import {
  ableiteSlotMatrix,
  ermittleTypUndSlots,
  ermittleZielAnsteuerung,
  ermittleZielTyp,
  zielBezeichnung,
} from './geraetegruppen-ableitung'
import { findeRaumZuPunkt } from './raum'
import { stuecklistenAngaben } from './variable-texte'
import {
  knxAktorStuecklistenName,
  knxAktorTitel,
  knxKanalFunktionsText,
  knxKanalName,
  knxPaarBeginn,
  type KnxAktorDaten,
} from './knx-aktor'
import { ermittleKnxZiele } from './knx-zuordnung'
import { verlegungVon } from './komponenten-verlegung'
import { istSchaltplan } from './zeichnungsart'
import { planspracheVon, planUebersetzer, spracheDesUebersetzers } from './plansprache'
import { komponentenText, variablerTextName, variantenText } from './katalog-uebersetzung'
import type {
  AktorkanallisteObjekt,
  BetriebsmittellisteObjekt,
  KomponentenObjekt,
  LeitungslisteObjekt,
  Objekt,
  PotentiallisteObjekt,
  RaumlisteObjekt,
  SteuerungslogikObjekt,
  StromkreisverzeichnisObjekt,
  StuecklistenObjekt,
  SwitchplanObjekt,
  TrunklisteObjekt,
} from './objekte'
import { neueObjektBasis } from './objekte'
import { ermittleBetriebsmittelGruppen } from './betriebsmittelkennzeichnung'
import { ermittlePotentialGruppen } from './potential'
import { kabeltypText } from './kabeltyp-verwendung'
import type { LeitungsLaenge } from './leitungslaenge'
import { beschreibeLeitungsEnde, ermittleAlleLeitungsLaengen, kabelEnden } from './leitungslaenge'
import {
  ermittleVerteilerZuweisungen,
  geraeteZusammenfassung,
  leitungsKennzeichen,
  vergleicheKennzeichen,
  verteilerAnschlussText,
} from './verteiler-belegung'
import {
  baueVerteilerBaum,
  ermittleStromweg,
  istKopf,
  stromkreiseImBaum,
  typText,
  type VerteilerKnoten,
} from './verteiler-baum'
import {
  ermittleStromkreisZuordnungen,
  stromkreisLangtext,
  zuordnungFuer,
} from './stromkreis-zuordnung'
import { alleVerteiler, verteilerKennzeichenText } from './verteiler'
import type { Zeichnung } from './zeichnung'
import {
  ermittleAlleSwitches,
  ermittlePoeSummeWatt,
  ermittlePortBelegung,
  istPortKomponente,
  sammlePortZuweisungen,
  switchBezeichnung,
} from './switch-ports'
import { ermittleTrunkKette, findeLeitungenInTrunks, trunkNachbarschaft } from './trunk-kette'
import { slotNameText } from './katalog-uebersetzung'

const ZEICHEN_BREITE_ANTEIL = 0.6
const ZEILEN_HOEHE_ANTEIL = 1.6
const ZELL_RAND_ANTEIL = 0.4
const MAX_SPALTEN_ZEICHEN = 30
export const STANDARD_TABELLEN_TEXTHOEHE = 0.1
const SLOT_GRAFIK_SEITE_ANTEIL = 2.5
const LEER = '–'

export type Spaltenausrichtung = 'links' | 'rechts'

export interface TabellenSpalte {
  kopf: string
  ausrichtung: Spaltenausrichtung
  breite: number
}

export interface TabellenZeile {
  zellen: string[][]
  hoehe: number
  grafik?: { spalte: number; matrix: SlotMatrixGrafik }
}

export interface SlotMatrixGrafik {
  reihen: (1 | 2)[]
  hervorgehoben: number
}

export interface TabellenModell {
  titel: string
  titelHoehe: number
  spalten: TabellenSpalte[]
  kopfHoehe: number
  zeilen: TabellenZeile[]
  summe: TabellenZeile | null
  gesamtBreite: number
  gesamtHoehe: number
  grafikSeite: number
}

export function brichUm(text: string, maxZeichen: number): string[] {
  if (text.length <= maxZeichen) return [text]
  const zeilen: string[] = []
  let aktuell = ''
  for (const wort of text.split(' ')) {
    if (wort.length > maxZeichen) {
      if (aktuell) {
        zeilen.push(aktuell)
        aktuell = ''
      }
      for (let i = 0; i < wort.length; i += maxZeichen) {
        const stueck = wort.slice(i, i + maxZeichen)
        if (stueck.length === maxZeichen) zeilen.push(stueck)
        else aktuell = stueck
      }
      continue
    }
    const kandidat = aktuell ? `${aktuell} ${wort}` : wort
    if (kandidat.length <= maxZeichen) {
      aktuell = kandidat
    } else {
      zeilen.push(aktuell)
      aktuell = wort
    }
  }
  if (aktuell || zeilen.length === 0) zeilen.push(aktuell)
  return zeilen
}

export interface Spaltendefinition {
  kopf: Schluessel
  ausrichtung: Spaltenausrichtung
}

export function spaltenKoepfe(
  definitionen: readonly Spaltendefinition[],
  tp: Uebersetzer,
): string[] {
  return definitionen.map((definition) => tp(definition.kopf))
}

function layoutTabelle(
  titel: string,
  definitionen: Spaltendefinition[],
  rohZeilen: string[][],
  rohSumme: string[] | null,
  textHoehe: number,
  tp: Uebersetzer,
  slotGrafik?: TabellenRohdaten['slotGrafik'],
): TabellenModell {
  const koepfe = spaltenKoepfe(definitionen, tp)
  const zeichenBreite = textHoehe * ZEICHEN_BREITE_ANTEIL
  const zeilenHoehe = textHoehe * ZEILEN_HOEHE_ANTEIL
  const zellRand = textHoehe * ZELL_RAND_ANTEIL
  const grafikSeite = slotGrafik ? textHoehe * SLOT_GRAFIK_SEITE_ANTEIL : 0

  const alleRohZeilen = rohSumme ? [...rohZeilen, rohSumme] : rohZeilen
  const umgebrochen = alleRohZeilen.map((zeile) =>
    definitionen.map((_, spalte) => brichUm(zeile[spalte] ?? '', MAX_SPALTEN_ZEICHEN)),
  )

  const spalten: TabellenSpalte[] = definitionen.map((definition, index) => {
    const laengen = [
      koepfe[index].length,
      ...umgebrochen.map((zeile) => Math.max(...zeile[index].map((t) => t.length))),
    ]
    const zeichen = Math.min(Math.max(...laengen), MAX_SPALTEN_ZEICHEN)
    const textBreite = zeichen * zeichenBreite
    return {
      kopf: koepfe[index],
      ausrichtung: definition.ausrichtung,
      breite:
        (slotGrafik?.spalte === index ? Math.max(textBreite, grafikSeite) : textBreite) +
        2 * zellRand,
    }
  })

  const zuZeile = (zellen: string[][]): TabellenZeile => ({
    zellen,
    hoehe: Math.max(...zellen.map((z) => z.length)) * zeilenHoehe,
  })
  const zeilen = umgebrochen.slice(0, rohZeilen.length).map((zellen, index): TabellenZeile => {
    const matrix = slotGrafik?.jeZeile[index]
    if (!slotGrafik || !matrix) return zuZeile(zellen)
    const zeile = zuZeile(zellen)
    return {
      ...zeile,
      hoehe: Math.max(zeile.hoehe, grafikSeite + 2 * zellRand),
      grafik: { spalte: slotGrafik.spalte, matrix },
    }
  })
  const summe = rohSumme ? zuZeile(umgebrochen[umgebrochen.length - 1]) : null

  const gesamtBreite = spalten.reduce((summeBreite, spalte) => summeBreite + spalte.breite, 0)
  const gesamtHoehe =
    zeilenHoehe + // Titelzeile
    zeilenHoehe + // Kopfzeile
    zeilen.reduce((h, zeile) => h + zeile.hoehe, 0) +
    (summe ? summe.hoehe : 0)

  return {
    titel,
    titelHoehe: zeilenHoehe,
    spalten,
    kopfHoehe: zeilenHoehe,
    zeilen,
    summe,
    gesamtBreite,
    gesamtHoehe,
    grafikSeite,
  }
}

export interface TabellenZellTreffer {
  zeilenIndex: number
  spaltenIndex: number
}

export function zelleAmPunkt(
  modell: TabellenModell,
  position: Point,
  punkt: Point,
): TabellenZellTreffer | null {
  const relX = punkt.x - position.x
  const relY = position.y - punkt.y
  if (relX < 0 || relX > modell.gesamtBreite || relY < 0 || relY > modell.gesamtHoehe) return null

  let spaltenIndex = -1
  let x = 0
  for (let i = 0; i < modell.spalten.length; i++) {
    x += modell.spalten[i].breite
    if (relX < x) {
      spaltenIndex = i
      break
    }
  }
  if (spaltenIndex === -1) return null

  let y = modell.titelHoehe + modell.kopfHoehe
  if (relY < y) return null // Titel- oder Kopfzeile

  for (let zeilenIndex = 0; zeilenIndex < modell.zeilen.length; zeilenIndex++) {
    const hoehe = modell.zeilen[zeilenIndex].hoehe
    if (relY < y + hoehe) return { zeilenIndex, spaltenIndex }
    y += hoehe
  }
  return null // Summenzeile oder ausserhalb
}

function komponentenImUmfang(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: StuecklistenObjekt['umfang'],
): KomponentenObjekt[] {
  const blaetter =
    umfang === 'projekt' ? zeichnung.blaetter : zeichnung.blaetter.filter((b) => b.id === blattId)
  const ergebnis: KomponentenObjekt[] = []
  for (const blatt of blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'komponente') ergebnis.push(objekt)
    }
  }
  return ergebnis
}

export function stuecklistenTitel(objekt: StuecklistenObjekt, uebersetze: Uebersetzer = t): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.stueckliste.titelZeichnung'
      : 'planlisten.stueckliste.titelBlatt',
  )
}

export const STUECKLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.stueckliste.spalten.hersteller', ausrichtung: 'links' },
  { kopf: 'planlisten.stueckliste.spalten.artikelnummer', ausrichtung: 'links' },
  { kopf: 'planlisten.stueckliste.spalten.name', ausrichtung: 'links' },
  { kopf: 'planlisten.stueckliste.spalten.variante', ausrichtung: 'links' },
  { kopf: 'planlisten.stueckliste.spalten.anzahl', ausrichtung: 'rechts' },
  { kopf: 'planlisten.stueckliste.spalten.poe', ausrichtung: 'rechts' },
]

const STUECKLISTEN_ANGABEN_SPALTE: Spaltendefinition = {
  kopf: 'planlisten.stueckliste.spalten.angaben',
  ausrichtung: 'links',
}
const STUECKLISTEN_ANGABEN_INDEX = 4

export interface TabellenRohdaten {
  zeilen: string[][]
  spalten?: Spaltendefinition[]
  summe: string[]
  slotGrafik?: { spalte: number; jeZeile: SlotMatrixGrafik[] }
}

export function stuecklistenRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: StuecklistenObjekt['umfang'],
  katalog: readonly CatalogComponent[],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  interface Eintrag {
    hersteller: string
    artikelnummer: string
    name: string
    variante: string
    angaben: string
    anzahl: number
    poeJeStueck: number | null
  }
  const eintraege = new Map<string, Eintrag>()
  const mitVerlegung = !istSchaltplan(zeichnung)
  const sprache = spracheDesUebersetzers(tp)

  for (const komponente of komponentenImUmfang(zeichnung, blattId, umfang)) {
    const katalogEintrag = katalog.find((k) => k.id === komponente.catalogComponentId)
    const angaben = stuecklistenAngaben(komponente.textElemente, (variable) =>
      katalogEintrag ? variablerTextName(katalogEintrag, variable, sprache) : variable,
    )
    const verlegung = mitVerlegung
      ? ` (${tp(verlegungVon(komponente) === 'in' ? 'planlisten.stueckliste.up' : 'planlisten.stueckliste.ap')})`
      : ''
    const knxName = komponente.knxAktor ? knxAktorStuecklistenName(komponente.knxAktor, tp) : null
    const schluessel = `${komponente.catalogComponentId}|${komponente.variantId ?? ''}|${angaben}|${verlegung}|${knxName ?? ''}`
    const vorhanden = eintraege.get(schluessel)
    if (vorhanden) {
      vorhanden.anzahl += 1
      continue
    }
    if (knxName) {
      eintraege.set(schluessel, {
        hersteller: katalogEintrag?.hersteller ?? LEER,
        artikelnummer: LEER,
        name: `${knxName}${verlegung}`,
        variante: LEER,
        angaben,
        anzahl: 1,
        poeJeStueck: null,
      })
      continue
    }
    if (!katalogEintrag) {
      eintraege.set(schluessel, {
        hersteller: LEER,
        artikelnummer: LEER,
        name: `${tp('planlisten.allgemein.katalogeintragFehlt')}${verlegung}`,
        variante: LEER,
        angaben,
        anzahl: 1,
        poeJeStueck: null,
      })
      continue
    }
    const aufgeloest = aufgeloesteVariante(katalogEintrag, komponente.variantId, sprache)
    const variante = katalogEintrag.varianten.find((v) => v.id === komponente.variantId)
    eintraege.set(schluessel, {
      hersteller: katalogEintrag.hersteller ?? LEER,
      artikelnummer: aufgeloest.artikelnummer ?? LEER,
      name: `${aufgeloest.name}${verlegung}`,
      variante: variante
        ? variante.farbe !== undefined
          ? variantenText(katalogEintrag, variante, 'farbe', sprache)
          : variante.name !== undefined
            ? variantenText(katalogEintrag, variante, 'name', sprache)
            : LEER
        : LEER,
      angaben,
      anzahl: 1,
      poeJeStueck: katalogEintrag.poeLeistungWatt ?? null,
    })
  }

  const ohneHersteller = (e: Eintrag) => (e.hersteller === LEER ? 1 : 0)
  const sortiert = [...eintraege.values()].sort(
    (a, b) =>
      ohneHersteller(a) - ohneHersteller(b) ||
      a.hersteller.localeCompare(b.hersteller, undefined, { numeric: true }) ||
      a.artikelnummer.localeCompare(b.artikelnummer, undefined, { numeric: true }) ||
      a.name.localeCompare(b.name, undefined, { numeric: true }) ||
      a.angaben.localeCompare(b.angaben, undefined, { numeric: true }),
  )

  const mitAngaben = sortiert.some((e) => e.angaben !== '')
  const zeilen = sortiert.map((e) => {
    const zeile = [
      e.hersteller,
      e.artikelnummer,
      e.name,
      e.variante,
      String(e.anzahl),
      e.poeJeStueck === null ? LEER : String(e.poeJeStueck * e.anzahl),
    ]
    if (mitAngaben) zeile.splice(STUECKLISTEN_ANGABEN_INDEX, 0, e.angaben || LEER)
    return zeile
  })
  const gesamtAnzahl = sortiert.reduce((summe, e) => summe + e.anzahl, 0)
  const gesamtPoe = sortiert.reduce(
    (summe, e) => summe + (e.poeJeStueck === null ? 0 : e.poeJeStueck * e.anzahl),
    0,
  )
  const summe = [
    tp('planlisten.allgemein.summe'),
    '',
    '',
    '',
    String(gesamtAnzahl),
    String(gesamtPoe),
  ]
  if (!mitAngaben) return { zeilen, summe, spalten: STUECKLISTEN_SPALTEN }
  summe.splice(STUECKLISTEN_ANGABEN_INDEX, 0, '')
  const spalten = [...STUECKLISTEN_SPALTEN]
  spalten.splice(STUECKLISTEN_ANGABEN_INDEX, 0, STUECKLISTEN_ANGABEN_SPALTE)
  return { zeilen, summe, spalten }
}

export function baueStuecklistenModell(
  objekt: StuecklistenObjekt,
  zeichnung: Zeichnung,
  blattId: string,
  katalog: readonly CatalogComponent[],
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe, spalten } = stuecklistenRohdaten(
    zeichnung,
    blattId,
    objekt.umfang,
    katalog,
    tp,
  )
  return layoutTabelle(
    stuecklistenTitel(objekt, tp),
    spalten ?? STUECKLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function leitungslistenTitel(
  objekt: LeitungslisteObjekt,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.leitungsliste.titelZeichnung'
      : 'planlisten.leitungsliste.titelBlatt',
  )
}

export const LEITUNGSLISTE_TYP_SPALTENINDEX = 1

export const LEITUNGSLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.leitungsliste.spalten.nummer', ausrichtung: 'rechts' },
  { kopf: 'planlisten.leitungsliste.spalten.typ', ausrichtung: 'links' },
  { kopf: 'planlisten.leitungsliste.spalten.von', ausrichtung: 'links' },
  { kopf: 'planlisten.leitungsliste.spalten.nach', ausrichtung: 'links' },
  { kopf: 'planlisten.leitungsliste.spalten.blaetter', ausrichtung: 'links' },
  { kopf: 'planlisten.leitungsliste.spalten.laenge', ausrichtung: 'rechts' },
  { kopf: 'planlisten.leitungsliste.spalten.verlegelaenge', ausrichtung: 'rechts' },
]

function meter(wert: number): string {
  return wert.toFixed(2)
}

function kabelTyp(kabel: LeitungsLaenge, zeichnung: Zeichnung): string {
  const texte = kabel.glieder
    .map((glied) => kabeltypText(glied.leitung, zeichnung.kabeltypen))
    .filter((text): text is string => !!text)
  return [...new Set(texte)].join(' / ') || LEER
}

export function leitungslistenKabel(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: LeitungslisteObjekt['umfang'],
): LeitungsLaenge[] {
  const alle = ermittleAlleLeitungsLaengen(zeichnung)
  return umfang === 'projekt' ? alle : alle.filter((k) => k.beruehrteBlattIds.includes(blattId))
}

const LEITUNGSLISTE_STROMKREIS_SPALTE: Spaltendefinition = {
  kopf: 'planlisten.leitungsliste.spalten.stromkreis',
  ausrichtung: 'links',
}
const LEITUNGSLISTE_STROMKREIS_INDEX = 4

export function leitungslistenRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: LeitungslisteObjekt['umfang'],
  katalog: readonly CatalogComponent[],
  mitStromkreis = true,
  verteilerplaene: readonly Zeichnung[] = [],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  const kabel = leitungslistenKabel(zeichnung, blattId, umfang)
  const zuordnungen = mitStromkreis
    ? ermittleStromkreisZuordnungen(zeichnung, katalog, verteilerplaene)
    : null
  const stromkreisVon = (k: LeitungsLaenge) =>
    [
      ...new Set(
        k.glieder.flatMap((g) =>
          (zuordnungen?.leitungen.get(g.leitung.id) ?? []).map((z) => stromkreisLangtext(z, false)),
        ),
      ),
    ].join(', ')

  const zeilen = kabel.map((k) => {
    const enden = kabelEnden(k)
    const blaetter = k.beruehrteBlattIds
    const blattNamen = zeichnung.blaetter
      .filter((b) => blaetter.includes(b.id))
      .map((b) => b.name)
      .join(', ')
    const gueltig = k.status === 'gueltig'
    const vonBlatt = zeichnung.blaetter.find((b) => b.id === k.glieder[0].blattId)?.name
    const erstes = k.glieder[0]
    const letztes = k.glieder[k.glieder.length - 1]
    const imVerteiler = (glied: typeof erstes, ende: 'start' | 'ziel') =>
      verteilerAnschlussText(zeichnung, glied.blattId, glied.leitung, ende, tp)
    return [
      String(k.nummer),
      kabelTyp(k, zeichnung),
      enden
        ? [
            imVerteiler(erstes, 'start'),
            beschreibeLeitungsEnde(zeichnung, erstes.blattId, enden.start, katalog, tp),
            vonBlatt,
          ]
            .filter((t): t is string => !!t)
            .join(' · ')
        : LEER,
      enden
        ? [
            imVerteiler(letztes, 'ziel'),
            beschreibeLeitungsEnde(zeichnung, letztes.blattId, enden.ziel, katalog, tp),
          ]
            .filter((t): t is string => !!t)
            .join(' · ')
        : LEER,
      blattNamen || LEER,
      gueltig ? meter(k.planLaengeMeter) : LEER,
      gueltig ? meter(k.verlegeLaengeMeter) : LEER,
    ]
  })
  const stromkreise = kabel.map(stromkreisVon)
  const mitSpalte = stromkreise.some((t) => t !== '')
  if (mitSpalte)
    zeilen.forEach((zeile, i) =>
      zeile.splice(LEITUNGSLISTE_STROMKREIS_INDEX, 0, stromkreise[i] || LEER),
    )

  const gueltige = kabel.filter((k) => k.status === 'gueltig')
  const ohneLaenge = kabel.length - gueltige.length
  const summiere = (auswahl: (k: LeitungsLaenge) => number) =>
    gueltige.reduce((s, k) => s + auswahl(k), 0)
  const summenzeile = [
    ohneLaenge > 0
      ? tp('planlisten.leitungsliste.summeOhneLaenge', { n: ohneLaenge })
      : tp('planlisten.allgemein.summe'),
    '',
    '',
    '',
    '',
    meter(summiere((k) => k.planLaengeMeter)),
    meter(summiere((k) => k.verlegeLaengeMeter)),
  ]
  if (!mitSpalte) return { zeilen, summe: summenzeile }
  summenzeile.splice(LEITUNGSLISTE_STROMKREIS_INDEX, 0, '')
  const spalten = [...LEITUNGSLISTEN_SPALTEN]
  spalten.splice(LEITUNGSLISTE_STROMKREIS_INDEX, 0, LEITUNGSLISTE_STROMKREIS_SPALTE)
  return { zeilen, summe: summenzeile, spalten }
}

export function baueLeitungslistenModell(
  objekt: LeitungslisteObjekt,
  zeichnung: Zeichnung,
  blattId: string,
  katalog: readonly CatalogComponent[],
  verteilerplaene: readonly Zeichnung[] = [],
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe, spalten } = leitungslistenRohdaten(
    zeichnung,
    blattId,
    objekt.umfang,
    katalog,
    objekt.stromkreisSpalte !== false,
    verteilerplaene,
    tp,
  )
  return layoutTabelle(
    leitungslistenTitel(objekt, tp),
    spalten ?? LEITUNGSLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

const SWITCHPLAN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.switchplan.spalten.port', ausrichtung: 'links' },
  { kopf: 'planlisten.switchplan.spalten.bezeichnung', ausrichtung: 'links' },
  { kopf: 'planlisten.switchplan.spalten.geraet', ausrichtung: 'links' },
  { kopf: 'planlisten.switchplan.spalten.poe', ausrichtung: 'rechts' },
]

export function baueSwitchplanModell(
  objekt: SwitchplanObjekt,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const blatt = zeichnung.blaetter.find((b) => b.id === objekt.switchBlattId)
  const switchInstanz = blatt?.objekte.find(
    (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objekt.switchObjektId,
  )

  const patchpanel = objekt.planArt === 'patchpanel'
  const planName = tp(
    patchpanel ? 'planlisten.switchplan.patchpanelplan' : 'planlisten.switchplan.switchplan',
  )

  if (!switchInstanz || !istPortKomponente(switchInstanz)) {
    const hinweis =
      objekt.switchObjektId === null
        ? tp(
            patchpanel
              ? 'planlisten.switchplan.patchpanelWaehlen'
              : 'planlisten.switchplan.switchWaehlen',
          )
        : tp(
            patchpanel
              ? 'planlisten.switchplan.patchpanelFehlt'
              : 'planlisten.switchplan.switchFehlt',
          )
    return layoutTabelle(
      objekt.titel ?? planName,
      SWITCHPLAN_SPALTEN,
      [['–', hinweis, '–', '–']],
      null,
      objekt.textHoehe,
      tp,
    )
  }

  const belegung = ermittlePortBelegung(
    switchInstanz,
    sammlePortZuweisungen(zeichnung).get(switchInstanz.id),
    katalog,
  )
  const sprache = planspracheVon(zeichnung)
  const zeilen = belegung.map((port) => [
    port.bezeichnung,
    port.beschriftung ?? LEER,
    port.belegtDurch
      ? port.gegenstelleKatalog
        ? komponentenText(port.gegenstelleKatalog, 'name', sprache)
        : tp('planlisten.switchplan.unbekannt')
      : tp('planlisten.switchplan.frei'),
    port.belegtDurch ? (port.poeGepflegt ? String(port.poeWatt) : LEER) : LEER,
  ])
  const summenzeile = [
    tp('planlisten.allgemein.summe'),
    '',
    '',
    String(ermittlePoeSummeWatt(belegung)),
  ]

  return layoutTabelle(
    objekt.titel ?? switchplanUeberschrift(zeichnung, objekt, switchInstanz, katalog, planName),
    SWITCHPLAN_SPALTEN,
    zeilen,
    summenzeile,
    objekt.textHoehe,
    tp,
  )
}

export function geraetePortSpalten(
  bauart: 'switch' | 'patchpanel',
  uebersetze: Uebersetzer = t,
): string[] {
  return [
    uebersetze(
      bauart === 'switch'
        ? 'planlisten.geraetePorts.spalten.switch'
        : 'planlisten.geraetePorts.spalten.patchfeld',
    ),
    uebersetze('planlisten.geraetePorts.spalten.geraet'),
    uebersetze('planlisten.geraetePorts.spalten.port'),
    uebersetze('planlisten.geraetePorts.spalten.bezeichnung'),
    uebersetze('planlisten.geraetePorts.spalten.angeschlossen'),
    uebersetze('planlisten.geraetePorts.spalten.poe'),
  ]
}

export function alleGeraetePortRohdaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  bauart: 'switch' | 'patchpanel',
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  const zuweisungen = sammlePortZuweisungen(zeichnung)
  const zeilen: string[][] = []
  let gesamtPoe = 0
  const sprache = spracheDesUebersetzers(tp)

  for (const eintrag of ermittleAlleSwitches(zeichnung, katalog, bauart)) {
    const blatt = zeichnung.blaetter.find((b) => b.id === eintrag.blattId)
    const switchInstanz = blatt?.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === eintrag.objektId,
    )
    if (!switchInstanz) continue
    const katalogEintrag = katalog.find((k) => k.id === switchInstanz.catalogComponentId)
    const produkt = katalogEintrag
      ? aufgeloesteVariante(katalogEintrag, switchInstanz.variantId, sprache).name
      : LEER

    const belegung = ermittlePortBelegung(switchInstanz, zuweisungen.get(switchInstanz.id), katalog)
    for (const port of belegung) {
      const poe = port.belegtDurch && port.poeGepflegt ? port.poeWatt : null
      if (poe !== null) gesamtPoe += poe
      zeilen.push([
        eintrag.bezeichnung,
        produkt,
        port.bezeichnung,
        port.beschriftung ?? LEER,
        port.belegtDurch
          ? port.gegenstelleKatalog
            ? komponentenText(port.gegenstelleKatalog, 'name', sprache)
            : tp('planlisten.switchplan.unbekannt')
          : tp('planlisten.switchplan.frei'),
        poe === null ? LEER : String(poe),
      ])
    }
  }

  return { zeilen, summe: [tp('planlisten.allgemein.summe'), '', '', '', '', String(gesamtPoe)] }
}

function switchplanUeberschrift(
  zeichnung: Zeichnung,
  objekt: SwitchplanObjekt,
  switchInstanz: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  planName: string,
): string {
  const name =
    objekt.switchBlattId !== null && objekt.switchObjektId !== null
      ? switchBezeichnung(
          zeichnung,
          { blattId: objekt.switchBlattId, objektId: objekt.switchObjektId },
          katalog,
        )
      : null
  const katalogEintrag = katalog.find((k) => k.id === switchInstanz.catalogComponentId)
  const produkt = katalogEintrag
    ? aufgeloesteVariante(katalogEintrag, switchInstanz.variantId, planspracheVon(zeichnung)).name
    : null
  if (!name) return produkt ?? planName
  return produkt && produkt !== name ? `${name}  (${produkt})` : name
}

export function trunklistenTitel(objekt: TrunklisteObjekt, uebersetze: Uebersetzer = t): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.trunkliste.titelKomplett'
      : 'planlisten.trunkliste.titelEtage',
  )
}

export const TRUNKLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.trunkliste.spalten.trunk', ausrichtung: 'links' },
  { kopf: 'planlisten.trunkliste.spalten.blaetter', ausrichtung: 'links' },
  { kopf: 'planlisten.trunkliste.spalten.leitungen', ausrichtung: 'links' },
]

export function trunklistenRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: TrunklisteObjekt['umfang'],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  interface Zeile {
    name: string
    blaetter: string
    nummern: number[]
  }
  const zeilen: Zeile[] = []
  const kanten = trunkNachbarschaft(zeichnung)

  const blattNamenVon = (blattIds: Iterable<string>) => {
    const menge = new Set(blattIds)
    return zeichnung.blaetter
      .filter((b) => menge.has(b.id))
      .map((b) => b.name)
      .join(', ')
  }

  if (umfang === 'projekt') {
    const besucht = new Set<string>()
    for (const blatt of zeichnung.blaetter) {
      for (const objekt of blatt.objekte) {
        if (objekt.type !== 'trunk' || besucht.has(objekt.id)) continue
        const kette = ermittleTrunkKette(zeichnung, blatt.id, objekt.id, kanten)
        for (const glied of kette) besucht.add(glied.trunk.id)
        const leitungen = findeLeitungenInTrunks(zeichnung, new Set(kette.map((g) => g.trunk.id)))
        zeilen.push({
          name: objekt.name,
          blaetter: blattNamenVon(kette.map((g) => g.blattId)) || LEER,
          nummern: leitungen.map((l) => l.leitung.nummer),
        })
      }
    }
  } else {
    const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
    const blattName = blatt?.name ?? LEER
    const besucht = new Set<string>()
    for (const objekt of blatt?.objekte ?? []) {
      if (objekt.type !== 'trunk' || besucht.has(objekt.id)) continue
      const kette = ermittleTrunkKette(zeichnung, blattId, objekt.id, kanten)
      for (const glied of kette) besucht.add(glied.trunk.id)
      const teilstueckeHier = kette.filter((g) => g.blattId === blattId).map((g) => g.trunk.id)
      const leitungen = findeLeitungenInTrunks(zeichnung, new Set(teilstueckeHier))
      zeilen.push({
        name: objekt.name,
        blaetter: blattName,
        nummern: leitungen.map((l) => l.leitung.nummer),
      })
    }
  }

  zeilen.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  const rohZeilen = zeilen.map((z) => [
    z.name,
    z.blaetter,
    z.nummern.length > 0
      ? [...z.nummern]
          .sort((a, b) => a - b)
          .map((n) => `#${n}`)
          .join(', ')
      : LEER,
  ])
  const gesamtLeitungen = new Set(zeilen.flatMap((z) => z.nummern)).size
  const summenzeile = [
    tp('planlisten.trunkliste.summe', { n: zeilen.length }),
    '',
    tp('planlisten.trunkliste.leitungenGesamt', { n: gesamtLeitungen }),
  ]

  return { zeilen: rohZeilen, summe: summenzeile }
}

export function baueTrunklistenModell(
  objekt: TrunklisteObjekt,
  zeichnung: Zeichnung,
  blattId: string,
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe } = trunklistenRohdaten(zeichnung, blattId, objekt.umfang, tp)
  return layoutTabelle(
    trunklistenTitel(objekt, tp),
    TRUNKLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function raumlistenTitel(objekt: RaumlisteObjekt, uebersetze: Uebersetzer = t): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.raumliste.titelZeichnung'
      : 'planlisten.raumliste.titelBlatt',
  )
}

export const RAUMLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.raumliste.spalten.raum', ausrichtung: 'links' },
  { kopf: 'planlisten.raumliste.spalten.blatt', ausrichtung: 'links' },
  { kopf: 'planlisten.raumliste.spalten.flaeche', ausrichtung: 'rechts' },
]

export function raumlistenRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: RaumlisteObjekt['umfang'],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  const blaetter =
    umfang === 'projekt' ? zeichnung.blaetter : zeichnung.blaetter.filter((b) => b.id === blattId)
  interface Zeile {
    name: string
    blatt: string
    flaeche: number
  }
  const zeilen: Zeile[] = []
  for (const blatt of blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'raum') continue
      zeilen.push({ name: objekt.name, blatt: blatt.name, flaeche: objekt.flaeche })
    }
  }
  zeilen.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  const rohZeilen = zeilen.map((z) => [z.name, z.blatt, `${z.flaeche.toFixed(1)} m²`])
  const gesamtFlaeche = zeilen.reduce((summe, z) => summe + z.flaeche, 0)
  const summenzeile = [
    tp('planlisten.raumliste.summe', { n: zeilen.length }),
    '',
    `${gesamtFlaeche.toFixed(1)} m²`,
  ]

  return { zeilen: rohZeilen, summe: summenzeile }
}

export function baueRaumlistenModell(
  objekt: RaumlisteObjekt,
  zeichnung: Zeichnung,
  blattId: string,
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe } = raumlistenRohdaten(zeichnung, blattId, objekt.umfang, tp)
  return layoutTabelle(
    raumlistenTitel(objekt, tp),
    RAUMLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function betriebsmittellistenTitel(
  objekt: BetriebsmittellisteObjekt,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.betriebsmittelliste.titelZeichnung'
      : 'planlisten.betriebsmittelliste.titelBlatt',
  )
}

export const BETRIEBSMITTELLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.betriebsmittelliste.spalten.kennzeichen', ausrichtung: 'links' },
  { kopf: 'planlisten.betriebsmittelliste.spalten.bauteiltyp', ausrichtung: 'links' },
  { kopf: 'planlisten.betriebsmittelliste.spalten.ort', ausrichtung: 'links' },
  { kopf: 'planlisten.betriebsmittelliste.spalten.hinweis', ausrichtung: 'links' },
]

export function betriebsmittellistenRohdaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  umfang: BetriebsmittellisteObjekt['umfang'],
  bauplaene: readonly Zeichnung[] = [],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  interface Zeile {
    kennzeichen: string
    bauteiltyp: string
    ort: string
    hinweis: string
  }
  const zeilen: Zeile[] = []
  const verwaisteSichtbareKennzeichen = new Set<string>()
  const sprache = spracheDesUebersetzers(tp)
  for (const gruppe of ermittleBetriebsmittelGruppen(zeichnung)) {
    for (const vorkommen of gruppe.vorkommen) {
      if (umfang === 'blatt' && vorkommen.blattId !== blattId) continue
      if (gruppe.verwaist) verwaisteSichtbareKennzeichen.add(gruppe.kennzeichen)
      const katalogEintrag = katalog.find((k) => k.id === vorkommen.catalogComponentId)
      const bauteiltyp = katalogEintrag
        ? aufgeloesteVariante(katalogEintrag, vorkommen.variantId, sprache).name
        : tp('planlisten.allgemein.katalogeintragFehlt')
      zeilen.push({
        kennzeichen: gruppe.kennzeichen,
        bauteiltyp,
        ort: vorkommen.ort ?? vorkommen.blattName,
        hinweis: gruppe.verwaist ? tp('planlisten.betriebsmittelliste.keinGegenstueck') : '',
      })
    }
  }
  const imPlan = new Set(ermittleBetriebsmittelGruppen(zeichnung).map((g) => g.kennzeichen))
  const fehlend = new Map<string, Set<number>>()
  if (umfang === 'projekt' && zeichnung.verteilerKennzeichen) {
    for (const bauplan of bauplaene) {
      for (const { verteiler } of alleVerteiler(bauplan)) {
        if (verteiler.verteiler?.kennzeichen !== zeichnung.verteilerKennzeichen) continue
        for (const z of ermittleVerteilerZuweisungen(bauplan, verteiler.id)) {
          if (imPlan.has(z.anschluss.kennzeichen)) continue
          const nummern = fehlend.get(z.anschluss.kennzeichen) ?? new Set<number>()
          nummern.add(z.leitung.nummer)
          fehlend.set(z.anschluss.kennzeichen, nummern)
        }
      }
    }
  }
  for (const [kennzeichen, nummern] of fehlend) {
    zeilen.push({
      kennzeichen,
      bauteiltyp: '–',
      ort: '–',
      hinweis: tp('planlisten.betriebsmittelliste.fehltImPlan', {
        leitungen: [...nummern].map(leitungsKennzeichen).join(', '),
      }),
    })
  }

  zeilen.sort(
    (a, b) =>
      a.kennzeichen.localeCompare(b.kennzeichen, undefined, { numeric: true }) ||
      a.ort.localeCompare(b.ort, 'de', { numeric: true }),
  )

  const rohZeilen = zeilen.map((z) => [z.kennzeichen, z.bauteiltyp, z.ort, z.hinweis])
  const anzahlVerwaist = verwaisteSichtbareKennzeichen.size
  const hinweise = [
    anzahlVerwaist === 0
      ? ''
      : tp('planlisten.betriebsmittelliste.verwaist', { n: anzahlVerwaist }),
    fehlend.size === 0
      ? ''
      : tp('planlisten.betriebsmittelliste.fehlenImPlan', { n: fehlend.size }),
  ].filter(Boolean)
  const summenzeile = [
    tp('planlisten.betriebsmittelliste.summe', { n: zeilen.length - fehlend.size }),
    '',
    '',
    hinweise.join(', '),
  ]
  return { zeilen: rohZeilen, summe: summenzeile }
}

export function baueBetriebsmittellistenModell(
  objekt: BetriebsmittellisteObjekt,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  bauplaene: readonly Zeichnung[] = [],
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe } = betriebsmittellistenRohdaten(
    zeichnung,
    katalog,
    blattId,
    objekt.umfang,
    bauplaene,
    tp,
  )
  return layoutTabelle(
    betriebsmittellistenTitel(objekt, tp),
    BETRIEBSMITTELLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function potentiallistenTitel(
  objekt: PotentiallisteObjekt,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.potentialliste.titelZeichnung'
      : 'planlisten.potentialliste.titelBlatt',
  )
}

export const POTENTIALLISTEN_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.potentialliste.spalten.potential', ausrichtung: 'links' },
  { kopf: 'planlisten.potentialliste.spalten.anzahl', ausrichtung: 'rechts' },
  { kopf: 'planlisten.potentialliste.spalten.orte', ausrichtung: 'links' },
  { kopf: 'planlisten.potentialliste.spalten.hinweis', ausrichtung: 'links' },
]

export function potentiallistenRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: PotentiallisteObjekt['umfang'],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  const gruppen = ermittlePotentialGruppen(zeichnung).filter(
    (gruppe) => umfang === 'projekt' || gruppe.vorkommen.some((v) => v.blattId === blattId),
  )
  const zeilen = gruppen.map((gruppe) => {
    const orte = [...new Set(gruppe.vorkommen.map((v) => v.ort ?? v.blattName))].sort((a, b) =>
      a.localeCompare(b, 'de', { numeric: true }),
    )
    return [
      gruppe.name,
      String(gruppe.vorkommen.length),
      orte.join(', '),
      gruppe.verwaist ? tp('planlisten.potentialliste.nurEinVorkommen') : '',
    ]
  })
  const gesamtVorkommen = gruppen.reduce((summe, g) => summe + g.vorkommen.length, 0)
  const anzahlVerwaist = gruppen.filter((g) => g.verwaist).length
  const summenzeile = [
    tp('planlisten.potentialliste.summe', { n: gruppen.length }),
    String(gesamtVorkommen),
    '',
    anzahlVerwaist === 0 ? '' : tp('planlisten.potentialliste.verwaist', { n: anzahlVerwaist }),
  ]
  return { zeilen, summe: summenzeile }
}

export function bauePotentiallistenModell(
  objekt: PotentiallisteObjekt,
  zeichnung: Zeichnung,
  blattId: string,
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe } = potentiallistenRohdaten(zeichnung, blattId, objekt.umfang, tp)
  return layoutTabelle(
    potentiallistenTitel(objekt, tp),
    POTENTIALLISTEN_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function steuerungslogikTitel(
  objekt: SteuerungslogikObjekt,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return uebersetze(
    objekt.umfang === 'projekt'
      ? 'planlisten.steuerungslogik.titelZeichnung'
      : 'planlisten.steuerungslogik.titelBlatt',
  )
}

export const STEUERUNGSLOGIK_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.steuerungslogik.spalten.raum', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.quelle', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.artikelnummer', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.bezeichnung', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.typ', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.slot', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.slotName', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.ziel', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.zielTyp', ausrichtung: 'links' },
  { kopf: 'planlisten.steuerungslogik.spalten.ansteuerung', ausrichtung: 'links' },
]

export const STEUERUNGSLOGIK_SLOT_SPALTENINDEX = 5

function slotReihen(typ: KomponentenTyp, slots: Slot[], slotMatrix: SlotMatrix): (1 | 2)[] {
  if (!typHatSlotMatrix(typ)) return slots.map(() => 1)
  return gruppiereSlotsNachZeile(slots, slotMatrix).map((reihe) => reihe.spalten)
}

export function steuerungslogikRohdaten(
  zeichnung: Zeichnung,
  blattId: string,
  umfang: SteuerungslogikObjekt['umfang'],
  katalog: readonly CatalogComponent[],
  unbelegteAusblenden = false,
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten {
  const nichtBenannt = tp('planlisten.steuerungslogik.nichtBenannt')
  const sprache = spracheDesUebersetzers(tp)
  interface Quelle {
    schluessel: string
    raum: string | null
    bezeichnung: string
    artikelnummer: string
    bezeichnungKatalog: string
    typ: KomponentenTyp
    slots: Slot[]
    reihen: (1 | 2)[]
  }
  const quellen: Quelle[] = []

  const blaetter =
    umfang === 'projekt' ? zeichnung.blaetter : zeichnung.blaetter.filter((b) => b.id === blattId)
  const raumName = (objekte: readonly Objekt[], komponente: KomponentenObjekt) =>
    findeRaumZuPunkt(objekte, komponente.position)?.name.trim() || null

  const gruppenRaeume = new Map<string, Set<string | null>>()
  for (const blatt of blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || !objekt.gruppeId) continue
      const raeume = gruppenRaeume.get(objekt.gruppeId) ?? new Set<string | null>()
      raeume.add(raumName(blatt.objekte, objekt))
      gruppenRaeume.set(objekt.gruppeId, raeume)
    }
  }

  for (const gruppe of zeichnung.geraeteGruppen) {
    if (gruppe.slots.length === 0) continue
    const raeume = gruppenRaeume.get(gruppe.id) ?? (umfang === 'projekt' ? new Set([null]) : null)
    if (!raeume) continue
    const slotMatrix = ableiteSlotMatrix(gruppe.slotMatrix, gruppe.slots)
    for (const raum of raeume) {
      quellen.push({
        schluessel: `gruppe:${gruppe.id}:${raum ?? ''}`,
        raum,
        bezeichnung: gruppe.name?.trim() || nichtBenannt,
        artikelnummer: LEER,
        bezeichnungKatalog: LEER,
        typ: gruppe.typ,
        slots: gruppe.slots,
        reihen: slotReihen(gruppe.typ, gruppe.slots, slotMatrix),
      })
    }
  }
  for (const blatt of blaetter) {
    for (const komponente of blatt.objekte) {
      if (komponente.type !== 'komponente' || komponente.gruppeId) continue
      const aufgeloest = ermittleTypUndSlots(komponente, zeichnung)
      if (!aufgeloest || aufgeloest.slots.length === 0) continue
      const katalogEintrag = katalog.find((k) => k.id === komponente.catalogComponentId)
      const variante = katalogEintrag
        ? aufgeloesteVariante(katalogEintrag, komponente.variantId, sprache)
        : undefined
      quellen.push({
        schluessel: `instanz:${blatt.id}:${komponente.id}`,
        raum: raumName(blatt.objekte, komponente),
        bezeichnung: komponente.beschriftung?.trim() || nichtBenannt,
        artikelnummer: variante?.artikelnummer ?? LEER,
        bezeichnungKatalog: variante?.name ?? tp('planlisten.allgemein.komponente'),
        typ: aufgeloest.typ,
        slots: aufgeloest.slots,
        reihen: slotReihen(aufgeloest.typ, aufgeloest.slots, aufgeloest.slotMatrix),
      })
    }
  }

  const vergleiche = (a: string, b: string) => a.localeCompare(b, 'de', { numeric: true })
  quellen.sort((a, b) => {
    if (a.raum !== b.raum) {
      if (a.raum === null) return 1
      if (b.raum === null) return -1
      const nachRaum = vergleiche(a.raum, b.raum)
      if (nachRaum !== 0) return nachRaum
    }
    return vergleiche(a.bezeichnung, b.bezeichnung) || vergleiche(a.schluessel, b.schluessel)
  })

  const zeilen: string[][] = []
  const grafiken: SlotMatrixGrafik[] = []
  let wirkverbindungen = 0
  for (const quelle of quellen) {
    const quellenKopf = [
      quelle.raum ?? LEER,
      quelle.bezeichnung,
      quelle.artikelnummer,
      quelle.bezeichnungKatalog,
      typBezeichnung(quelle.typ, sprache),
      '',
    ]
    if (unbelegteAusblenden && quelle.slots.every((slot) => slot.ziele.length === 0)) {
      zeilen.push([
        ...quellenKopf,
        LEER,
        tp('planlisten.steuerungslogik.keineWirkverbindung'),
        LEER,
        LEER,
      ])
      grafiken.push({ reihen: quelle.reihen, hervorgehoben: -1 })
      continue
    }
    quelle.slots.forEach((slot, slotIndex) => {
      const kopf = [
        ...quellenKopf,
        slotNameText(slot.bezeichnung, spracheDesUebersetzers(tp)) || LEER,
      ]
      const grafik = { reihen: quelle.reihen, hervorgehoben: slotIndex }
      if (slot.ziele.length === 0) {
        if (unbelegteAusblenden) return
        zeilen.push([...kopf, LEER, LEER, LEER])
        grafiken.push(grafik)
        return
      }
      for (const ziel of slot.ziele) {
        wirkverbindungen++
        const zielTyp = ermittleZielTyp(ziel, zeichnung)
        const ansteuerung = ermittleZielAnsteuerung(ziel, zeichnung)
        zeilen.push([
          ...kopf,
          zielBezeichnung(ziel, zeichnung, katalog, tp),
          zielTyp ? typBezeichnung(zielTyp, sprache) : LEER,
          ansteuerung ? ansteuerungBezeichnung(ansteuerung, sprache) : LEER,
        ])
        grafiken.push(grafik)
      }
    })
  }
  const summe = [
    tp('planlisten.steuerungslogik.summe', { n: wirkverbindungen }),
    ...STEUERUNGSLOGIK_SPALTEN.slice(1).map(() => ''),
  ]

  return {
    zeilen,
    summe,
    slotGrafik: { spalte: STEUERUNGSLOGIK_SLOT_SPALTENINDEX, jeZeile: grafiken },
  }
}

export function baueSteuerungslogikModell(
  objekt: SteuerungslogikObjekt,
  zeichnung: Zeichnung,
  blattId: string,
  katalog: readonly CatalogComponent[],
): TabellenModell {
  const tp = planUebersetzer(zeichnung)
  const { zeilen, summe, slotGrafik } = steuerungslogikRohdaten(
    zeichnung,
    blattId,
    objekt.umfang,
    katalog,
    objekt.unbelegteSlotsAusblenden,
    tp,
  )
  return layoutTabelle(
    steuerungslogikTitel(objekt, tp),
    STEUERUNGSLOGIK_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
    slotGrafik,
  )
}

export interface TabellenKontext {
  zeichnung: Zeichnung
  blattId: string
  katalog: readonly CatalogComponent[]
  bauplaene?: readonly Zeichnung[]
  verteilerplaene?: readonly Zeichnung[]
}

export function baueTabellenModell(
  objekt:
    | StuecklistenObjekt
    | LeitungslisteObjekt
    | SwitchplanObjekt
    | TrunklisteObjekt
    | RaumlisteObjekt
    | BetriebsmittellisteObjekt
    | StromkreisverzeichnisObjekt
    | AktorkanallisteObjekt
    | PotentiallisteObjekt
    | SteuerungslogikObjekt,
  kontext: TabellenKontext,
): TabellenModell {
  switch (objekt.type) {
    case 'stueckliste':
      return baueStuecklistenModell(objekt, kontext.zeichnung, kontext.blattId, kontext.katalog)
    case 'leitungsliste':
      return baueLeitungslistenModell(
        objekt,
        kontext.zeichnung,
        kontext.blattId,
        kontext.katalog,
        kontext.verteilerplaene,
      )
    case 'switchplan':
      return baueSwitchplanModell(objekt, kontext.zeichnung, kontext.katalog)
    case 'trunkliste':
      return baueTrunklistenModell(objekt, kontext.zeichnung, kontext.blattId)
    case 'raumliste':
      return baueRaumlistenModell(objekt, kontext.zeichnung, kontext.blattId)
    case 'betriebsmittelliste':
      return baueBetriebsmittellistenModell(
        objekt,
        kontext.zeichnung,
        kontext.katalog,
        kontext.blattId,
        kontext.bauplaene,
      )
    case 'stromkreisverzeichnis':
      return baueStromkreisverzeichnisModell(objekt, kontext)
    case 'aktorkanalliste':
      return baueAktorkanallistenModell(objekt, kontext)
    case 'potentialliste':
      return bauePotentiallistenModell(objekt, kontext.zeichnung, kontext.blattId)
    case 'steuerungslogik':
      return baueSteuerungslogikModell(objekt, kontext.zeichnung, kontext.blattId, kontext.katalog)
  }
}

export function stromkreisverzeichnisTitel(
  objekt: StromkreisverzeichnisObjekt,
  verteilerKennzeichen: string | null,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return verteilerKennzeichen
    ? uebersetze('planlisten.stromkreisverzeichnis.titelMitVerteiler', {
        verteiler: verteilerKennzeichenText(verteilerKennzeichen),
      })
    : uebersetze('planlisten.stromkreisverzeichnis.titel')
}

export const STROMKREISVERZEICHNIS_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.kennzeichen', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.typ', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.phase', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.rcd', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.stromkreis', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.klemmen', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.leitungen', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.kabeltyp', ausrichtung: 'links' },
  { kopf: 'planlisten.stromkreisverzeichnis.spalten.geraete', ausrichtung: 'links' },
]

export function verteilerQuellen(
  zeichnung: Zeichnung,
  gewuenscht: string | null,
  bauplaene: readonly Zeichnung[],
  verteilerplaene: readonly Zeichnung[],
): {
  kennzeichen: string | null
  verteiler: KomponentenObjekt | null
  plan: Zeichnung | null
  mitLeitungen: { bauplan: Zeichnung; verteiler: KomponentenObjekt }[]
} {
  if (istSchaltplan(zeichnung)) {
    const kennzeichen = gewuenscht ?? zeichnung.verteilerKennzeichen ?? null
    const mitLeitungen = bauplaene.flatMap((bauplan) =>
      alleVerteiler(bauplan)
        .filter((v) => v.verteiler.verteiler?.kennzeichen === kennzeichen)
        .map((v) => ({ bauplan, verteiler: v.verteiler })),
    )
    return {
      kennzeichen,
      verteiler: mitLeitungen[0]?.verteiler ?? null,
      plan: kennzeichen && kennzeichen === zeichnung.verteilerKennzeichen ? zeichnung : null,
      mitLeitungen,
    }
  }
  const alle = alleVerteiler(zeichnung)
  const treffer =
    alle.find((v) => v.verteiler.verteiler?.kennzeichen === gewuenscht) ??
    (gewuenscht === null ? alle[0] : undefined)
  const kennzeichen = treffer?.verteiler.verteiler?.kennzeichen ?? gewuenscht
  return {
    kennzeichen,
    verteiler: treffer?.verteiler ?? null,
    plan: verteilerplaene.find((p) => p.verteilerKennzeichen === kennzeichen) ?? null,
    mitLeitungen: treffer ? [{ bauplan: zeichnung, verteiler: treffer.verteiler }] : [],
  }
}

export function stromkreisverzeichnisRohdaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  gewuenscht: string | null,
  bauplaene: readonly Zeichnung[] = [],
  verteilerplaene: readonly Zeichnung[] = [],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten & { verteilerKennzeichen: string | null } {
  const quellen = verteilerQuellen(zeichnung, gewuenscht, bauplaene, verteilerplaene)
  const verteiler: KomponentenObjekt = quellen.verteiler ?? {
    ...neueObjektBasis(''),
    type: 'komponente',
    position: { x: 0, y: 0 },
    drehung: 0,
    groesseWelt: 0,
    catalogComponentId: '',
    variantId: null,
    verteiler: { kennzeichen: quellen.kennzeichen ?? '', bestueckung: [] },
  }
  const baum = baueVerteilerBaum(verteiler, katalog, quellen.plan)

  interface Anteil {
    leitungen: Map<string, { nummer: number; typ: string | null }>
    geraete: Map<string, { name: string; raum: string | undefined }>
  }
  const anteile = new Map<string, Anteil>()
  const anteil = (kennzeichen: string) => {
    const vorhanden = anteile.get(kennzeichen)
    if (vorhanden) return vorhanden
    const neu: Anteil = { leitungen: new Map(), geraete: new Map() }
    anteile.set(kennzeichen, neu)
    return neu
  }
  for (const { bauplan, verteiler: v } of quellen.mitLeitungen) {
    for (const z of ermittleVerteilerZuweisungen(bauplan, v.id)) {
      const kreis = zuordnungFuer(v, baum, z.anschluss).stromkreis ?? ''
      anteil(kreis).leitungen.set(z.leitung.id, {
        nummer: z.leitung.nummer,
        typ: kabeltypText(z.leitung, bauplan.kabeltypen) ?? null,
      })
    }
    const plaene = quellen.plan ? [quellen.plan] : []
    const zuordnungen = ermittleStromkreisZuordnungen(bauplan, katalog, plaene)
    for (const blatt of bauplan.blaetter) {
      for (const o of blatt.objekte) {
        if (o.type !== 'komponente') continue
        for (const z of zuordnungen.komponenten.get(o.id) ?? []) {
          if (z.verteilerId !== v.id) continue
          const k = katalog.find((x) => x.id === o.catalogComponentId)
          anteil(z.stromkreis ?? '').geraete.set(o.id, {
            name: k
              ? aufgeloesteVariante(k, o.variantId, spracheDesUebersetzers(tp)).name
              : tp('planlisten.allgemein.komponente'),
            raum: findeRaumZuPunkt(blatt.objekte, o.position)?.name,
          })
        }
      }
    }
  }

  const leer = (n: number) => Array.from({ length: n }, () => '')
  const zeile = (
    kennzeichen: string,
    typ: string,
    phase: string,
    rcd: string,
    name: string,
    klemmen: string,
    a: Anteil | undefined,
  ): string[] => {
    const leitungen = [...(a?.leitungen.values() ?? [])]
    const geraete = [...(a?.geraete.values() ?? [])]
    const raeume = [...new Set(geraete.map((g) => g.raum).filter((r): r is string => !!r))]
    return [
      kennzeichen,
      typ,
      phase,
      rcd,
      name || raeume.join(', '),
      klemmen,
      leitungen
        .map((l) => l.nummer)
        .sort((x, y) => x - y)
        .map(leitungsKennzeichen)
        .join(', '),
      [...new Set(leitungen.map((l) => l.typ).filter((t): t is string => !!t))].join(', '),
      geraeteZusammenfassung(geraete.map((g) => g.name)),
    ]
  }

  const stromkreise = new Set(stromkreiseImBaum(baum))
  const zeilen: string[][] = []
  const kreisZeile = (k: VerteilerKnoten) => {
    const weg = ermittleStromweg(k)
    const klemmen = baum.knoten.filter(
      (n) => n.rolle === 'klemme' && ermittleStromweg(n).stromkreis === k,
    )
    const beschriftungen = klemmen.map((n) => n.eintrag.bezeichnung?.trim()).filter(Boolean)
    zeilen.push(
      zeile(
        k.kennzeichen,
        typText(k.geraet),
        weg.phase ?? '',
        weg.rcd?.kennzeichen ?? '',
        k.eintrag.bezeichnung?.trim() || beschriftungen.join(', '),
        klemmen.map((n) => n.schluessel).join(', '),
        anteile.get(k.kennzeichen),
      ),
    )
    anteile.delete(k.kennzeichen)
  }
  for (const k of baum.knoten) {
    if (stromkreise.has(k)) kreisZeile(k)
    else if (istKopf(k, stromkreise)) {
      const weg = ermittleStromweg(k)
      zeilen.push([
        k.kennzeichen,
        typText(k.geraet),
        k.eintrag.phase ?? '',
        weg.rcd && weg.rcd !== k ? weg.rcd.kennzeichen : '',
        k.eintrag.bezeichnung?.trim() ||
          (k.rolle === 'rcd'
            ? 'RCD'
            : k.rolle === 'schutz'
              ? tp('planlisten.stromkreisverzeichnis.vorsicherung')
              : ''),
        ...leer(4),
      ])
    }
  }
  for (const b of baum.nichtEingeordnet) {
    if (b.buchstabe !== 'F' || b.istFehlerstromSchutz) continue
    zeilen.push(
      zeile(
        b.kennzeichen,
        typText(b),
        b.phase ?? '',
        '',
        b.bezeichnung ?? '',
        '',
        anteile.get(b.kennzeichen),
      ),
    )
    anteile.delete(b.kennzeichen)
  }
  for (const [kennzeichen, a] of anteile) {
    if (a.leitungen.size === 0) continue
    const bekannt = baum.betriebsmittel.some((x) => x.kennzeichen === kennzeichen)
    const text = !kennzeichen
      ? '–'
      : bekannt
        ? kennzeichen
        : tp('planlisten.allgemein.fehlt', { kennzeichen })
    const name = kennzeichen ? '' : tp('planlisten.stromkreisverzeichnis.ohneSchutzorgan')
    zeilen.push(zeile(text, '', '', '', name, '', a))
  }
  const anzahl = stromkreise.size
  return {
    zeilen,
    summe: [
      tp('planlisten.stromkreisverzeichnis.summe', { n: anzahl }),
      ...leer(STROMKREISVERZEICHNIS_SPALTEN.length - 1),
    ],
    verteilerKennzeichen: quellen.kennzeichen,
  }
}

export function baueStromkreisverzeichnisModell(
  objekt: StromkreisverzeichnisObjekt,
  kontext: TabellenKontext,
): TabellenModell {
  const tp = planUebersetzer(kontext.zeichnung)
  const { zeilen, summe, verteilerKennzeichen } = stromkreisverzeichnisRohdaten(
    kontext.zeichnung,
    kontext.katalog,
    objekt.verteiler,
    kontext.bauplaene,
    kontext.verteilerplaene,
    tp,
  )
  return layoutTabelle(
    stromkreisverzeichnisTitel(objekt, verteilerKennzeichen, tp),
    STROMKREISVERZEICHNIS_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}

export function aktorkanallistenTitel(
  objekt: AktorkanallisteObjekt,
  verteilerKennzeichen: string | null,
  uebersetze: Uebersetzer = t,
): string {
  if (objekt.titel !== null && objekt.titel.trim()) return objekt.titel
  return verteilerKennzeichen
    ? uebersetze('planlisten.aktorkanalliste.titelMitVerteiler', {
        verteiler: verteilerKennzeichenText(verteilerKennzeichen),
      })
    : uebersetze('planlisten.aktorkanalliste.titel')
}

export const AKTORKANALLISTE_SPALTEN: Spaltendefinition[] = [
  { kopf: 'planlisten.aktorkanalliste.spalten.geraet', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.kanal', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.funktion', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.beschriftung', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.raum', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.verbraucher', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.stromkreis', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.klemme', ausrichtung: 'links' },
  { kopf: 'planlisten.aktorkanalliste.spalten.ausgeloestDurch', ausrichtung: 'links' },
]

export function aktorkanallisteRohdaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  gewuenscht: string | null,
  bauplaene: readonly Zeichnung[] = [],
  verteilerplaene: readonly Zeichnung[] = [],
  tp: Uebersetzer = planUebersetzer(zeichnung),
): TabellenRohdaten & { verteilerKennzeichen: string | null } {
  const quellen = verteilerQuellen(zeichnung, gewuenscht, bauplaene, verteilerplaene)
  const plan = istSchaltplan(zeichnung) ? zeichnung : quellen.plan
  const baum = quellen.verteiler
    ? baueVerteilerBaum(quellen.verteiler, katalog, quellen.plan)
    : null

  const geraete: { kennzeichen: string; daten: KnxAktorDaten }[] = []
  if (plan) {
    for (const blatt of plan.blaetter)
      for (const o of blatt.objekte) {
        const kz = o.type === 'komponente' ? o.geraeteKennzeichen?.trim() : undefined
        if (o.type !== 'komponente' || !o.knxAktor || !kz) continue
        if (!geraete.some((g) => g.kennzeichen === kz))
          geraete.push({ kennzeichen: kz, daten: o.knxAktor })
      }
  } else {
    for (const g of baum?.kanalGeraete ?? [])
      if (g.geraet.knxAktor)
        geraete.push({ kennzeichen: g.geraet.kennzeichen, daten: g.geraet.knxAktor })
  }
  geraete.sort((a, b) => vergleicheKennzeichen(a.kennzeichen, b.kennzeichen))

  interface AmKanal {
    namen: string[]
    raeume: Set<string>
    ausloeser: Set<string>
  }
  const amKanal = new Map<string, AmKanal>()
  for (const { bauplan, verteiler: v } of quellen.mitLeitungen) {
    const zuordnungen = ermittleStromkreisZuordnungen(
      bauplan,
      katalog,
      quellen.plan ? [quellen.plan] : [],
    ).komponentenUnverdichtet
    const ziele = ermittleKnxZiele(bauplan, katalog, tp)
    for (const blatt of bauplan.blaetter) {
      for (const o of blatt.objekte) {
        if (o.type !== 'komponente') continue
        const typ = ermittleTypUndSlots(o, bauplan)?.typ
        if (typ !== 'verbraucher' && typ !== 'anschlussdose') continue
        for (const kanal of new Set(
          (zuordnungen.get(o.id) ?? [])
            .filter((z) => z.verteilerId === v.id && z.kanal)
            .map((z) => z.kanal!),
        )) {
          const eintrag = amKanal.get(kanal) ?? {
            namen: [],
            raeume: new Set(),
            ausloeser: new Set(),
          }
          const k = katalog.find((x) => x.id === o.catalogComponentId)
          eintrag.namen.push(
            k
              ? aufgeloesteVariante(k, o.variantId, spracheDesUebersetzers(tp)).name
              : tp('planlisten.allgemein.komponente'),
          )
          const raum = findeRaumZuPunkt(blatt.objekte, o.position)?.name?.trim()
          if (raum) eintrag.raeume.add(raum)
          for (const a of ziele.get(`${blatt.id}#${o.id}`)?.ausloeser ?? [])
            eintrag.ausloeser.add(`${a.name} · ${a.slot}`)
          amKanal.set(kanal, eintrag)
        }
      }
    }
  }

  const zeilen: string[][] = []
  let belegt = 0
  let frei = 0
  for (const g of geraete) {
    zeilen.push([`-${g.kennzeichen}`, knxAktorTitel(g.daten, tp), '', '', '', '', '', '', ''])
    const planAktor = plan?.blaetter
      .flatMap((b) => b.objekte)
      .find(
        (o): o is KomponentenObjekt =>
          o.type === 'komponente' && !!o.knxAktor && o.geraeteKennzeichen?.trim() === g.kennzeichen,
      )
    for (let i = 0; i < g.daten.kanaele.length; i++) {
      const beginn = knxPaarBeginn(g.daten, i)
      if (beginn !== null && beginn !== i) continue
      const paar = beginn === i
      const kanalText = paar ? `${knxKanalName(i)}/${knxKanalName(i + 1)}` : knxKanalName(i)
      const schluessel = `${g.kennzeichen}:${knxKanalName(i)}`
      const knoten = baum?.knoten.find((k) => k.schluessel === schluessel) ?? null
      const funktion = knxKanalFunktionsText(g.daten, i, tp).funktion
      if (!knoten && g.daten.kanaele[i].funktion === 'frei') {
        zeilen.push(['', kanalText, tp('planlisten.aktorkanalliste.frei'), '', '', '', '', '', ''])
        frei += paar ? 2 : 1
        continue
      }
      belegt += paar ? 2 : 1
      const weg = knoten ? ermittleStromweg(knoten) : null
      const klemmen = knoten
        ? baum!.knoten
            .filter(
              (n) => n.rolle === 'klemme' && ermittleStromweg(n).kontakte.some((c) => c === knoten),
            )
            .map((n) => n.schluessel)
        : []
      const am = amKanal.get(schluessel)
      const beschriftung =
        planAktor?.knxAktor?.kanaele[i]?.beschriftung?.trim() ||
        knoten?.eintrag.bezeichnung?.trim() ||
        ''
      const stromkreis = weg?.stromkreis
        ? [
            quellen.kennzeichen
              ? `${quellen.kennzeichen}-${weg.stromkreis.kennzeichen}`
              : weg.stromkreis.kennzeichen,
            weg.rcd ? `RCD ${weg.rcd.kennzeichen}` : null,
            weg.phase,
          ]
            .filter(Boolean)
            .join(' · ')
        : ''
      zeilen.push([
        '',
        kanalText,
        funktion,
        beschriftung,
        [...(am?.raeume ?? [])].join(', '),
        geraeteZusammenfassung(am?.namen ?? []),
        stromkreis,
        klemmen.join(', '),
        [...(am?.ausloeser ?? [])].join(', '),
      ])
    }
  }
  return {
    zeilen,
    summe: [
      tp('planlisten.aktorkanalliste.summe', { n: geraete.length }),
      '',
      tp('planlisten.aktorkanalliste.belegt', { n: belegt }),
      tp('planlisten.aktorkanalliste.freiAnzahl', { n: frei }),
      '',
      '',
      '',
      '',
      '',
    ],
    verteilerKennzeichen: quellen.kennzeichen,
  }
}

export function baueAktorkanallistenModell(
  objekt: AktorkanallisteObjekt,
  kontext: TabellenKontext,
): TabellenModell {
  const tp = planUebersetzer(kontext.zeichnung)
  const { zeilen, summe, verteilerKennzeichen } = aktorkanallisteRohdaten(
    kontext.zeichnung,
    kontext.katalog,
    objekt.verteiler,
    kontext.bauplaene,
    kontext.verteilerplaene,
    tp,
  )
  return layoutTabelle(
    aktorkanallistenTitel(objekt, verteilerKennzeichen, tp),
    AKTORKANALLISTE_SPALTEN,
    zeilen,
    summe,
    objekt.textHoehe,
    tp,
  )
}
