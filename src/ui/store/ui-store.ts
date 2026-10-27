import { create } from 'zustand'
import {
  STANDARD_KLEMMENLEISTE,
  STANDARD_WAND_STAERKE,
  WAND_STAERKE_MIN,
} from '../../document-model'
import type {
  EtagenRichtung,
  GruppenAngaben,
  GruppenVorgabe,
  KiStatus,
  ZusatzmodulVorschau,
} from '../../document-model'
import type { ZusatzmodulFeldWert, ZusatzmodulFormular } from '../zusatzmodule/schnittstelle'
import {
  STANDARD_BAUTEIL_VORGABEN,
  STANDARD_VERLEGE_VORGABEN,
  type BauteilVorgaben,
  type VerlegeVorgaben,
} from '../../tools'
import type {
  BauteilVorlagen,
  IfcAbweichung,
  Ansteuerung,
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenTyp,
  SlotMatrix,
  SlotVorlage,
  ModulTraegerKonfiguration,
  Montageort,
  IfcBauteilGruppe,
  Objekt,
  IfcLage,
  Point,
  Teilstueck,
  VerteilerAuswahl,
} from '../../document-model'
import type { BauteilOptionen, Bauteilfunde, Probenart } from '../../erkennung'
import {
  STANDARD_WAND_ERKENNUNG,
  WAND_SUCHBEREICH_OBERGRENZE,
  WAND_SUCHBEREICH_UNTERGRENZE,
} from '../../erkennung'
import type {
  EinstellungsSicherung,
  GeoeffnetesBibliothekPaket,
  ProduktlizenzStatus,
  VerfuegbaresUpdate,
} from '../../persistence'
import type { IfcGeschossInfo, IfcImportSitzung, PdfImportSitzung } from '../../rendering'
import type { Grundrisse, IfcBauteilfunde } from '../../ifc'
import {
  gleicheKontextAktionen,
  type EingabeDialogOptionen,
  type KnxAktorDialogErgebnis,
  type KnxAktorDialogOptionen,
  type KontextAktion,
} from '../../tools'
import type { OffenesDokument, SpeicherZustand } from '../dokument-sitzung'

export type KontextMenuZustand =
  | { x: number; y: number; art: 'leer' }
  | { x: number; y: number; art: 'leitung'; objektId: string; weltPunkt: Point }
  | { x: number; y: number; art: 'mehrfachauswahl' }
  | { x: number; y: number; art: 'trunk'; objektId: string; weltPunkt: Point }
  | { x: number; y: number; art: 'trunk-ende'; objektId: string; endeIndex: 0 | 1 }
  | { x: number; y: number; art: 'leitungsbaum'; objektId: string }
  | { x: number; y: number; art: 'bauteil'; objektId: string }
  | { x: number; y: number; art: 'schaltverbindung'; objektId: string }
  | { x: number; y: number; art: 'kabelschacht'; objektId: string }
  | { x: number; y: number; art: 'teilstuecke' }
  | { x: number; y: number; art: 'klemme'; objektId: string }

export interface EingabeDialogZustand {
  optionen: EingabeDialogOptionen
  callback: (wert: string | null, auswahl?: string, zweiteAuswahl?: string) => void
}

export interface GridVerteilenWerte {
  x: number
  y: number
  abstandX: number
  abstandY: number
}

export interface GridVerteilenDialogZustand {
  standard: GridVerteilenWerte
  callback: (werte: GridVerteilenWerte | null) => void
}

export interface VerteilenAbstandDialogZustand {
  titel: string
  standardAbstand: number
  callback: (abstandCm: number | null) => void
}

export interface KomponentenPickerZustand {
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
    } | null,
  ) => void
  filter?: 'switchPatchpanel' | 'betriebsmittel'
  titel?: string
  bestaetigenText?: string
  nurKatalogId?: string
}

export interface TrunkEndeRef {
  blattId: string
  trunkId: string
  endeIndex: 0 | 1
}

export interface TrunkVerbindenZustand {
  von: TrunkEndeRef
  callback: (ziel: TrunkEndeRef | null) => void
}

export interface HintergrundPdfImportErgebnis {
  seite: number
  ausschnittOffset: Point
  breiteRoh: number
  hoeheRoh: number
}

export interface HintergrundIfcImportErgebnis {
  grundrisse: Grundrisse
  geschosse: IfcGeschossInfo[]
  freieSchnitte: { name: string; hoehe: number }[]
  schnitthoehe: number
  ausgeblendeteGruppen: IfcBauteilGruppe[]
}

export interface HintergrundIfcImportZustand {
  sitzung: IfcImportSitzung
  lageVorgabe: IfcLage | null
  aktuellesBlattLeer: boolean
  callback: (ergebnis: HintergrundIfcImportErgebnis | null) => void
}

export interface IfcNachladeBlatt {
  blattId: string
  blattName: string
  geschossName?: string
  ifcGuid?: string
  freieHoehe?: number
  schnitthoehe: number
  lage: IfcLage
  bauteileVergleichen?: boolean
}

export interface IfcAbweichungenZustand {
  dateiname: string
  blaetter: { blattId: string; blattName: string; eintraege: IfcAbweichung[] }[]
}

export interface IfcNachladeErgebnis {
  blaetter: {
    blattId: string
    geschoss: IfcGeschossInfo | null
    grundriss: Grundrisse['geschosse'][number]
    bauteile?: IfcBauteilfunde
  }[]
}

export interface HintergrundIfcNachladenZustand {
  sitzung: IfcImportSitzung
  blaetter: IfcNachladeBlatt[]
  callback: (ergebnis: IfcNachladeErgebnis | null) => void
}

export interface HintergrundPdfImportZustand {
  sitzung: PdfImportSitzung
  dateiname: string
  callback: (ergebnis: HintergrundPdfImportErgebnis | null) => void
}

export type SwitchPortQuelle =
  | { art: 'trunk'; blattId: string; trunkId: string }
  | { art: 'switch'; blattId: string; objektId: string }

export interface SwitchPortZiel {
  blattId: string
  objektId: string
  portIndex: number
}

export type BuendelZiel =
  | ({ art: 'port' } & SwitchPortZiel)
  | { art: 'schacht'; blattId: string; schachtId: string; strang: number; name?: string }
  | { art: 'verteiler'; blattId: string; objektId: string; anschluesse: VerteilerAuswahl[] }

export type VerteilerplanAssistentZiel =
  | { art: 'verteiler'; blattId: string; objektId: string }
  | {
      art: 'projekt'
      projektId?: string
      nachErzeugen?: () => void
    }

export interface KnxAktorDialogZustand extends KnxAktorDialogOptionen {
  callback: (ergebnis: KnxAktorDialogErgebnis | null) => void
}

export interface VerteilerDialogZustand {
  blattId: string
  objektId: string
  modus: 'uebersicht' | 'zuweisen'
  fuer?: string
  vorauswahl?: VerteilerAuswahl[]
  callback?: (auswahl: VerteilerAuswahl[] | null) => void
}

export interface SwitchPortDialogZustand {
  quelle: SwitchPortQuelle
  modus: 'zuweisen' | 'uebersicht'
  vorauswahl?: SwitchPortZiel | null
  schachtErlaubt?: boolean
  callback: (ziel: BuendelZiel | null) => void
}

export type SchachtVerbundAuswahl =
  | { art: 'vorhanden'; verbundId: string; name: string; geschosshoehe: number }
  | { art: 'neu'; name: string; geschosshoehe: number }

export interface SchachtVerbundDialogZustand {
  titel: string
  aktuellerVerbundId: string | null
  geschosshoehe?: number
  callback: (auswahl: SchachtVerbundAuswahl | null) => void
}

export interface InhaltDialogZustand {
  art: 'trunk' | 'schacht'
  blattId: string
  objektId: string
}

export interface VerknuepfungDialogZustand {
  blattId: string
  leitungId: string
}

export interface GruppeBildenDialogZustand {
  titel: string
  text?: string
  hinweise?: string[]
  vorgabe: GruppenVorgabe
  bestaetigenText?: string
  callback: (angaben: GruppenAngaben | null) => void
}

export type SchachtAnschlussErgebnis =
  { art: 'strang'; strang: number; name?: string } | { art: 'trunk'; trunkId: string }

export interface SlotWahlDialogZustand {
  blattId: string
  objektId: string
  callback: (slotId: string | null) => void
}

export interface SchachtAnschlussDialogZustand {
  blattId: string
  schachtId: string
  art: 'leitung' | 'trunk'
  objektId: string | null
  trunkErlaubt?: boolean
  callback: (ergebnis: SchachtAnschlussErgebnis | null) => void
}

export type DruckExportModus = 'export' | 'druck'

export interface ModulFormularZustand {
  kennung: string
  formular: ZusatzmodulFormular
  fertig: (werte: Record<string, ZusatzmodulFeldWert> | null) => void
}

export interface BestaettigungZustand {
  titel: string
  nachricht: string
  bestaetigenText?: string
  destruktiv?: boolean
  alternative?: { text: string; callback: () => void }
  liste?: string[]
  ohneAbbrechen?: boolean
  callback: (bestaetigt: boolean) => void
}

export interface BlattDurchgangDialog {
  blattIds: string[]
  startBlattId: string
}

export type EinstellungenAustausch =
  { art: 'sichern' } | { art: 'einspielen'; sicherung: EinstellungsSicherung; dateiname: string }

export type UpdateDialogZustand =
  { art: 'frage'; anlass: 'start' | 'menue' } | { art: 'gefunden'; update: VerfuegbaresUpdate }

interface UiState {
  aktivesToolId: string
  rasterSichtbar: boolean
  snapAktiv: boolean
  wandStaerke: number
  bauteilVorgaben: BauteilVorgaben
  verlegeVorgaben: VerlegeVorgaben
  klemmenLeiste: string
  objektfangAktiv: boolean
  spurfangAktiv: boolean
  hintergrundfangAktiv: boolean
  wandfangAktiv: boolean
  auswahlIds: string[]
  klemmbrettGefuellt: boolean
  statusText: string | null
  touchBedienung: boolean
  kontextAktionen: KontextAktion[]
  seitenleisteSchwebePosition: { x: number; y: number }
  seitenleisteSchwebeGroesse: { breite: number; hoehe: number } | null
  kontextMenu: KontextMenuZustand | null
  eingabeDialog: EingabeDialogZustand | null
  gridVerteilenDialog: GridVerteilenDialogZustand | null
  anordnenDialog: { auswahlIds: string[] } | null
  verteilenAbstandDialog: VerteilenAbstandDialogZustand | null
  bestaetigung: BestaettigungZustand | null
  komponentenPicker: KomponentenPickerZustand | null
  trunkVerbindenDialog: TrunkVerbindenZustand | null
  hintergrundPdfImportDialog: HintergrundPdfImportZustand | null
  hintergrundIfcImportDialog: HintergrundIfcImportZustand | null
  hintergrundIfcNachladenDialog: HintergrundIfcNachladenZustand | null
  switchPortDialog: SwitchPortDialogZustand | null
  verteilerDialog: VerteilerDialogZustand | null
  knxAktorDialog: KnxAktorDialogZustand | null
  knxZuordnen: { blattId: string; objektId: string } | null
  raeumeVorschlagen: { blattId: string; objektId: string } | null
  verteilerplanErzeugen: VerteilerplanAssistentZiel | null
  schaltplanZuordnen: { blattId: string; objektId: string } | null
  schachtVerbundDialog: SchachtVerbundDialogZustand | null
  schachtAnschlussDialog: SchachtAnschlussDialogZustand | null
  inhaltDialog: InhaltDialogZustand | null
  verknuepfungDialog: VerknuepfungDialogZustand | null
  gruppeBildenDialog: GruppeBildenDialogZustand | null
  druckExportDialog: DruckExportModus | null
  zeichenflaecheEinrichtenOffen: boolean
  zeichenflaecheEinrichtenHintergrundEinpassen: boolean
  katalogDialogOffen: boolean
  kabeltypenDialogOffen: boolean
  installationszonenDialogOffen: boolean
  hintergrundAusblendungenDialogOffen: boolean
  ifcBauteilgruppenDialogOffen: boolean
  dreidDialogOffen: boolean
  ifcBauteileDialog: BlattDurchgangDialog | null
  ifcBauteileVorschau: BauteilVorlagen
  umwandelnDialog: BlattDurchgangDialog | null
  umwandelnVorschau: Objekt[]
  ifcAbweichungen: IfcAbweichungenZustand | null
  ebenenDialogOffen: boolean
  beschriftungGroesseOffen: boolean
  einstellungenAustausch: EinstellungenAustausch | null
  bauteilerkennungOffen: boolean
  erkennungsVorschau: Bauteilfunde
  erkennungsOptionen: BauteilOptionen
  erkennungsProbe: { a: Point; b: Point } | null
  erkennungsProbenart: Probenart
  teilstueckAuswahl: readonly Teilstueck[]
  erkennungsProbeStaerke: number | null
  erkennungsProbeFarbe: string | null
  plankopfDialogObjektId: string | null
  slotMatrixDialog: { blattId: string; objektId: string } | null
  bibliothekImportDialog: GeoeffnetesBibliothekPaket | null
  slotWahlDialog: SlotWahlDialogZustand | null
  leitungslisteKabeltypDialog: { kabelNummer: number } | null
  blattVerwaltungOffen: boolean
  blaetterAusrichtenOffen: boolean
  etageEinfuegen: EtagenRichtung | null
  etagenDialogOffen: boolean
  projekteDialogOffen: boolean
  einstellungenOffen: boolean
  einstellungenTab: string
  ueberDialogOffen: boolean
  lizenzenDialogOffen: boolean
  datenschutzDialogOffen: boolean
  einfuehrungDialog: { clipId: string } | null
  meineLizenzDialogOffen: boolean
  updateDialog: UpdateDialogZustand | null
  starthinweisErledigt: boolean
  tastenkuerzelDialogOffen: boolean
  handbuchDialog: { anker: string | null } | null
  handbuchKapitel: string | null
  fehlerprotokollDialogOffen: boolean
  moduleDialog: 'anzeigen' | 'entfernen' | null
  modulHinzufuegen: { datei: File; vorschau: ZusatzmodulVorschau } | null
  modulFormular: ModulFormularZustand | null
  datenschutzBestaetigungOffen: boolean
  eulaBestaetigungOffen: boolean
  toast: string | null
  offenesDokument: OffenesDokument | null
  hintergrundLadefortschritt: { erledigt: number; gesamt: number } | null
  speicherZustand: SpeicherZustand
  serverZustand: 'pruefe' | 'bereit' | 'nicht-erreichbar'
  produktlizenzStatus: ProduktlizenzStatus | null
  kiStatus: KiStatus | null
  kiBrueckeVerbunden: boolean
  kiProtokoll: { zeit: string; text: string }[]

  setAktivesToolId: (id: string) => void
  setRasterSichtbar: (v: boolean) => void
  toggleRaster: () => void
  toggleSnap: () => void
  setWandStaerke: (v: number) => void
  setKlemmenLeiste: (leiste: string) => void
  setBauteilVorgaben: (patch: Partial<BauteilVorgaben>) => void
  setVerlegeVorgaben: (patch: Partial<VerlegeVorgaben>) => void
  verlegeVorgabenZuruecksetzen: () => void
  toggleObjektfang: () => void
  toggleSpurfang: () => void
  toggleHintergrundfang: () => void
  toggleWandfang: () => void
  setAuswahlIds: (ids: string[]) => void
  setKlemmbrettGefuellt: (gefuellt: boolean) => void
  setStatusText: (t: string | null) => void
  setTouchBedienung: (v: boolean) => void
  setKontextAktionen: (a: KontextAktion[]) => void
  setSeitenleisteSchwebePosition: (p: { x: number; y: number }) => void
  setSeitenleisteSchwebeGroesse: (g: { breite: number; hoehe: number } | null) => void
  oeffneKontextMenu: (z: KontextMenuZustand) => void
  schliesseKontextMenu: () => void
  oeffneEingabeDialog: (
    optionen: EingabeDialogOptionen,
    callback: (wert: string | null, auswahl?: string, zweiteAuswahl?: string) => void,
  ) => void
  schliesseEingabeDialog: () => void
  oeffneGridVerteilenDialog: (
    standard: GridVerteilenDialogZustand['standard'],
    callback: GridVerteilenDialogZustand['callback'],
  ) => void
  schliesseGridVerteilenDialog: () => void
  oeffneAnordnenDialog: (auswahlIds: readonly string[]) => void
  schliesseAnordnenDialog: () => void
  oeffneVerteilenAbstandDialog: (
    titel: string,
    standardAbstand: number,
    callback: VerteilenAbstandDialogZustand['callback'],
  ) => void
  schliesseVerteilenAbstandDialog: () => void
  oeffneBestaetigung: (optionen: BestaettigungZustand) => void
  schliesseBestaetigung: () => void
  oeffneKomponentenPicker: (
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
      } | null,
    ) => void,
    optionen?: {
      filter?: 'switchPatchpanel' | 'betriebsmittel'
      titel?: string
      bestaetigenText?: string
      nurKatalogId?: string
    },
  ) => void
  schliesseKomponentenPicker: () => void
  oeffneTrunkVerbindenDialog: (
    von: TrunkEndeRef,
    callback: (ziel: TrunkEndeRef | null) => void,
  ) => void
  schliesseTrunkVerbindenDialog: () => void
  oeffneHintergrundPdfImportDialog: (
    sitzung: PdfImportSitzung,
    dateiname: string,
    callback: (ergebnis: HintergrundPdfImportErgebnis | null) => void,
  ) => void
  schliesseHintergrundPdfImportDialog: () => void
  oeffneHintergrundIfcImportDialog: (zustand: HintergrundIfcImportZustand) => void
  schliesseHintergrundIfcImportDialog: () => void
  oeffneHintergrundIfcNachladenDialog: (zustand: HintergrundIfcNachladenZustand) => void
  schliesseHintergrundIfcNachladenDialog: () => void
  oeffneSwitchPortDialog: (zustand: SwitchPortDialogZustand) => void
  schliesseSwitchPortDialog: () => void
  oeffneVerteilerDialog: (zustand: VerteilerDialogZustand) => void
  oeffneKnxAktorDialog: (zustand: KnxAktorDialogZustand) => void
  schliesseKnxAktorDialog: () => void
  setKnxZuordnen: (ziel: { blattId: string; objektId: string } | null) => void
  setRaeumeVorschlagen: (ziel: { blattId: string; objektId: string } | null) => void
  schliesseVerteilerDialog: () => void
  setVerteilerplanErzeugen: (ziel: VerteilerplanAssistentZiel | null) => void
  setSchaltplanZuordnen: (ziel: { blattId: string; objektId: string } | null) => void
  oeffneSchachtVerbundDialog: (zustand: SchachtVerbundDialogZustand) => void
  schliesseSchachtVerbundDialog: () => void
  oeffneSchachtAnschlussDialog: (zustand: SchachtAnschlussDialogZustand) => void
  schliesseSchachtAnschlussDialog: () => void
  oeffneInhaltDialog: (zustand: InhaltDialogZustand) => void
  schliesseInhaltDialog: () => void
  oeffneVerknuepfungDialog: (zustand: VerknuepfungDialogZustand) => void
  schliesseVerknuepfungDialog: () => void
  oeffneGruppeBildenDialog: (zustand: GruppeBildenDialogZustand) => void
  schliesseGruppeBildenDialog: () => void
  oeffneDruckExportDialog: (modus: DruckExportModus) => void
  schliesseDruckExportDialog: () => void
  setZeichenflaecheEinrichtenOffen: (v: boolean, hintergrundEinpassen?: boolean) => void
  setKatalogDialogOffen: (v: boolean) => void
  setKabeltypenDialogOffen: (v: boolean) => void
  setInstallationszonenDialogOffen: (v: boolean) => void
  setHintergrundAusblendungenDialogOffen: (v: boolean) => void
  setIfcBauteilgruppenDialogOffen: (v: boolean) => void
  setDreidDialogOffen: (v: boolean) => void
  setIfcBauteileDialog: (v: BlattDurchgangDialog | null) => void
  setIfcBauteileVorschau: (v: BauteilVorlagen) => void
  setUmwandelnDialog: (v: BlattDurchgangDialog | null) => void
  setUmwandelnVorschau: (v: Objekt[]) => void
  setIfcAbweichungen: (v: IfcAbweichungenZustand | null) => void
  setEbenenDialogOffen: (v: boolean) => void
  setBeschriftungGroesseOffen: (v: boolean) => void
  setEinstellungenAustausch: (v: EinstellungenAustausch | null) => void
  setBauteilerkennungOffen: (v: boolean) => void
  setErkennungsVorschau: (v: Bauteilfunde) => void
  setErkennungsOptionen: (v: BauteilOptionen) => void
  setErkennungsProbe: (v: { a: Point; b: Point } | null) => void
  setErkennungsProbenart: (v: Probenart) => void
  setTeilstueckAuswahl: (v: readonly Teilstueck[]) => void
  meldeErkennungsProbeStaerke: (staerke: number, farbe?: string | null) => void
  meldeErkennungsProbeOeffnung: (breite: number, farbe?: string | null) => void
  setPlankopfDialogObjektId: (v: string | null) => void
  setSlotMatrixDialog: (v: { blattId: string; objektId: string } | null) => void
  setBibliothekImportDialog: (v: GeoeffnetesBibliothekPaket | null) => void
  oeffneSlotWahlDialog: (zustand: SlotWahlDialogZustand) => void
  schliesseSlotWahlDialog: () => void
  oeffneLeitungslisteKabeltypDialog: (kabelNummer: number) => void
  schliesseLeitungslisteKabeltypDialog: () => void
  setBlattVerwaltungOffen: (v: boolean) => void
  setBlaetterAusrichtenOffen: (v: boolean) => void
  setEtageEinfuegen: (v: EtagenRichtung | null) => void
  setEtagenDialogOffen: (v: boolean) => void
  setProjekteDialogOffen: (v: boolean) => void
  setEinstellungenOffen: (v: boolean, tab?: string) => void
  setEinstellungenTab: (tab: string) => void
  setUeberDialogOffen: (v: boolean) => void
  setLizenzenDialogOffen: (v: boolean) => void
  setDatenschutzDialogOffen: (v: boolean) => void
  setEinfuehrungDialog: (v: { clipId: string } | null) => void
  setMeineLizenzDialogOffen: (v: boolean) => void
  setUpdateDialog: (v: UpdateDialogZustand | null) => void
  setStarthinweisErledigt: () => void
  setTastenkuerzelDialogOffen: (v: boolean) => void
  setHandbuchDialog: (v: { anker: string | null } | null) => void
  setHandbuchKapitel: (v: string) => void
  setFehlerprotokollDialogOffen: (v: boolean) => void
  setModuleDialog: (v: 'anzeigen' | 'entfernen' | null) => void
  setModulHinzufuegen: (v: { datei: File; vorschau: ZusatzmodulVorschau } | null) => void
  setModulFormular: (v: ModulFormularZustand | null) => void
  setDatenschutzBestaetigungOffen: (v: boolean) => void
  setEulaBestaetigungOffen: (v: boolean) => void
  zeigeToast: (text: string) => void
  setOffenesDokument: (dokument: OffenesDokument | null) => void
  setHintergrundLadefortschritt: (v: { erledigt: number; gesamt: number } | null) => void
  setSpeicherZustand: (zustand: SpeicherZustand) => void
  setServerZustand: (zustand: 'pruefe' | 'bereit' | 'nicht-erreichbar') => void
  setProduktlizenzStatus: (status: ProduktlizenzStatus | null) => void
  setKiStatus: (status: KiStatus | null) => void
  setKiBrueckeVerbunden: (verbunden: boolean) => void
  meldeKiAenderung: (text: string) => void
}

function grobeZeigerEingabe(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches)
}

const KI_PROTOKOLL_MAX = 200

export const useUiStore = create<UiState>((set) => ({
  aktivesToolId: 'auswahl',
  rasterSichtbar: true,
  snapAktiv: false,
  wandStaerke: STANDARD_WAND_STAERKE,
  klemmenLeiste: STANDARD_KLEMMENLEISTE,
  bauteilVorgaben: STANDARD_BAUTEIL_VORGABEN,
  verlegeVorgaben: STANDARD_VERLEGE_VORGABEN,
  objektfangAktiv: false,
  spurfangAktiv: false,
  hintergrundfangAktiv: true,
  wandfangAktiv: true,
  auswahlIds: [],
  klemmbrettGefuellt: false,
  statusText: null,
  touchBedienung: grobeZeigerEingabe(),
  kontextAktionen: [],
  seitenleisteSchwebePosition: { x: 16, y: 16 },
  seitenleisteSchwebeGroesse: null,
  kontextMenu: null,
  eingabeDialog: null,
  gridVerteilenDialog: null,
  anordnenDialog: null,
  verteilenAbstandDialog: null,
  bestaetigung: null,
  komponentenPicker: null,
  trunkVerbindenDialog: null,
  hintergrundPdfImportDialog: null,
  hintergrundIfcImportDialog: null,
  hintergrundIfcNachladenDialog: null,
  switchPortDialog: null,
  verteilerDialog: null,
  knxAktorDialog: null,
  knxZuordnen: null,
  raeumeVorschlagen: null,
  verteilerplanErzeugen: null,
  schaltplanZuordnen: null,
  schachtVerbundDialog: null,
  schachtAnschlussDialog: null,
  inhaltDialog: null,
  verknuepfungDialog: null,
  gruppeBildenDialog: null,
  druckExportDialog: null,
  zeichenflaecheEinrichtenOffen: false,
  zeichenflaecheEinrichtenHintergrundEinpassen: false,
  katalogDialogOffen: false,
  kabeltypenDialogOffen: false,
  installationszonenDialogOffen: false,
  hintergrundAusblendungenDialogOffen: false,
  ifcBauteilgruppenDialogOffen: false,
  dreidDialogOffen: false,
  ifcBauteileDialog: null,
  ifcBauteileVorschau: { waende: [], oeffnungen: [], treppen: [], raeume: [] },
  umwandelnDialog: null,
  umwandelnVorschau: [],
  ifcAbweichungen: null,
  ebenenDialogOffen: false,
  beschriftungGroesseOffen: false,
  einstellungenAustausch: null,
  bauteilerkennungOffen: false,
  erkennungsVorschau: { waende: [], oeffnungen: [], treppen: [] },
  erkennungsOptionen: STANDARD_WAND_ERKENNUNG,
  erkennungsProbe: null,
  erkennungsProbenart: 'wand',
  teilstueckAuswahl: [],
  erkennungsProbeStaerke: null,
  erkennungsProbeFarbe: null,
  plankopfDialogObjektId: null,
  slotMatrixDialog: null,
  bibliothekImportDialog: null,
  slotWahlDialog: null,
  leitungslisteKabeltypDialog: null,
  blattVerwaltungOffen: false,
  blaetterAusrichtenOffen: false,
  etageEinfuegen: null,
  etagenDialogOffen: false,
  projekteDialogOffen: false,
  einstellungenOffen: false,
  einstellungenTab: 'allgemein',
  ueberDialogOffen: false,
  datenschutzBestaetigungOffen: false,
  eulaBestaetigungOffen: false,
  lizenzenDialogOffen: false,
  datenschutzDialogOffen: false,
  einfuehrungDialog: null,
  meineLizenzDialogOffen: false,
  updateDialog: null,
  starthinweisErledigt: false,
  tastenkuerzelDialogOffen: false,
  handbuchDialog: null,
  handbuchKapitel: null,
  fehlerprotokollDialogOffen: false,
  moduleDialog: null,
  modulHinzufuegen: null,
  modulFormular: null,
  toast: null,
  offenesDokument: null,
  hintergrundLadefortschritt: null,
  speicherZustand: { art: 'ruht' },
  serverZustand: 'pruefe',
  produktlizenzStatus: null,
  kiStatus: null,
  kiBrueckeVerbunden: false,
  kiProtokoll: [],

  setAktivesToolId: (id) => set({ aktivesToolId: id }),
  setRasterSichtbar: (v) => set({ rasterSichtbar: v }),
  toggleRaster: () => set((s) => ({ rasterSichtbar: !s.rasterSichtbar })),
  toggleSnap: () => set((s) => ({ snapAktiv: !s.snapAktiv })),
  setWandStaerke: (v) => set({ wandStaerke: Math.max(WAND_STAERKE_MIN, v) }),
  setKlemmenLeiste: (leiste) => set({ klemmenLeiste: leiste.trim() || STANDARD_KLEMMENLEISTE }),
  setBauteilVorgaben: (patch) =>
    set((s) => ({ bauteilVorgaben: { ...s.bauteilVorgaben, ...patch } })),
  setVerlegeVorgaben: (patch) =>
    set((s) => {
      const neu: VerlegeVorgaben = { ...s.verlegeVorgaben, ...patch }
      for (const schluessel of Object.keys(neu) as (keyof VerlegeVorgaben)[])
        if (neu[schluessel] === undefined) delete neu[schluessel]
      return { verlegeVorgaben: neu }
    }),
  verlegeVorgabenZuruecksetzen: () => set({ verlegeVorgaben: STANDARD_VERLEGE_VORGABEN }),
  toggleObjektfang: () => set((s) => ({ objektfangAktiv: !s.objektfangAktiv })),
  toggleSpurfang: () => set((s) => ({ spurfangAktiv: !s.spurfangAktiv })),
  toggleHintergrundfang: () => set((s) => ({ hintergrundfangAktiv: !s.hintergrundfangAktiv })),
  toggleWandfang: () => set((s) => ({ wandfangAktiv: !s.wandfangAktiv })),
  setAuswahlIds: (ids) => set({ auswahlIds: ids }),
  setKlemmbrettGefuellt: (gefuellt) => set({ klemmbrettGefuellt: gefuellt }),
  setStatusText: (t) => set({ statusText: t }),
  setTouchBedienung: (v) => set({ touchBedienung: v }),
  setKontextAktionen: (a) =>
    set((s) => (gleicheKontextAktionen(s.kontextAktionen, a) ? s : { kontextAktionen: a })),
  setSeitenleisteSchwebePosition: (p) => set({ seitenleisteSchwebePosition: p }),
  setSeitenleisteSchwebeGroesse: (g) => set({ seitenleisteSchwebeGroesse: g }),
  oeffneKontextMenu: (z) => set({ kontextMenu: z }),
  schliesseKontextMenu: () => set({ kontextMenu: null }),
  oeffneEingabeDialog: (optionen, callback) => set({ eingabeDialog: { optionen, callback } }),
  schliesseEingabeDialog: () => set({ eingabeDialog: null }),
  oeffneGridVerteilenDialog: (standard, callback) =>
    set({ gridVerteilenDialog: { standard, callback } }),
  schliesseGridVerteilenDialog: () => set({ gridVerteilenDialog: null }),
  oeffneAnordnenDialog: (auswahlIds) => set({ anordnenDialog: { auswahlIds: [...auswahlIds] } }),
  schliesseAnordnenDialog: () => set({ anordnenDialog: null }),
  oeffneVerteilenAbstandDialog: (titel, standardAbstand, callback) =>
    set({ verteilenAbstandDialog: { titel, standardAbstand, callback } }),
  schliesseVerteilenAbstandDialog: () => set({ verteilenAbstandDialog: null }),
  oeffneBestaetigung: (optionen) => set({ bestaetigung: optionen }),
  schliesseBestaetigung: () => set({ bestaetigung: null }),
  oeffneKomponentenPicker: (callback, optionen) =>
    set({ komponentenPicker: { callback, ...optionen } }),
  schliesseKomponentenPicker: () => set({ komponentenPicker: null }),
  oeffneTrunkVerbindenDialog: (von, callback) => set({ trunkVerbindenDialog: { von, callback } }),
  schliesseTrunkVerbindenDialog: () => set({ trunkVerbindenDialog: null }),
  oeffneHintergrundPdfImportDialog: (sitzung, dateiname, callback) =>
    set({ hintergrundPdfImportDialog: { sitzung, dateiname, callback } }),
  schliesseHintergrundPdfImportDialog: () => set({ hintergrundPdfImportDialog: null }),
  oeffneHintergrundIfcImportDialog: (zustand) => set({ hintergrundIfcImportDialog: zustand }),
  schliesseHintergrundIfcImportDialog: () => set({ hintergrundIfcImportDialog: null }),
  oeffneHintergrundIfcNachladenDialog: (zustand) => set({ hintergrundIfcNachladenDialog: zustand }),
  schliesseHintergrundIfcNachladenDialog: () => set({ hintergrundIfcNachladenDialog: null }),
  oeffneSwitchPortDialog: (zustand) => set({ switchPortDialog: zustand }),
  schliesseSwitchPortDialog: () => set({ switchPortDialog: null }),
  oeffneVerteilerDialog: (zustand) => set({ verteilerDialog: zustand }),
  oeffneKnxAktorDialog: (zustand) => set({ knxAktorDialog: zustand }),
  schliesseKnxAktorDialog: () => set({ knxAktorDialog: null }),
  setKnxZuordnen: (ziel) => set({ knxZuordnen: ziel }),
  setRaeumeVorschlagen: (ziel) => set({ raeumeVorschlagen: ziel }),
  schliesseVerteilerDialog: () => set({ verteilerDialog: null }),
  setVerteilerplanErzeugen: (ziel) => set({ verteilerplanErzeugen: ziel }),
  setSchaltplanZuordnen: (ziel) => set({ schaltplanZuordnen: ziel }),
  oeffneSchachtVerbundDialog: (zustand) => set({ schachtVerbundDialog: zustand }),
  schliesseSchachtVerbundDialog: () => set({ schachtVerbundDialog: null }),
  oeffneSchachtAnschlussDialog: (zustand) => set({ schachtAnschlussDialog: zustand }),
  schliesseSchachtAnschlussDialog: () => set({ schachtAnschlussDialog: null }),
  oeffneInhaltDialog: (zustand) => set({ inhaltDialog: zustand }),
  schliesseInhaltDialog: () => set({ inhaltDialog: null }),
  oeffneVerknuepfungDialog: (zustand) => set({ verknuepfungDialog: zustand }),
  schliesseVerknuepfungDialog: () => set({ verknuepfungDialog: null }),
  oeffneGruppeBildenDialog: (zustand) => set({ gruppeBildenDialog: zustand }),
  schliesseGruppeBildenDialog: () => set({ gruppeBildenDialog: null }),
  oeffneDruckExportDialog: (modus) => set({ druckExportDialog: modus }),
  schliesseDruckExportDialog: () => set({ druckExportDialog: null }),
  setZeichenflaecheEinrichtenOffen: (v, hintergrundEinpassen = false) =>
    set({
      zeichenflaecheEinrichtenOffen: v,
      zeichenflaecheEinrichtenHintergrundEinpassen: v && hintergrundEinpassen,
    }),
  setKatalogDialogOffen: (v) => set({ katalogDialogOffen: v }),
  setKabeltypenDialogOffen: (v) => set({ kabeltypenDialogOffen: v }),
  setInstallationszonenDialogOffen: (v) => set({ installationszonenDialogOffen: v }),
  setHintergrundAusblendungenDialogOffen: (v) => set({ hintergrundAusblendungenDialogOffen: v }),
  setIfcBauteilgruppenDialogOffen: (v) => set({ ifcBauteilgruppenDialogOffen: v }),
  setDreidDialogOffen: (v) => set({ dreidDialogOffen: v }),
  setIfcBauteileDialog: (v) =>
    set(
      v
        ? { ifcBauteileDialog: v }
        : {
            ifcBauteileDialog: null,
            ifcBauteileVorschau: { waende: [], oeffnungen: [], treppen: [], raeume: [] },
          },
    ),
  setIfcBauteileVorschau: (v) => set({ ifcBauteileVorschau: v }),
  setUmwandelnDialog: (v) =>
    set(v ? { umwandelnDialog: v } : { umwandelnDialog: null, umwandelnVorschau: [] }),
  setUmwandelnVorschau: (v) => set({ umwandelnVorschau: v }),
  setIfcAbweichungen: (v) => set({ ifcAbweichungen: v }),
  setEbenenDialogOffen: (v) => set({ ebenenDialogOffen: v }),
  setBeschriftungGroesseOffen: (v) => set({ beschriftungGroesseOffen: v }),
  setEinstellungenAustausch: (v) => set({ einstellungenAustausch: v }),
  setBauteilerkennungOffen: (v) =>
    set(
      v
        ? { bauteilerkennungOffen: true }
        : {
            bauteilerkennungOffen: false,
            erkennungsVorschau: { waende: [], oeffnungen: [], treppen: [] },
            erkennungsProbe: null,
            erkennungsProbeStaerke: null,
            erkennungsProbeFarbe: null,
            erkennungsOptionen: STANDARD_WAND_ERKENNUNG,
          },
    ),
  setErkennungsVorschau: (v) => set({ erkennungsVorschau: v }),
  setErkennungsOptionen: (v) => set({ erkennungsOptionen: v }),
  setErkennungsProbe: (v) => set({ erkennungsProbe: v }),
  setErkennungsProbenart: (v) => set({ erkennungsProbenart: v }),
  setTeilstueckAuswahl: (v) => set({ teilstueckAuswahl: v }),
  meldeErkennungsProbeOeffnung: (breite, farbe) =>
    set((s) => ({
      erkennungsProbeStaerke: breite,
      erkennungsProbeFarbe: farbe ?? null,
      erkennungsOptionen: {
        ...s.erkennungsOptionen,
        oeffnungsBreiteMin: Math.max(0.3, breite * 0.5),
        oeffnungsBreiteMax: breite * 1.5,
      },
    })),
  meldeErkennungsProbeStaerke: (staerke, farbe) =>
    set((s) => ({
      erkennungsProbeStaerke: staerke,
      erkennungsProbeFarbe: farbe ?? null,
      erkennungsOptionen: {
        ...s.erkennungsOptionen,
        staerkeMin: Math.max(
          WAND_SUCHBEREICH_UNTERGRENZE,
          Math.min(s.erkennungsOptionen.staerkeMin, staerke * 0.5),
        ),
        staerkeMax: Math.min(
          WAND_SUCHBEREICH_OBERGRENZE,
          Math.max(s.erkennungsOptionen.staerkeMax, staerke * 2),
        ),
      },
    })),
  setPlankopfDialogObjektId: (v) => set({ plankopfDialogObjektId: v }),
  setSlotMatrixDialog: (v) => set({ slotMatrixDialog: v }),
  setBibliothekImportDialog: (v) => set({ bibliothekImportDialog: v }),
  oeffneSlotWahlDialog: (zustand) => set({ slotWahlDialog: zustand }),
  schliesseSlotWahlDialog: () => set({ slotWahlDialog: null }),
  oeffneLeitungslisteKabeltypDialog: (kabelNummer) =>
    set({ leitungslisteKabeltypDialog: { kabelNummer } }),
  schliesseLeitungslisteKabeltypDialog: () => set({ leitungslisteKabeltypDialog: null }),
  setBlattVerwaltungOffen: (v) => set({ blattVerwaltungOffen: v }),
  setBlaetterAusrichtenOffen: (v) => set({ blaetterAusrichtenOffen: v }),
  setEtageEinfuegen: (v) => set({ etageEinfuegen: v }),
  setEtagenDialogOffen: (v) => set({ etagenDialogOffen: v }),
  setProjekteDialogOffen: (v) => set({ projekteDialogOffen: v }),
  setEinstellungenOffen: (v, tab) =>
    set(tab ? { einstellungenOffen: v, einstellungenTab: tab } : { einstellungenOffen: v }),
  setEinstellungenTab: (tab) => set({ einstellungenTab: tab }),
  setUeberDialogOffen: (v) => set({ ueberDialogOffen: v }),
  setLizenzenDialogOffen: (v) => set({ lizenzenDialogOffen: v }),
  setDatenschutzDialogOffen: (v) => set({ datenschutzDialogOffen: v }),
  setEinfuehrungDialog: (v) => set({ einfuehrungDialog: v }),
  setMeineLizenzDialogOffen: (v) => set({ meineLizenzDialogOffen: v }),
  setUpdateDialog: (v) => set({ updateDialog: v }),
  setStarthinweisErledigt: () => set({ starthinweisErledigt: true }),
  setTastenkuerzelDialogOffen: (v) => set({ tastenkuerzelDialogOffen: v }),
  setHandbuchDialog: (v) => set({ handbuchDialog: v }),
  setHandbuchKapitel: (v) => set({ handbuchKapitel: v }),
  setFehlerprotokollDialogOffen: (v) => set({ fehlerprotokollDialogOffen: v }),
  setModuleDialog: (v) => set({ moduleDialog: v }),
  setModulHinzufuegen: (v) => set({ modulHinzufuegen: v }),
  setModulFormular: (v) => set({ modulFormular: v }),
  setDatenschutzBestaetigungOffen: (v) => set({ datenschutzBestaetigungOffen: v }),
  setEulaBestaetigungOffen: (v) => set({ eulaBestaetigungOffen: v }),
  setOffenesDokument: (dokument) => set({ offenesDokument: dokument }),
  setHintergrundLadefortschritt: (v) => set({ hintergrundLadefortschritt: v }),
  setSpeicherZustand: (zustand) => set({ speicherZustand: zustand }),
  setServerZustand: (zustand) => set({ serverZustand: zustand }),
  setProduktlizenzStatus: (status) => set({ produktlizenzStatus: status }),
  setKiStatus: (status) => set({ kiStatus: status }),
  setKiBrueckeVerbunden: (verbunden) => set({ kiBrueckeVerbunden: verbunden }),
  meldeKiAenderung: (text) => {
    set((s) => ({
      kiProtokoll: [{ zeit: new Date().toISOString(), text }, ...s.kiProtokoll].slice(
        0,
        KI_PROTOKOLL_MAX,
      ),
    }))
    useUiStore.getState().zeigeToast(text)
  },
  zeigeToast: (text) => {
    set({ toast: text })
    window.setTimeout(() => {
      set((s) => (s.toast === text ? { toast: null } : {}))
    }, 3200)
  },
}))

export function istModalerDialogOffen(s: UiState = useUiStore.getState()): boolean {
  return (
    s.eingabeDialog !== null ||
    s.gridVerteilenDialog !== null ||
    s.verteilenAbstandDialog !== null ||
    s.bestaetigung !== null ||
    s.komponentenPicker !== null ||
    s.trunkVerbindenDialog !== null ||
    s.hintergrundPdfImportDialog !== null ||
    s.hintergrundIfcImportDialog !== null ||
    s.hintergrundIfcNachladenDialog !== null ||
    s.switchPortDialog !== null ||
    s.verteilerDialog !== null ||
    s.knxAktorDialog !== null ||
    s.knxZuordnen !== null ||
    s.raeumeVorschlagen !== null ||
    s.verteilerplanErzeugen !== null ||
    s.schaltplanZuordnen !== null ||
    s.schachtVerbundDialog !== null ||
    s.schachtAnschlussDialog !== null ||
    s.inhaltDialog !== null ||
    s.verknuepfungDialog !== null ||
    s.gruppeBildenDialog !== null ||
    s.katalogDialogOffen ||
    s.kabeltypenDialogOffen ||
    s.installationszonenDialogOffen ||
    s.hintergrundAusblendungenDialogOffen ||
    s.ifcBauteilgruppenDialogOffen ||
    s.dreidDialogOffen ||
    s.ebenenDialogOffen ||
    s.blattVerwaltungOffen ||
    s.blaetterAusrichtenOffen ||
    s.etageEinfuegen !== null ||
    s.etagenDialogOffen ||
    s.einstellungenOffen ||
    s.ueberDialogOffen ||
    s.lizenzenDialogOffen ||
    s.datenschutzDialogOffen ||
    s.einfuehrungDialog !== null ||
    s.meineLizenzDialogOffen ||
    s.updateDialog !== null ||
    s.tastenkuerzelDialogOffen ||
    s.handbuchDialog !== null ||
    s.fehlerprotokollDialogOffen ||
    s.moduleDialog !== null ||
    s.modulHinzufuegen !== null ||
    s.modulFormular !== null ||
    s.datenschutzBestaetigungOffen ||
    s.eulaBestaetigungOffen ||
    s.druckExportDialog !== null ||
    s.projekteDialogOffen ||
    s.zeichenflaecheEinrichtenOffen ||
    s.beschriftungGroesseOffen ||
    s.einstellungenAustausch !== null ||
    s.plankopfDialogObjektId !== null ||
    s.slotMatrixDialog !== null ||
    s.bibliothekImportDialog !== null ||
    s.slotWahlDialog !== null
  )
}
