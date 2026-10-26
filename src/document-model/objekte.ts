import type { BoundingBox, Point } from './geometry'
import type {
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenDarstellung,
  ModulTraegerKonfiguration,
  Montageort,
} from './catalog'
import { boundingBoxFromPoints, expandBoundingBox, rotatePoint, unionBoundingBox } from './geometry'
import { erzeugeId } from './id'
import { ALTER_KOMBINATION_FAKTOR } from './kombinations-faktor'
import type { Ansteuerung, KomponentenTyp, Slot, SlotMatrix, SlotZiel } from './geraetegruppe'
import type { KnxAktorDaten } from './knx-aktor'
import type { Installationszone } from './blatt'
import type { TeilstueckZone } from './teilstueck-zonen'
import type { ZonenVerlegung } from './installationszonen'
import { bemassungsreiheBoundingBox } from './bemassungsreihe'
import { t } from '../sprache'
import type { Schluessel, Uebersetzer } from '../sprache'

export interface ObjektBasis {
  id: string
  ebeneId: string
  farbe: string
  strichstaerke: number
  linientyp: Linientyp
  ausHintergrund?: 'dxf' | 'ifc' | 'pdf'
  ausBauteil?: string
  ifcGuid?: string
  ifcStand?: string
  modulDaten?: Record<string, unknown>
}

export type Linientyp = 'standard' | 'gestrichelt' | 'gepunktet' | 'strichpunkt'

export const STANDARD_FARBE = '#1a1a1a'

export function hatStandardFarbe(farbe: string): boolean {
  return farbe.trim().toLowerCase() === STANDARD_FARBE
}
export const STANDARD_STRICHSTAERKE = 1.5
export const STANDARD_LINIENTYP: Linientyp = 'standard'
export const POTENTIAL_SYMBOL_GROESSE = 0.25

export type SchraffurMuster = 'diagonal' | 'kreuz' | 'horizontal' | 'vertikal'

export interface Fuellung {
  art: 'farbe' | 'schraffur'
  farbe: string
  muster?: SchraffurMuster
  abstand?: number
  deckkraft: number
}

export const STANDARD_FUELL_FARBE = '#c8d8ee'
export const STANDARD_FUELL_DECKKRAFT = 0.5
export const STANDARD_SCHRAFFUR_MUSTER: SchraffurMuster = 'diagonal'
export const STANDARD_SCHRAFFUR_ABSTAND_M = 0.1

export interface LinienObjekt extends ObjektBasis {
  type: 'linie'
  start: Point
  ende: Point
}

export interface PolylinienObjekt extends ObjektBasis {
  type: 'polylinie'
  punkte: Point[]
  geschlossen: boolean
  fuellung: Fuellung | null
}

export interface RechteckObjekt extends ObjektBasis {
  type: 'rechteck'
  ursprung: Point
  breite: number
  hoehe: number
  drehung: number
  fuellung: Fuellung | null
}

export interface KreisObjekt extends ObjektBasis {
  type: 'kreis'
  mittelpunkt: Point
  radius: number
  fuellung: Fuellung | null
}

export interface BogenObjekt extends ObjektBasis {
  type: 'bogen'
  mittelpunkt: Point
  radius: number
  startWinkel: number
  endWinkel: number
}

export interface EllipseObjekt extends ObjektBasis {
  type: 'ellipse'
  mittelpunkt: Point
  radiusX: number
  radiusY: number
  drehung: number
  fuellung: Fuellung | null
}

export interface PolygonObjekt extends ObjektBasis {
  type: 'polygon'
  mittelpunkt: Point
  radius: number
  seitenAnzahl: number
  drehung: number
  fuellung: Fuellung | null
}

export interface PunktObjekt extends ObjektBasis {
  type: 'punkt'
}
export interface PunktObjektMitPosition extends PunktObjekt {
  position: Point
}

export interface TextObjekt extends ObjektBasis {
  type: 'text'
  position: Point
  inhalt: string
  hoehe: number
  drehung: number
}

export interface BemassungObjekt extends ObjektBasis {
  type: 'bemassung'
  start: Point
  ende: Point
  versatz: number
  textOverride: string | null
}

export interface BemassungsreiheObjekt extends ObjektBasis {
  type: 'bemassungsreihe'
  art: 'kette' | 'parallel'
  punkte: Point[]
  winkel: number
  versatz: number
  gesamtmass: boolean
  staffelabstand: number
}

export interface SchraffurObjekt extends ObjektBasis {
  type: 'schraffur'
  kontur: Point[]
  muster: SchraffurMuster
  abstand: number
}

export interface KomponentenWandstelle {
  id: string
  wandId: string | null
  t: number | null
  seite: 1 | -1
  punkt: Point
  richtung: number
}

export interface KomponentenKombination {
  nr: number
  platz: number
  hoeheCm: number
  reihenStart: number
  reihenEnde?: boolean
  drehungSchritte?: number
  drehungEinzeln?: number
}

export interface KomponentenObjekt extends ObjektBasis {
  type: 'komponente'
  position: Point
  drehung: number
  groesseWelt: number
  catalogComponentId: string
  variantId: string | null
  dockpunkte?: DockpunkteKonfiguration
  fangpunkt?: Fangpunkt
  textElemente?: KatalogTextElement[]
  breiteWelt?: number
  hoehenFaktor?: number
  modulTraeger?: ModulTraegerKonfiguration
  kombinierbar?: boolean
  modulSystem?: string
  traegerId?: string
  slotIndex?: number
  beschriftung?: string
  portBeschriftungen?: Record<string, string>
  beschriftungSichtbar?: boolean
  bezeichnungSichtbar?: boolean
  textGroessenFaktor?: number
  symbolGroessenFaktor?: number
  beschriftungsposition?: 'rechts' | 'links' | 'oben' | 'unten'
  beschriftungVersatz?: Point | null
  installationshoehe?: number
  installationshoeheSichtbar?: boolean
  montageort?: Montageort
  verlegung?: Extract<ZonenVerlegung, 'in'>
  wandstelle?: KomponentenWandstelle
  kombination?: KomponentenKombination
  kombinationsFaktor?: number
  darstellung?: KomponentenDarstellung
  gruppeId?: string
  typ?: KomponentenTyp
  slots?: Slot[]
  slotMatrix?: SlotMatrix
  slotAnzahlAus?: string
  ansteuerung?: Ansteuerung
  knx?: boolean
  stromkreis?: StromkreisWert
  stromkreisPolzahl?: StromkreisPolzahl
  geraeteKennzeichen?: string
  klemmenNummer?: string
  betriebsmittelRolle?: 'spule' | 'kontaktblock'
  kennzeichenSichtbar?: boolean
  stromkreisSichtbar?: boolean
  abgangstext?: AbgangstextAnpassung
  verteiler?: VerteilerDaten
  knxAktor?: KnxAktorDaten
}

export interface AbgangstextAnpassung {
  versatz?: Point
  hoehe?: number
  breite?: number
  ausrichtung?: 'senkrecht' | 'links'
  text?: string
}

export interface VerteilerDaten {
  kennzeichen: string
  bestueckung: BestueckungsEintrag[]
  raeume?: RaumAuswahl[]
  netz?: 'drehstrom' | 'wechselstrom'
  art?: 'HV' | 'UV'
}

export interface RaumAuswahl {
  blattId: string
  raumId?: string
}

export type StromkreisWert = 'kein' | 'raum' | 'eigen' | number

export type StromkreisPolzahl = 1 | 3

export type StromkreisQuelle =
  | { art: 'blatt'; blattId: string }
  | { art: 'raum'; blattId: string; raumId?: string; nummer?: number }
  | { art: 'eigen'; blattId: string; objektId: string }
  | { art: 'knx'; ziel: SlotZiel }

export type Phase = 'L1' | 'L2' | 'L3'

export interface BestueckungsEintrag {
  id: string
  catalogComponentId: string
  kennzeichen: string
  kanal?: string
  mitKanaelen?: boolean
  variablen?: Record<string, string>
  phase?: Phase
  elternId?: string
  bezeichnung?: string
  knxAktor?: KnxAktorDaten
  quelle?: StromkreisQuelle
}

export interface LeitungsDockRef {
  art: 'dock'
  objektId: string
  dockpunktIndex: number
}

export interface LeitungsFreiesEnde {
  art: 'frei'
}

export interface LeitungsSchachtRef {
  art: 'schacht'
  objektId: string
  strang: number
}

export interface LeitungsSwitchPort {
  art: 'switchport'
  blattId: string
  objektId: string
  portIndex: number
}

export type LeitungsEndpunkt = LeitungsDockRef | LeitungsFreiesEnde | LeitungsSchachtRef

export type LeitungsZiel = LeitungsEndpunkt | LeitungsSwitchPort | LeitungsVerteilerEnde

export interface LeitungsVerteilerEnde {
  art: 'verteiler'
  blattId: string
  objektId: string
}

export function istBuendelEnde(
  ende: LeitungsZiel,
): ende is LeitungsSwitchPort | LeitungsVerteilerEnde {
  return ende.art === 'switchport' || ende.art === 'verteiler'
}

export interface LeitungsVerteilerAnschluss {
  ende: 'start' | 'ziel'
  kennzeichen: string
  anschluss?: string
  ader?: string
}

export interface TrunkDurchgang {
  trunkId: string
  eintrittT: number
  austrittT: number
  eintrittVersatz?: Point | null
  austrittVersatz?: Point | null
}

export interface TrunkDockRef {
  objektId: string
  dockpunktIndex: number
}

export interface TrunkEnde {
  verbundenesEnde?: {
    blattId: string
    trunkId: string
    endeIndex: 0 | 1
  }
  verbundenerPfad?: {
    blattId: string
    trunkId: string
    t: number
  }
  dockRef?: TrunkDockRef
  schachtRef?: { objektId: string; strang: number }
  beschriftungVersatz?: Point | null
}

export interface TrunkObjekt extends ObjektBasis {
  type: 'trunk'
  name: string
  wegpunkte: Point[]
  enden: [TrunkEnde, TrunkEnde]
  bezeichnungSichtbar?: boolean
  beschreibung?: string
  beschreibungSichtbar?: boolean
  ausfuehrung?: TrunkAusfuehrung
  abmessung?: TrunkAbmessung
  installationszone?: Installationszone
}

export type TrunkAusfuehrung = 'buendel' | 'kanal' | 'trasse' | 'rohr'

export type TrunkAbmessung = { breite: number; hoehe: number } | { durchmesser: number }

export interface LeitungsObjekt extends ObjektBasis {
  type: 'leitung'
  pfadSegmente: Point[][]
  start: LeitungsZiel
  ziel: LeitungsZiel
  trunkDurchgaenge: TrunkDurchgang[]
  nummer: number
  bezeichnungSichtbar?: boolean
  nummerVersatz?: Point | null
  beschreibung?: string
  beschreibungSichtbar?: boolean
  kabeltypId?: string
  typ?: string
  typSichtbar?: boolean
  autoRoutingAus?: boolean
  anordnung?: AnordnungsRegeln
  installationszone?: Installationszone
  teilstueckZonen?: TeilstueckZone[]
  nurInBauteilen?: boolean
  verteilerAnschluesse?: LeitungsVerteilerAnschluss[]
}

export interface AnordnungsRegeln {
  gruppe: string
  bahnabstand: number
  kreuzFaktor: number
  rechtwinklig: boolean
  kamm: boolean
  richtung: 'oben-unten' | 'links-rechts'
}

export interface SchaltverbindungDockRef {
  art: 'dock'
  objektId: string
  dockpunktIndizes: number[]
}

export interface SchaltverbindungFreiesEnde {
  art: 'frei'
}

export interface SchaltverbindungPotentialRef {
  art: 'potential'
  objektId: string
}

export interface SchaltverbindungAbzweigRef {
  art: 'schaltverbindung'
  objektId: string
}

export interface SchaltverbindungKnotenRef {
  art: 'knoten'
  objektId: string
}

export type SchaltverbindungAnschluss =
  | SchaltverbindungDockRef
  | SchaltverbindungFreiesEnde
  | SchaltverbindungPotentialRef
  | SchaltverbindungAbzweigRef
  | SchaltverbindungKnotenRef

export interface SchaltverbindungObjekt extends ObjektBasis {
  type: 'schaltverbindung'
  wegpunkte: Point[]
  start: SchaltverbindungAnschluss
  ziel: SchaltverbindungAnschluss
  polzahl: 1 | 2 | 3 | 4 | 5
  bezeichnung?: string
  beschreibung?: string
  autoRouting?: boolean
  anordnung?: AnordnungsRegeln
  bezeichnungSichtbar?: boolean
  bezeichnungNurAmAnfang?: boolean
  blattverweis?: boolean
  unterbrechung?: 'quelle' | 'ziel'
  zweiteFarbe?: string
}

export interface KabelschachtObjekt extends ObjektBasis {
  type: 'kabelschacht'
  verbundId: string
  name: string
  ursprung: Point
  breite: number
  hoehe: number
  drehung: number
  geschosshoehe: number
  strangNamen?: Record<string, string>
}

export const STANDARD_SCHACHT_BREITE = 0.6
export const STANDARD_SCHACHT_HOEHE = 0.4
export const STANDARD_GESCHOSSHOEHE = 3

export interface StuecklistenObjekt extends ObjektBasis {
  type: 'stueckliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
}

export interface LeitungslisteObjekt extends ObjektBasis {
  type: 'leitungsliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
  stromkreisSpalte?: boolean
}

export interface SwitchplanObjekt extends ObjektBasis {
  type: 'switchplan'
  position: Point
  switchBlattId: string | null
  switchObjektId: string | null
  titel: string | null
  textHoehe: number
  planArt?: 'switch' | 'patchpanel'
}

export interface TrunklisteObjekt extends ObjektBasis {
  type: 'trunkliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
}

export interface RaumlisteObjekt extends ObjektBasis {
  type: 'raumliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
}

export interface BetriebsmittellisteObjekt extends ObjektBasis {
  type: 'betriebsmittelliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
}

export interface StromkreisverzeichnisObjekt extends ObjektBasis {
  type: 'stromkreisverzeichnis'
  position: Point
  verteiler: string | null
  titel: string | null
  textHoehe: number
}

export interface AktorkanallisteObjekt extends ObjektBasis {
  type: 'aktorkanalliste'
  position: Point
  verteiler: string | null
  titel: string | null
  textHoehe: number
}

export interface PotentialObjekt extends ObjektBasis {
  type: 'potential'
  position: Point
  drehung: number
  name: string
  beschreibung?: string
}

export interface KnotenpunktObjekt extends ObjektBasis {
  type: 'knotenpunkt'
  position: Point
}

export interface PotentiallisteObjekt extends ObjektBasis {
  type: 'potentialliste'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
}

export interface SteuerungslogikObjekt extends ObjektBasis {
  type: 'steuerungslogik'
  position: Point
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
  unbelegteSlotsAusblenden: boolean
}

export interface LeitungsbaumObjekt extends ObjektBasis {
  type: 'leitungsbaum'
  position: Point
  gliederung: 'trunk' | 'verteiler'
  umfang: 'blatt' | 'projekt'
  titel: string | null
  textHoehe: number
  zielBreite: number | null
  einpassen: boolean
  trunksAnzeigen: boolean
}

export type PlankopfQuelle =
  'zeichnungName' | 'blattName' | 'blattNummerVonAnzahl' | 'massstab' | 'blattformat' | 'datumHeute'

export interface PlankopfZelle {
  beschriftung: string
  wert: string
  quelle: PlankopfQuelle | null
  spanne: number
  logo: { assetId: string; dateiname: string } | null
}

export interface PlankopfZeile {
  hoeheMm: number
  zellen: PlankopfZelle[]
}

export interface PlankopfObjekt extends ObjektBasis {
  type: 'plankopf'
  position: Point
  breiteMm: number
  zeilen: PlankopfZeile[]
}

export interface WandObjekt extends ObjektBasis {
  type: 'wand'
  punkte: Point[]
  staerke: number
  fuellung: Fuellung | null
}

export const STANDARD_WAND_STAERKE = 0.24
export const STANDARD_WAND_FUELL_FARBE = '#d8d8d8'
export const WAND_STAERKE_MIN = 0.05

export interface WandOeffnungBasis {
  wandId: string
  t: number
  breite: number
  position: Point
  richtung: number
}

export interface TuerObjekt extends ObjektBasis, WandOeffnungBasis {
  type: 'tuer'
  gespiegelt: boolean
  schwenkInnen: boolean
  hoehe?: number
}

export interface FensterObjekt extends ObjektBasis, WandOeffnungBasis {
  type: 'fenster'
  hoehe?: number
  bruestungshoehe?: number
}

export interface WanddurchbruchObjekt extends ObjektBasis, WandOeffnungBasis {
  type: 'wanddurchbruch'
}

export const STANDARD_TUER_BREITE = 0.9
export const STANDARD_FENSTER_BREITE = 1.2
export const STANDARD_WANDDURCHBRUCH_BREITE = 1.2

export interface RaumObjekt extends ObjektBasis {
  type: 'raum'
  punktImRaum: Point
  name: string
  schriftgroesse: number
  umriss: Point[]
  flaeche: number
  mittelpunkt: Point
  gueltig: boolean
  nameSichtbar?: boolean
  flaecheSichtbar?: boolean
  fuellung: Fuellung | null
  beschriftungVersatz?: Point | null
  deckenstaerke?: number
  stromkreisMitRaumId?: string
}

export const STANDARD_RAUM_NAME = 'Raum'

export function standardRaumName(uebersetze: Uebersetzer = t): string {
  return uebersetze('beschriftung.raum.vorgabeName')
}
export const STANDARD_RAUM_SCHRIFTGROESSE = 0.2

export interface TreppenObjekt extends ObjektBasis {
  type: 'treppe'
  form: TreppenForm
  ursprung: Point
  breite: number
  hoehe: number
  drehung: number
  stufenanzahl: number
  laufrichtungGespiegelt: boolean
  beschriftungSichtbar: boolean
  lFormSpiegelHorizontal: boolean
  lFormSpiegelVertikal: boolean
  lFormLaufALaenge: number
  lFormLaufABreite: number
  lFormLaufBLaenge: number
  lFormLaufBBreite: number
}

export type TreppenForm = 'gerade' | 'u-podest' | 'u-kehre' | 'l-kehre'

export interface BodenplattenObjekt extends ObjektBasis {
  type: 'bodenplatte'
  punkte: Point[]
  staerke: number
  oberkante: number
  fuellung: Fuellung | null
}

export const STANDARD_BODENPLATTE_STAERKE = 0.25
export const STANDARD_BODENPLATTE_LINIENTYP: Linientyp = 'gestrichelt'

const TREPPEN_FORM_SCHLUESSEL: Record<TreppenForm, Schluessel> = {
  gerade: 'beschriftung.treppe.formGerade',
  'u-podest': 'beschriftung.treppe.formUPodest',
  'u-kehre': 'beschriftung.treppe.formUKehre',
  'l-kehre': 'beschriftung.treppe.formLKehre',
}

export function treppenFormText(form: TreppenForm, uebersetze: Uebersetzer = t): string {
  return uebersetze(TREPPEN_FORM_SCHLUESSEL[form])
}

export const TREPPEN_FORM_LABELS: Readonly<Record<TreppenForm, string>> = {
  get gerade() {
    return treppenFormText('gerade')
  },
  get 'u-podest'() {
    return treppenFormText('u-podest')
  },
  get 'u-kehre'() {
    return treppenFormText('u-kehre')
  },
  get 'l-kehre'() {
    return treppenFormText('l-kehre')
  },
}

export const STANDARD_TREPPEN_STUFENTIEFE = 0.25
export const MINDEST_TREPPEN_STUFENANZAHL = 2
export const WENDELSTUFEN_180 = 6
export const WENDELSTUFEN_90 = 3

export type Objekt =
  | LinienObjekt
  | PolylinienObjekt
  | RechteckObjekt
  | KreisObjekt
  | BogenObjekt
  | EllipseObjekt
  | PolygonObjekt
  | PunktObjektMitPosition
  | TextObjekt
  | BemassungObjekt
  | BemassungsreiheObjekt
  | SchraffurObjekt
  | KomponentenObjekt
  | LeitungsObjekt
  | SchaltverbindungObjekt
  | TrunkObjekt
  | KabelschachtObjekt
  | StuecklistenObjekt
  | LeitungslisteObjekt
  | SwitchplanObjekt
  | TrunklisteObjekt
  | LeitungsbaumObjekt
  | PlankopfObjekt
  | WandObjekt
  | TuerObjekt
  | FensterObjekt
  | WanddurchbruchObjekt
  | RaumObjekt
  | RaumlisteObjekt
  | BetriebsmittellisteObjekt
  | StromkreisverzeichnisObjekt
  | AktorkanallisteObjekt
  | PotentialObjekt
  | KnotenpunktObjekt
  | PotentiallisteObjekt
  | SteuerungslogikObjekt
  | TreppenObjekt
  | BodenplattenObjekt

export type ObjektTyp = Objekt['type']

export const ZEICHENOBJEKT_TYPEN: ObjektTyp[] = [
  'linie',
  'polylinie',
  'rechteck',
  'kreis',
  'bogen',
  'ellipse',
  'polygon',
  'punkt',
  'text',
  'bemassung',
  'bemassungsreihe',
  'schraffur',
  'wand',
]

export const FUELLBARE_TYPEN = [
  'polylinie',
  'rechteck',
  'kreis',
  'ellipse',
  'polygon',
  'wand',
  'raum',
  'bodenplatte',
] as const satisfies readonly ObjektTyp[]

export type FuellbaresObjekt = Extract<Objekt, { type: (typeof FUELLBARE_TYPEN)[number] }>

export function istFuellbar(objekt: Objekt): objekt is FuellbaresObjekt {
  return (FUELLBARE_TYPEN as readonly ObjektTyp[]).includes(objekt.type)
}

export function mitKomponentenObenSortiert(objekte: readonly Objekt[]): Objekt[] {
  const andere = objekte.filter((o) => o.type !== 'komponente')
  const komponenten = objekte.filter((o) => o.type === 'komponente')
  return [...andere, ...komponenten]
}

export function wirksameFuellung(objekt: Objekt): Fuellung | null {
  if (!istFuellbar(objekt)) return null
  if (objekt.type === 'polylinie' && (!objekt.geschlossen || objekt.punkte.length < 3)) return null
  if (objekt.type === 'raum' && objekt.umriss.length < 3) return null
  if (objekt.type === 'bodenplatte' && objekt.punkte.length < 3) return null
  return objekt.fuellung
}

export type RechteckGeometrie = Pick<RechteckObjekt, 'ursprung' | 'breite' | 'hoehe' | 'drehung'>

export function rechteckEcken(o: RechteckGeometrie): Point[] {
  const ecken: Point[] = [
    { x: o.ursprung.x, y: o.ursprung.y },
    { x: o.ursprung.x + o.breite, y: o.ursprung.y },
    { x: o.ursprung.x + o.breite, y: o.ursprung.y + o.hoehe },
    { x: o.ursprung.x, y: o.ursprung.y + o.hoehe },
  ]
  if (o.drehung === 0) return ecken
  const zentrum = { x: o.ursprung.x + o.breite / 2, y: o.ursprung.y + o.hoehe / 2 }
  return ecken.map((p) => rotatePoint(p, zentrum, o.drehung))
}

export function grundGroesseWelt(
  instanz: Pick<KomponentenObjekt, 'groesseWelt' | 'hoehenFaktor'>,
): number {
  return instanz.groesseWelt / (instanz.hoehenFaktor ?? 1)
}

export function getBoundingBox(objekt: Objekt): BoundingBox {
  switch (objekt.type) {
    case 'linie':
      return boundingBoxFromPoints([objekt.start, objekt.ende])
    case 'polylinie':
    case 'bodenplatte':
      return boundingBoxFromPoints(objekt.punkte)
    case 'rechteck':
    case 'treppe':
      return boundingBoxFromPoints(rechteckEcken(objekt))
    case 'kreis':
      return {
        min: { x: objekt.mittelpunkt.x - objekt.radius, y: objekt.mittelpunkt.y - objekt.radius },
        max: { x: objekt.mittelpunkt.x + objekt.radius, y: objekt.mittelpunkt.y + objekt.radius },
      }
    case 'bogen': {
      return {
        min: { x: objekt.mittelpunkt.x - objekt.radius, y: objekt.mittelpunkt.y - objekt.radius },
        max: { x: objekt.mittelpunkt.x + objekt.radius, y: objekt.mittelpunkt.y + objekt.radius },
      }
    }
    case 'ellipse': {
      const r = Math.max(objekt.radiusX, objekt.radiusY)
      return {
        min: { x: objekt.mittelpunkt.x - r, y: objekt.mittelpunkt.y - r },
        max: { x: objekt.mittelpunkt.x + r, y: objekt.mittelpunkt.y + r },
      }
    }
    case 'polygon':
      return {
        min: {
          x: objekt.mittelpunkt.x - objekt.radius,
          y: objekt.mittelpunkt.y - objekt.radius,
        },
        max: {
          x: objekt.mittelpunkt.x + objekt.radius,
          y: objekt.mittelpunkt.y + objekt.radius,
        },
      }
    case 'punkt':
    case 'knotenpunkt':
      return boundingBoxFromPoints([objekt.position])
    case 'potential':
      return expandBoundingBox(boundingBoxFromPoints([objekt.position]), POTENTIAL_SYMBOL_GROESSE)
    case 'text':
      return boundingBoxFromPoints([
        objekt.position,
        {
          x: objekt.position.x + objekt.inhalt.length * objekt.hoehe * 0.6,
          y: objekt.position.y + objekt.hoehe,
        },
      ])
    case 'bemassung':
      return boundingBoxFromPoints([objekt.start, objekt.ende])
    case 'bemassungsreihe':
      return bemassungsreiheBoundingBox(objekt)
    case 'schraffur':
      return boundingBoxFromPoints(objekt.kontur)
    case 'komponente': {
      const halbX = (objekt.breiteWelt ?? objekt.groesseWelt) / 2
      const halbY = objekt.groesseWelt / 2
      const ecken = [
        { x: objekt.position.x - halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y - halbY },
        { x: objekt.position.x + halbX, y: objekt.position.y + halbY },
        { x: objekt.position.x - halbX, y: objekt.position.y + halbY },
      ].map((p) => rotatePoint(p, objekt.position, objekt.drehung))
      return boundingBoxFromPoints(ecken)
    }
    case 'leitung': {
      let bb: BoundingBox | null = null
      for (const segment of objekt.pfadSegmente) {
        if (segment.length === 0) continue
        const segmentBb = boundingBoxFromPoints(segment)
        bb = bb ? unionBoundingBox(bb, segmentBb) : segmentBb
      }
      return bb ?? { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
    }
    case 'trunk':
    case 'schaltverbindung':
      return boundingBoxFromPoints(objekt.wegpunkte)
    case 'kabelschacht':
      return boundingBoxFromPoints(rechteckEcken(objekt))
    case 'wand':
      return expandBoundingBox(boundingBoxFromPoints(objekt.punkte), objekt.staerke / 2)
    case 'tuer':
    case 'fenster':
    case 'wanddurchbruch':
      return {
        min: { x: objekt.position.x - objekt.breite / 2, y: objekt.position.y - objekt.breite / 2 },
        max: { x: objekt.position.x + objekt.breite / 2, y: objekt.position.y + objekt.breite / 2 },
      }
    case 'raum':
      return boundingBoxFromPoints(objekt.umriss.length > 0 ? objekt.umriss : [objekt.punktImRaum])
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik':
    case 'leitungsbaum':
    case 'plankopf':
      return boundingBoxFromPoints([objekt.position])
  }
}

export function polygonPunkte(o: PolygonObjekt): Point[] {
  const punkte: Point[] = []
  for (let i = 0; i < o.seitenAnzahl; i++) {
    const winkel = o.drehung + (i / o.seitenAnzahl) * Math.PI * 2
    punkte.push({
      x: o.mittelpunkt.x + Math.cos(winkel) * o.radius,
      y: o.mittelpunkt.y + Math.sin(winkel) * o.radius,
    })
  }
  return punkte
}

export function neueObjektBasis(
  ebeneId: string,
  ueberschreibung?: Partial<ObjektBasis>,
): ObjektBasis {
  return {
    id: erzeugeId('objekt'),
    ebeneId,
    farbe: STANDARD_FARBE,
    strichstaerke: STANDARD_STRICHSTAERKE,
    linientyp: STANDARD_LINIENTYP,
    ...ueberschreibung,
  }
}

export function verschiebeObjekt(objekt: Objekt, delta: Point): Objekt {
  switch (objekt.type) {
    case 'linie':
      return { ...objekt, start: add(objekt.start, delta), ende: add(objekt.ende, delta) }
    case 'polylinie':
    case 'bodenplatte':
      return { ...objekt, punkte: objekt.punkte.map((p) => add(p, delta)) }
    case 'rechteck':
    case 'kabelschacht':
    case 'treppe':
      return { ...objekt, ursprung: add(objekt.ursprung, delta) }
    case 'kreis':
    case 'bogen':
    case 'ellipse':
    case 'polygon':
      return { ...objekt, mittelpunkt: add(objekt.mittelpunkt, delta) }
    case 'punkt':
    case 'knotenpunkt':
    case 'text':
    case 'komponente':
    case 'potential':
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik':
    case 'leitungsbaum':
    case 'plankopf':
      return { ...objekt, position: add(objekt.position, delta) }
    case 'bemassung':
      return { ...objekt, start: add(objekt.start, delta), ende: add(objekt.ende, delta) }
    case 'bemassungsreihe':
      return { ...objekt, punkte: objekt.punkte.map((p) => add(p, delta)) }
    case 'schraffur':
      return { ...objekt, kontur: objekt.kontur.map((p) => add(p, delta)) }
    case 'leitung':
      return {
        ...objekt,
        pfadSegmente: objekt.pfadSegmente.map((segment) => segment.map((p) => add(p, delta))),
        ...(objekt.teilstueckZonen
          ? {
              teilstueckZonen: objekt.teilstueckZonen.map((e) => ({
                ...e,
                von: add(e.von, delta),
                bis: add(e.bis, delta),
              })),
            }
          : {}),
      }
    case 'trunk':
    case 'schaltverbindung':
      return { ...objekt, wegpunkte: objekt.wegpunkte.map((p) => add(p, delta)) }
    case 'wand':
      return { ...objekt, punkte: objekt.punkte.map((p) => add(p, delta)) }
    case 'tuer':
    case 'fenster':
    case 'wanddurchbruch':
      return objekt
    case 'raum':
      return {
        ...objekt,
        punktImRaum: add(objekt.punktImRaum, delta),
        mittelpunkt: add(objekt.mittelpunkt, delta),
        umriss: objekt.umriss.map((p) => add(p, delta)),
      }
  }
}

export function dreheObjekt(objekt: Objekt, zentrum: Point, winkel: number): Objekt {
  switch (objekt.type) {
    case 'linie':
      return {
        ...objekt,
        start: rotatePoint(objekt.start, zentrum, winkel),
        ende: rotatePoint(objekt.ende, zentrum, winkel),
      }
    case 'polylinie':
    case 'bodenplatte':
      return { ...objekt, punkte: objekt.punkte.map((p) => rotatePoint(p, zentrum, winkel)) }
    case 'wand':
      return { ...objekt, punkte: objekt.punkte.map((p) => rotatePoint(p, zentrum, winkel)) }
    case 'schraffur':
      return { ...objekt, kontur: objekt.kontur.map((p) => rotatePoint(p, zentrum, winkel)) }
    case 'kreis':
      return { ...objekt, mittelpunkt: rotatePoint(objekt.mittelpunkt, zentrum, winkel) }
    case 'bogen':
      return {
        ...objekt,
        mittelpunkt: rotatePoint(objekt.mittelpunkt, zentrum, winkel),
        startWinkel: objekt.startWinkel + winkel,
        endWinkel: objekt.endWinkel + winkel,
      }
    case 'rechteck':
    case 'kabelschacht':
    case 'treppe': {
      const alteMitte = mittelpunktVonRechteck(objekt)
      const neueMitte = rotatePoint(alteMitte, zentrum, winkel)
      return {
        ...objekt,
        ursprung: { x: neueMitte.x - objekt.breite / 2, y: neueMitte.y - objekt.hoehe / 2 },
        drehung: objekt.drehung + winkel,
      }
    }
    case 'ellipse':
      return {
        ...objekt,
        mittelpunkt: rotatePoint(objekt.mittelpunkt, zentrum, winkel),
        drehung: objekt.drehung + winkel,
      }
    case 'polygon':
      return {
        ...objekt,
        mittelpunkt: rotatePoint(objekt.mittelpunkt, zentrum, winkel),
        drehung: objekt.drehung + winkel,
      }
    case 'text':
      return {
        ...objekt,
        position: rotatePoint(objekt.position, zentrum, winkel),
        drehung: objekt.drehung + winkel,
      }
    case 'komponente':
    case 'potential':
      return {
        ...objekt,
        position: rotatePoint(objekt.position, zentrum, winkel),
        drehung: objekt.drehung + winkel,
      }
    case 'knotenpunkt':
      return { ...objekt, position: rotatePoint(objekt.position, zentrum, winkel) }
    default:
      return objekt
  }
}

export function skaliereObjekt(
  objekt: Objekt,
  zentrum: Point,
  faktorX: number,
  faktorY: number,
): Objekt {
  const skalierePunkt = (p: Point): Point => ({
    x: zentrum.x + (p.x - zentrum.x) * faktorX,
    y: zentrum.y + (p.y - zentrum.y) * faktorY,
  })
  const faktorProportional = (faktorX + faktorY) / 2
  switch (objekt.type) {
    case 'linie':
      return { ...objekt, start: skalierePunkt(objekt.start), ende: skalierePunkt(objekt.ende) }
    case 'polylinie':
    case 'bodenplatte':
      return { ...objekt, punkte: objekt.punkte.map(skalierePunkt) }
    case 'wand':
      return {
        ...objekt,
        punkte: objekt.punkte.map(skalierePunkt),
        staerke: objekt.staerke * faktorProportional,
      }
    case 'schraffur':
      return { ...objekt, kontur: objekt.kontur.map(skalierePunkt) }
    case 'rechteck':
    case 'kabelschacht':
    case 'treppe': {
      const alteMitte = mittelpunktVonRechteck(objekt)
      const neueMitte = skalierePunkt(alteMitte)
      const neueBreite = objekt.breite * faktorX
      const neueHoehe = objekt.hoehe * faktorY
      const lForm =
        objekt.type === 'treppe' && objekt.form === 'l-kehre'
          ? {
              lFormLaufALaenge: objekt.lFormLaufALaenge * faktorProportional,
              lFormLaufABreite: objekt.lFormLaufABreite * faktorProportional,
              lFormLaufBLaenge: objekt.lFormLaufBLaenge * faktorProportional,
              lFormLaufBBreite: objekt.lFormLaufBBreite * faktorProportional,
            }
          : null
      return {
        ...objekt,
        ...lForm,
        ursprung: { x: neueMitte.x - neueBreite / 2, y: neueMitte.y - neueHoehe / 2 },
        breite: neueBreite,
        hoehe: neueHoehe,
      }
    }
    case 'ellipse':
      return {
        ...objekt,
        mittelpunkt: skalierePunkt(objekt.mittelpunkt),
        radiusX: objekt.radiusX * faktorX,
        radiusY: objekt.radiusY * faktorY,
      }
    case 'kreis':
      return {
        ...objekt,
        mittelpunkt: skalierePunkt(objekt.mittelpunkt),
        radius: objekt.radius * faktorProportional,
      }
    case 'bogen':
      return {
        ...objekt,
        mittelpunkt: skalierePunkt(objekt.mittelpunkt),
        radius: objekt.radius * faktorProportional,
      }
    case 'polygon':
      return {
        ...objekt,
        mittelpunkt: skalierePunkt(objekt.mittelpunkt),
        radius: objekt.radius * faktorProportional,
      }
    case 'text':
      return {
        ...objekt,
        position: skalierePunkt(objekt.position),
        hoehe: objekt.hoehe * faktorProportional,
      }
    case 'komponente': {
      const neuesBreiteWelt =
        objekt.breiteWelt !== undefined
          ? objekt.breiteWelt * faktorX
          : faktorX === faktorY
            ? undefined
            : objekt.groesseWelt * faktorX
      return {
        ...objekt,
        position: skalierePunkt(objekt.position),
        groesseWelt: objekt.groesseWelt * faktorY,
        ...(neuesBreiteWelt !== undefined ? { breiteWelt: neuesBreiteWelt } : {}),
      }
    }
    case 'plankopf':
      return {
        ...objekt,
        position: skalierePunkt(objekt.position),
        breiteMm: objekt.breiteMm * faktorProportional,
        zeilen: objekt.zeilen.map((zeile) => ({
          ...zeile,
          hoeheMm: zeile.hoeheMm * faktorProportional,
        })),
      }
    default:
      return objekt
  }
}

function mittelpunktVonRechteck(o: RechteckGeometrie): Point {
  return { x: o.ursprung.x + o.breite / 2, y: o.ursprung.y + o.hoehe / 2 }
}

export function dupliziereObjekt(objekt: Objekt, versatz: Point): Objekt {
  const verschoben = ohneHerkunft(verschiebeObjekt(objekt, versatz))
  if (verschoben.type === 'leitung') {
    const { verteilerAnschluesse: _anschluesse, ...ohneAnschluesse } = verschoben
    return {
      ...ohneAnschluesse,
      id: erzeugeId('objekt'),
      start: loeseDockAnFreiesEnde(verschoben.start),
      ziel: loeseDockAnFreiesEnde(verschoben.ziel),
      pfadSegmente: verschoben.pfadSegmente.filter((segment) => segment.length > 0),
      trunkDurchgaenge: [],
    }
  }
  if (verschoben.type === 'schaltverbindung') {
    return {
      ...verschoben,
      id: erzeugeId('objekt'),
      start: { art: 'frei' },
      ziel: { art: 'frei' },
    }
  }
  if (verschoben.type === 'trunk') {
    return { ...verschoben, id: erzeugeId('objekt'), enden: [{}, {}] }
  }
  if (verschoben.type === 'komponente' && verschoben.traegerId !== undefined) {
    return {
      ...verschoben,
      id: erzeugeId('objekt'),
      traegerId: undefined,
      slotIndex: undefined,
    }
  }
  if (verschoben.type === 'komponente' && verschoben.wandstelle) {
    const { wandstelle: _w, kombination, kombinationsFaktor, ...frei } = verschoben
    void _w
    const verkleinert =
      kombination !== undefined && !verschoben.modulTraeger && verschoben.kombinierbar !== false
    const faktor = kombinationsFaktor ?? ALTER_KOMBINATION_FAKTOR
    return {
      ...frei,
      id: erzeugeId('objekt'),
      ...(verkleinert
        ? {
            groesseWelt: verschoben.groesseWelt / faktor,
            ...(verschoben.breiteWelt !== undefined
              ? { breiteWelt: verschoben.breiteWelt / faktor }
              : {}),
          }
        : {}),
    }
  }
  return { ...verschoben, id: erzeugeId('objekt') }
}

function ohneHerkunft(objekt: Objekt): Objekt {
  if (
    objekt.ausHintergrund === undefined &&
    objekt.ausBauteil === undefined &&
    objekt.ifcGuid === undefined &&
    objekt.ifcStand === undefined
  )
    return objekt
  const kopie = { ...objekt }
  delete kopie.ausHintergrund
  delete kopie.ausBauteil
  delete kopie.ifcGuid
  delete kopie.ifcStand
  return kopie
}

function loeseDockAnFreiesEnde(endpunkt: LeitungsZiel): LeitungsEndpunkt {
  return endpunkt.art === 'frei' ? endpunkt : { art: 'frei' }
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
}
