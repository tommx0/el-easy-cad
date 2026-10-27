import type { StarreAusrichtung } from '../ifc'
import type { CommandStack } from './command'
import type { BauteilVorgaben } from './bauteil-vorgaben'
import type { VerlegeVorgaben } from './verlege-vorgaben'
import type { DxfEntity } from '../document-model'
import type {
  Ansteuerung,
  BauteilVorlagen,
  CatalogComponent,
  DocumentStore,
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KnxAktorDaten,
  KomponentenObjekt,
  KomponentenTyp,
  Slot,
  SlotMatrix,
  SlotVorlage,
  Teilstueck,
  ModulTraegerKonfiguration,
  Montageort,
  Objekt,
  Point,
  Strecke,
  VerteilerAuswahl,
  Zeichnung,
} from '../document-model'
import type { Bauteilfunde, Probenart } from '../erkennung'
import type { KomponentenRenderKontext, ViewTransform } from '../rendering'
import type { RoutingSettings } from '../routing'
import type { Fangart } from './objektfang'
import type { PfeiltastenSchritte } from './pfeiltasten'
import type { KonstruktionsStrecke } from './konstruktionsmass'

export interface PointerInfo {
  screen: Point
  world: Point
  raw: Point
  button: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey?: boolean
}

export function erweitertAuswahl(info: Pick<PointerInfo, 'ctrlKey' | 'metaKey'>): boolean {
  return info.ctrlKey || info.metaKey === true
}

export interface ToolContext {
  readonly view: ViewTransform
  readonly doc: DocumentStore
  readonly commands: CommandStack
  bekannteVerteilerKennzeichen?(): readonly string[]
  verknuepfteZeichnungen?(): {
    bauplaene: readonly Zeichnung[]
    verteilerplaene: readonly Zeichnung[]
  }
  aktiveEbeneId(): string
  aktivesBlattId(): string
  istSnapAktiv(): boolean
  gridSchritt(): number
  wandStaerke(): number
  setWandStaerke(wert: number): void
  bauteilVorgaben(): BauteilVorgaben
  setBauteilVorgaben(patch: Partial<BauteilVorgaben>): void
  verlegeVorgaben(): VerlegeVorgaben
  zonenZugewiesen(): void
  erkennungsVorschau(): Bauteilfunde
  ifcBauteileVorschau(): BauteilVorlagen
  umwandelnVorschau(): readonly Objekt[]
  erkennungsProbenart(): Probenart
  meldeErkennungsProbe(a: Point, b: Point): void
  meldeTeilstueckAuswahl?(stuecke: readonly Teilstueck[]): void
  routingSettings(): RoutingSettings
  wandfangAktiv?(): boolean
  leitungenErstNachLoslassen?(): boolean
  klemmenLeiste?(): string
  leitungVerknuepfen?(blattId: string, leitungId: string): void
  slotsUebernehmen?(quelle: { blattId: string; objektId: string }, slots: Slot[]): void
  hintergrundLinienBei?(punkt: Point, toleranz: number): Strecke[]
  installationshoehenVorgabenCm?(): readonly number[]
  pfeiltastenSchritte(): PfeiltastenSchritte
  katalogKomponenten(): CatalogComponent[]
  komponentenRenderKontext(): KomponentenRenderKontext
  getCanvasGroesse(): { breite: number; hoehe: number }
  requestOverlayRedraw(): void
  setStatus(text: string | null): void
  zurueckZuAuswahl(): void
  getAuswahl(): string[]
  setAuswahl(ids: string[]): void
  oeffneEingabeDialog(
    optionen: EingabeDialogOptionen,
    callback: (wert: string | null) => void,
  ): void
  oeffneBestaetigung(optionen: BestaettigungsZustand): void

  oeffneKomponentenPicker(
    callback: (
      auswahl: {
        catalogComponentId: string
        variantId: string | null
        dockpunkte?: DockpunkteKonfiguration
        fangpunkt?: Fangpunkt
        textElemente?: KatalogTextElement[]
        breitenFaktor?: number
        hoehenFaktor?: number
        kombinierbar?: boolean
        montageort?: Montageort
        modulTraeger?: ModulTraegerKonfiguration
        modulSystem?: string
        typ?: KomponentenTyp
        slotVorlagen?: SlotVorlage[]
        slotMatrixVorlage?: SlotMatrix
        slotAnzahlAus?: string
        ansteuerung?: Ansteuerung
        kennzeichenBuchstabe?: string
        betriebsmittelRolle?: 'spule' | 'kontaktblock'
        bauart?: 'patchpanel' | 'verteiler'
      } | null,
    ) => void,
    optionen?: {
      filter?: 'switchPatchpanel' | 'betriebsmittel'
      titel?: string
      bestaetigenText?: string
      nurKatalogId?: string
    },
  ): void
  oeffneTrunkVerbindenDialog(
    von: { blattId: string; trunkId: string; endeIndex: 0 | 1 },
    callback: (ziel: { blattId: string; trunkId: string; endeIndex: 0 | 1 } | null) => void,
  ): void
  oeffneSwitchPortDialog(
    optionen: SwitchPortDialogOptionen,
    callback: (ziel: BuendelZiel | null) => void,
  ): void
  oeffneVerteilerDialog(
    optionen: VerteilerDialogOptionen,
    callback: (auswahl: VerteilerAuswahl[] | null) => void,
  ): void
  oeffneKnxAktorDialog?(
    optionen: KnxAktorDialogOptionen,
    callback: (ergebnis: KnxAktorDialogErgebnis | null) => void,
  ): void
  oeffnePlankopfDialog(objektId: string): void
  oeffneLeitungslisteKabeltypDialog(kabelNummer: number): void
  oeffneSchachtVerbundDialog(
    optionen: SchachtVerbundDialogOptionen,
    callback: (auswahl: SchachtVerbundAuswahl | null) => void,
  ): void
  oeffneSchachtAnschlussDialog(
    optionen: SchachtAnschlussDialogOptionen,
    callback: (ergebnis: SchachtAnschlussErgebnis | null) => void,
  ): void
  oeffneSlotWahlDialog(
    optionen: { blattId: string; objektId: string },
    callback: (slotId: string | null) => void,
  ): void
}

export type SchachtVerbundAuswahl =
  | { art: 'vorhanden'; verbundId: string; name: string; geschosshoehe: number }
  | { art: 'neu'; name: string; geschosshoehe: number }

export interface SchachtVerbundDialogOptionen {
  titel: string
  aktuellerVerbundId?: string | null
  geschosshoehe?: number
}

export interface SchachtAnschlussDialogOptionen {
  blattId: string
  schachtId: string
  art: 'leitung' | 'trunk'
  objektId?: string | null
  trunkErlaubt?: boolean
}

export type SchachtAnschlussErgebnis =
  { art: 'strang'; strang: number; name?: string } | { art: 'trunk'; trunkId: string }

export interface SwitchPortZiel {
  blattId: string
  objektId: string
  portIndex: number
}

export type BuendelZiel =
  | ({ art: 'port' } & SwitchPortZiel)
  | { art: 'schacht'; blattId: string; schachtId: string; strang: number; name?: string }
  | { art: 'verteiler'; blattId: string; objektId: string; anschluesse: VerteilerAuswahl[] }

export interface VerteilerDialogOptionen {
  blattId: string
  objektId: string
  modus?: 'zuweisen' | 'uebersicht'
  fuer?: string
  vorauswahl?: VerteilerAuswahl[]
}

export interface KnxAktorDialogOptionen {
  daten: KnxAktorDaten
  kennzeichen?: string
  mitBeschriftung?: boolean
  titel?: string
  bestaetigenText?: string
}

export interface KnxAktorDialogErgebnis {
  daten: KnxAktorDaten
  kennzeichen?: string
}

export interface SwitchPortDialogOptionen {
  quelle:
    | { art: 'trunk'; blattId: string; trunkId: string }
    | { art: 'switch'; blattId: string; objektId: string }
  modus?: 'zuweisen' | 'uebersicht'
  vorauswahl?: SwitchPortZiel | null
  schachtErlaubt?: boolean
}

export interface EingabeDialogOptionen {
  titel: string
  label: string
  hinweis?: string
  anfangswert?: string
  typ?: 'text' | 'zahl'
  auswahl?: {
    label: string
    optionen: { wert: string; text: string }[]
    anfangswert: string
  }
  zweiteAuswahl?: {
    label: string
    optionen: { wert: string; text: string }[]
    anfangswert: string
  }
}

export interface BestaettigungsZustand {
  titel: string
  nachricht: string
  bestaetigenText?: string
  destruktiv?: boolean
  alternative?: { text: string; callback: () => void }
  liste?: string[]
  ohneAbbrechen?: boolean
  callback: (bestaetigt: boolean) => void
}

export type ToolVorgabe =
  | {
      art: 'leitung-am-schacht'
      schachtId: string
      strang: number
    }
  | { art: 'ifc-ausrichten'; auftrag: IfcAusrichtAuftrag }

export interface IfcAusrichtAuftrag {
  entities: DxfEntity[]
  vorschauMitte: Point
  uebernehmen(ausrichtung: StarreAusrichtung): void
}

export interface KontextAktion {
  taste: string
  kennung: string
  beschriftung: string
  an?: boolean
  gruppe?: string
  gewaehlt?: boolean
  wert?: string
}

export interface Tool {
  readonly id: string
  readonly bezeichnung: string
  readonly kuerzel?: string
  readonly bleibtAktiv?: boolean
  readonly erneutAktivierbar?: boolean
  readonly zusaetzlicheFangarten?: readonly Fangart[]
  onActivate?(ctx: ToolContext, vorgabe?: ToolVorgabe): void
  onDeactivate?(ctx: ToolContext): void
  onPointerDown?(info: PointerInfo, ctx: ToolContext): void
  onPointerMove?(info: PointerInfo, ctx: ToolContext): void
  onPointerUp?(info: PointerInfo, ctx: ToolContext): void
  onPointerLeave?(ctx: ToolContext): void
  onDoubleClick?(info: PointerInfo, ctx: ToolContext): void
  onRightClick?(info: PointerInfo, ctx: ToolContext): boolean | void
  onAbbrechen?(ctx: ToolContext): boolean | void
  onKeyDown?(e: KeyboardEvent, ctx: ToolContext): void
  onKeyUp?(e: KeyboardEvent, ctx: ToolContext): void
  drawOverlay?(g: CanvasRenderingContext2D, ctx: ToolContext): void
  konstruktionsStrecke?(): KonstruktionsStrecke | null
  liveNullpunkt?(): Point | null
  tastenAktionen?(ctx: ToolContext): KontextAktion[]
  dockpunkteAngeboten?(): ((komponente: KomponentenObjekt) => readonly number[] | null) | null
}
