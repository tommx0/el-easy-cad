import { erzeugeId } from './id'
import type { Ansteuerung, KomponentenTyp, SlotMatrix, SlotVorlage } from './geraetegruppe'
import type { KnxAktorArt } from './knx-aktor'
import type { SymbolFarbe } from './symbol-palette'
import {
  komponentenText,
  variantenText,
  type KatalogUebersetzung,
  type KomponentenUebersetzung,
  type Uebersetzungen,
} from './katalog-uebersetzung'
import { QUELLSPRACHE, type Sprache } from '../sprache'

export type KatalogBild = { typ: 'asset'; assetId: string }

export type KomponentenDarstellung = 'bild' | 'symbol'

export type KomponentenHerkunft = 'standard' | 'benutzer'

export interface PortGruppe {
  typ: string
  anzahl: number
  reihen?: number
}

export interface TrunkDockpunkt {
  xAnteil: number
}

export interface FreierDockpunkt {
  xAnteil: number
  yAnteil: number
  trunk?: boolean
  bezeichnung?: string
  beschriftung?: DockpunktBeschriftung
}

export interface DockpunktBeschriftung {
  xAnteil?: number
  yAnteil?: number
  groesseAnteil: number
  ausrichtungHorizontal: HorizontaleAusrichtung
  ausrichtungVertikal: VertikaleAusrichtung
  bildschirmVersatz?: TextElementBildschirmVersatz
  beiDrehung?: TextElementBeiDrehung
  ausblenden?: boolean
  farbe?: SymbolFarbe
}

export interface Fangpunkt {
  xAnteil: number
  yAnteil: number
}

export type DockpunkteKonfiguration =
  | {
      modus: 'ports'
      gruppen: PortGruppe[]
      trunkPunkte?: TrunkDockpunkt[]
    }
  | {
      modus: 'frei'
      punkte: FreierDockpunkt[]
    }

export type PortsDockpunkteKonfiguration = Extract<DockpunkteKonfiguration, { modus: 'ports' }>

export type HorizontaleAusrichtung = 'links' | 'mittig' | 'rechts'
export type VertikaleAusrichtung = 'oben' | 'mittig' | 'unten'

export interface KatalogTextElement {
  xAnteil: number
  yAnteil: number
  text: string
  groesseAnteil: number
  ausrichtungHorizontal: HorizontaleAusrichtung
  ausrichtungVertikal: VertikaleAusrichtung
  beiDrehung?: TextElementBeiDrehung
  bildschirmVersatz?: TextElementBildschirmVersatz
  variable?: string
  inStueckliste?: boolean
  fixiert?: boolean
  drehung?: TextElementDrehung
  farbe?: SymbolFarbe
}

export type TextElementDrehung = 90 | 180 | 270
export const TEXT_ELEMENT_DREHUNGEN: readonly TextElementDrehung[] = [90, 180, 270]

export interface TextElementBildschirmVersatz {
  x: number
  y: number
}

export interface TextElementBeiDrehung {
  bezugXAnteil: number
  bezugYAnteil: number
  versatzX: number
  versatzY: number
  ausrichtungHorizontal: HorizontaleAusrichtung
  ausrichtungVertikal: VertikaleAusrichtung
}

export interface Bemessungswerte {
  nennstrom?: number
  nennspannung?: number
  polzahl?: number
  ipSchutzart?: string
}

export const BEMESSUNG_FELDER = ['nennstrom', 'nennspannung', 'polzahl', 'ipSchutzart'] as const

export function bereinigteBemessung(b: Bemessungswerte | undefined): Bemessungswerte | undefined {
  if (!b) return undefined
  const ergebnis: Bemessungswerte = {}
  if (b.nennstrom !== undefined) ergebnis.nennstrom = b.nennstrom
  if (b.nennspannung !== undefined) ergebnis.nennspannung = b.nennspannung
  if (b.polzahl !== undefined) ergebnis.polzahl = b.polzahl
  const ip = b.ipSchutzart?.trim()
  if (ip) ergebnis.ipSchutzart = ip
  return Object.keys(ergebnis).length > 0 ? ergebnis : undefined
}

export const IP_SCHUTZART_MUSTER = /^IP[0-6X][0-9X][A-DHMSW]*$/

export interface Variant {
  id: string
  farbe?: string
  name?: string
  artikelnummer?: string
  bild?: KatalogBild
  symbol?: KatalogBild
  symbolFarbig?: boolean
  technischeDaten?: Record<string, string>
  bemessung?: Bemessungswerte
}

export interface ModulTraegerKonfiguration {
  modulSystem: string
  spalten: number
  zeilen: number
}

export const KATALOG_EIGENE_ID = 'eigene'

export interface Katalog {
  id: string
  name: string
  beschreibung?: string
  uebersetzungen?: Uebersetzungen<KatalogUebersetzung>
  hersteller?: string
  herkunft: KomponentenHerkunft
  aktiv: boolean
  sortierung?: number
  seedVersion?: number
  ausgemustert?: boolean
}

export function sichtbareKataloge(kataloge: readonly Katalog[]): Katalog[] {
  return kataloge.filter((k) => !k.ausgemustert)
}

export function sichtbareKomponenten(
  komponenten: readonly CatalogComponent[],
  kataloge: readonly Katalog[],
): CatalogComponent[] {
  const zurueckgezogen = new Set(kataloge.filter((k) => k.ausgemustert).map((k) => k.id))
  return komponenten.filter((k) => !k.ausgemustert && !zurueckgezogen.has(k.katalogId))
}

export function neuerKatalog(angaben: Partial<Katalog> & Pick<Katalog, 'name'>): Katalog {
  return {
    id: erzeugeId('katalog-register'),
    herkunft: 'benutzer',
    aktiv: true,
    ...angaben,
  }
}

export type Montageort = 'decke' | 'wand' | 'boden'

export interface CatalogComponent {
  id: string
  katalogId: string
  name: string
  uebersetzungen?: Uebersetzungen<KomponentenUebersetzung>
  bild?: KatalogBild
  symbol?: KatalogBild
  symbolFarbig?: boolean
  hersteller?: string
  artikelnummer?: string
  wattzahl?: number
  poeLeistungWatt?: number
  bemessung?: Bemessungswerte
  kategorie?: string
  typ?: KomponentenTyp
  slotVorlagen?: SlotVorlage[]
  slotMatrixVorlage?: SlotMatrix
  slotAnzahlAus?: string
  ansteuerung?: Ansteuerung
  stromkreisVorgabe?: 'kein' | 'raum' | 'eigen'
  stromkreisPolzahl?: 1 | 3
  ifcKlasse?: string
  ifcTyp?: string
  ifcTypName?: string
  hauptgruppe?: string
  untergruppe?: string
  dockpunkte?: DockpunkteKonfiguration
  fangpunkt?: Fangpunkt
  textElemente?: KatalogTextElement[]
  breitenFaktor?: number
  hoehenFaktor?: number
  kombinierbar?: boolean
  montageort?: Montageort
  bauart?: 'patchpanel' | 'verteiler'
  knxAktor?: KnxAktorArt
  modulTraeger?: ModulTraegerKonfiguration
  modulSystem?: string
  kennzeichenBuchstabe?: string
  betriebsmittelRolle?: 'spule' | 'kontaktblock'
  seedVersion?: number
  ausgemustert?: boolean
  abgeleitetVon?: { id: string; seedVersion?: number }
  technischeDaten: Record<string, string>
  herkunft: KomponentenHerkunft
  varianten: Variant[]
}

export interface AufgeloesteVariante {
  name: string
  farbe: string | null
  artikelnummer: string | null
  bild: KatalogBild | null
  symbol: KatalogBild | null
  symbolFarbig: boolean
  technischeDaten: Record<string, string>
  bemessung: Bemessungswerte
  ueberschrieben: {
    name: boolean
    farbe: boolean
    artikelnummer: boolean
    bild: boolean
    symbol: boolean
    technischeDaten: boolean
  }
}

export function neueCatalogComponent(
  angaben: Partial<CatalogComponent> & Pick<CatalogComponent, 'name'>,
): CatalogComponent {
  return {
    id: erzeugeId('katalog'),
    katalogId: KATALOG_EIGENE_ID,
    technischeDaten: {},
    herkunft: 'benutzer',
    varianten: [],
    ...angaben,
  }
}

export function neueVariante(angaben?: Partial<Variant>): Variant {
  return { id: erzeugeId('variante'), ...angaben }
}

export function niedrigsteArtikelnummerVariante(component: CatalogComponent): Variant | null {
  if (component.varianten.length === 0) return null
  let beste = component.varianten[0]
  let besteArtikelnummer = aufgeloesteVariante(component, beste.id).artikelnummer ?? ''
  for (const variante of component.varianten.slice(1)) {
    const artikelnummer = aufgeloesteVariante(component, variante.id).artikelnummer ?? ''
    if (artikelnummer.localeCompare(besteArtikelnummer, undefined, { numeric: true }) < 0) {
      beste = variante
      besteArtikelnummer = artikelnummer
    }
  }
  return beste
}

export function aufgeloesteVariante(
  component: CatalogComponent,
  variantId: string | null,
  sprache: Sprache = QUELLSPRACHE,
): AufgeloesteVariante {
  const variante = variantId ? component.varianten.find((v) => v.id === variantId) : undefined
  const technischeDatenUeberschrieben = Boolean(
    variante?.technischeDaten && Object.keys(variante.technischeDaten).length > 0,
  )
  return {
    name:
      variante?.name !== undefined
        ? variantenText(component, variante, 'name', sprache)
        : komponentenText(component, 'name', sprache),
    farbe:
      variante?.farbe !== undefined ? variantenText(component, variante, 'farbe', sprache) : null,
    artikelnummer: variante?.artikelnummer ?? component.artikelnummer ?? null,
    bild: variante?.bild ?? component.bild ?? null,
    symbol: variante?.symbol ?? component.symbol ?? null,
    symbolFarbig: variante?.symbol
      ? variante.symbolFarbig === true
      : component.symbolFarbig === true,
    technischeDaten: technischeDatenUeberschrieben
      ? { ...component.technischeDaten, ...variante!.technischeDaten }
      : component.technischeDaten,
    bemessung: { ...component.bemessung, ...variante?.bemessung },
    ueberschrieben: {
      name: variante?.name !== undefined,
      farbe: variante?.farbe !== undefined,
      artikelnummer: variante?.artikelnummer !== undefined,
      bild: variante?.bild !== undefined,
      symbol: variante?.symbol !== undefined,
      technischeDaten: technischeDatenUeberschrieben,
    },
  }
}

export function waehleKomponentenGrafik(
  grafiken: { bild?: KatalogBild | null; symbol?: KatalogBild | null },
  darstellung: KomponentenDarstellung,
): { grafik: KatalogBild; art: KomponentenDarstellung } | null {
  const bevorzugt = darstellung === 'symbol' ? grafiken.symbol : grafiken.bild
  if (bevorzugt) return { grafik: bevorzugt, art: darstellung }
  const ersatz = darstellung === 'symbol' ? grafiken.bild : grafiken.symbol
  if (ersatz) return { grafik: ersatz, art: darstellung === 'symbol' ? 'bild' : 'symbol' }
  return null
}

export function dupliziereCatalogComponent(
  component: CatalogComponent,
  neuerName?: string,
  zielKatalogId: string = KATALOG_EIGENE_ID,
): CatalogComponent {
  const { seedVersion: _seedVersion, ausgemustert: _ausgemustert, ...rest } = component
  return {
    ...rest,
    id: erzeugeId('katalog'),
    katalogId: zielKatalogId,
    name: neuerName ?? `${component.name} (Kopie)`,
    herkunft: 'benutzer',
    abgeleitetVon:
      component.herkunft === 'standard'
        ? { id: component.id, seedVersion: component.seedVersion }
        : component.abgeleitetVon,
    varianten: component.varianten.map((v) => ({ ...v, id: erzeugeId('variante') })),
  }
}
