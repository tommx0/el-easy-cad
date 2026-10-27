import { useRef } from 'react'
import type { ReactNode } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import type {
  Blatt,
  BoundingBox,
  HintergrundDxf,
  HintergrundIfc,
  HintergrundPdf,
  Objekt,
  Point,
  Zeichnungsart,
} from '../document-model'
import {
  DocumentStore,
  ermittleLeitungsVerknuepfung,
  leitungsVerknuepfungsHinweis,
  getBoundingBox,
  unionBoundingBox,
  berechneHintergrundEinpassung,
  berechneZeichenflaecheFuerPlan,
  erzeugeBlatt,
  geschossAusIfc,
  dupliziereObjekte,
  alleVerteiler,
  erzeugeZeichnung,
  festerRasterSchritt,
  istSchaltplan,
  kombinationsFaktor,
  neueresRegelwerk,
  nurAnsichtGrund,
  setzeAktivesRegelwerk,
  setzeKombinationsFaktor,
  vergleicheIfcBauteile,
  zaehleVerwaisteTeilstueckZonen,
  ZUSATZMODUL_KI_VORSATZ,
} from '../document-model'
import type { Command, ToolContext } from '../tools'
import {
  CommandStack,
  CompositeCommand,
  UmgewandeltErsetzenCommand,
  ToolManager,
  erzeugeBlattAendernCommand,
  erzeugeBlaetterHinzufuegenCommand,
  erzeugeObjektAendernCommand,
  erzeugeObjekteEntfernenCommand,
  erzeugeZeichnungAendernCommand,
  frageLoeschung,
  erzeugeStandardWerkzeuge,
  erzeugeZoomFensterTool,
  erzeugeZusatzmodulAbfrageTool,
  ZUSATZMODUL_ABFRAGE_TOOL_ID,
  erzeugeKatalogStandCommand,
  erzeugeKombinationsFaktorCommand,
  hintergrundFangObjekte,
} from '../tools'
import {
  ViewTransform,
  baueHintergrundIfc,
  baueHintergrundPdf,
  ermittlePdfInhalt,
  ermittleGridSchritte,
  bestimmeHintergrundDateityp,
  importiereDxfHintergrund,
  holeAbgangsTexte,
  holeKnxBeschriftungen,
  holeAbgangsRaeume,
  holeSwitchAnzeigeDaten,
  ladeAlleHintergrundBitmaps,
  oeffneGespeicherteIfc,
  oeffneIfcFuerImport,
  oeffnePdfFuerImport,
  type IfcHuellenAuftrag,
  type IfcImportSitzung,
} from '../rendering'
import {
  DateinameErforderlichError,
  HttpCatalogStore,
  HttpKabeltypStore,
  HttpInstallationszonenStore,
  HttpDokumentStore,
  HttpProjektStore,
  LokalerZeichnungsDateiStore,
  ProjektZeichnungenLeser,
  HttpSettingsStore,
  uebernehmeAlteEinstellungen,
  assetUrl,
  holeProduktlizenzStatus,
  holeServerStatus,
  importiereProduktlizenz,
  holeAssetBlob,
  ladeAssetHoch,
  ladeRegelwerk,
  MITGELIEFERTES_REGELWERK,
  optional,
  type ZuletztBearbeitet,
} from '../persistence'
import {
  bauteileAufsBlatt,
  huelleVonEntities,
  richteEntitiesAus,
  verketteLage,
  verschiebeEntities,
  type IfcHuelle,
} from '../ifc'
import { DokumentSitzung } from './dokument-sitzung'
import { fuehreZurZeichenflaecheDesNeuenPlans } from './blatt-anlegen'
import {
  bauplanZeichnungen,
  tabellenVerknuepfung,
  Verknuepfung,
  verteilerplanZeichnungen,
} from './verknuepfung'
import { hintergrundFangRaster } from './hintergrund-fang-quelle'
import {
  alsPlansprache,
  alsVerteilerplan,
  alsZeichnungsart,
  neueZeichnungDialogOptionen,
} from './neue-zeichnung'
import { useUiStore } from './store/ui-store'
import { hinweisFuerKatalogAuswahl, hinweisFuerWerkzeug, zeigeHilfeHinweis } from './hilfe-hinweise'
import type { IfcBauteileJeBlatt } from './ifc-bauteile'
import { bereiteIfcBauteileAuf } from './ifc-bauteile'
import { meldeNurAnsicht, nurAnsichtMeldung } from './nur-ansicht'
import { freigeschalteteModule, hatModul } from './lizenz-module'
import { erzeugeKiKontext, ladeKiStatus, verbindeKiSchnittstelle } from './ki-anbindung'
import { erzeugeZusatzmodulWirt } from './zusatzmodule/anbindung'
import type { ZusatzmodulWirt } from './zusatzmodule/wirt'
import type {
  HintergrundIfcImportErgebnis,
  IfcAbweichungenZustand,
  IfcNachladeErgebnis,
} from './store/ui-store'
import { useKatalogStore } from './store/katalog-store'
import { useKabeltypStore } from './store/kabeltyp-store'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { gleicheKabeltypenAb, nichtImBestand } from './kabeltyp-abgleich'
import { gleicheInstallationszonenAb, zonenNichtImBestand } from './installationszonen-abgleich'
import { useSettingsStore } from './store/settings-store'
import { istBemassungVariante } from './bemassung-varianten'
import { uebernehmeSlots } from './slots-uebernehmen'
import { VIDEOS } from './handbuch/videos'
import { AppContext } from './use-app-context'
import { verbindeSpracheMitEinstellungen } from './sprache-anbindung'
import { t } from '../sprache'
import type { Sprache } from '../sprache'
import { planspracheVon, planUebersetzer } from '../document-model'
import { hinweisAktiv } from './community'

const SERVER_START_VERSUCHE = 6
const SERVER_WARTE_MS = 400

export interface KameraZustand {
  scale: number
  offset: Point
}

class RedrawSignal {
  private listeners = new Set<() => void>()
  request() {
    for (const l of this.listeners) l()
  }
  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }
}

export interface AppKontext {
  doc: DocumentStore
  commands: CommandStack
  toolManager: ToolManager
  view: ViewTransform
  toolContext: ToolContext
  overlaySignal: RedrawSignal
  zeichnungsDateiStore: LokalerZeichnungsDateiStore
  catalogStore: HttpCatalogStore
  kabeltypStore: HttpKabeltypStore
  installationszonenStore: HttpInstallationszonenStore
  projektStore: HttpProjektStore
  dokumentStore: HttpDokumentStore
  settingsStore: HttpSettingsStore
  sitzung: DokumentSitzung
  verknuepfung: Verknuepfung
  kameraProBlatt: Map<string, KameraZustand>
  canvasGroesse: { breite: number; hoehe: number }
  aktiviereTool: (id: string) => void
  kopiereAuswahl: () => void
  fuegeEin: () => void
  ausschneiden: () => void
  hatKlemmbrettInhalt: () => boolean
  neueZeichnung: () => void
  oeffneDokument: (
    dokumentId: string,
    neueZeichnungsart?: Zeichnungsart,
    neuePlansprache?: Sprache,
  ) => Promise<void>
  zuletztBearbeitet: () => Promise<ZuletztBearbeitet[]>
  speichern: () => Promise<void>
  exportiereAlsDatei: () => Promise<void>
  importiereAusDatei: () => Promise<void>
  pruefeServer: () => Promise<void>
  importiereHintergrundDatei: (datei: File) => Promise<void>
  ladeIfcFassungNach: (datei: File) => Promise<void>
  leseIfcBauteile: (
    blattIds: readonly string[],
    beiFortschritt?: (gelesen: number, gesamt: number) => void,
    beiBlatt?: (eintrag: IfcBauteileJeBlatt) => void,
  ) => {
    ergebnis: Promise<IfcBauteileJeBlatt[]>
    abbrechen: () => void
  }
  leseIfcHuelle: (
    blaetter: readonly { blattId: string; kote: number }[],
    ursprung: Point,
    beiFortschritt?: (gelesen: number, gesamt: number) => void,
  ) => {
    ergebnis: Promise<Map<string, IfcHuelle>>
    abbrechen: () => void
  }
  importiereProduktlizenzDatei: (rohdaten: unknown) => Promise<void>
  zusatzmodule: ZusatzmodulWirt
}

export function AppProvider({ children }: { children: ReactNode }) {
  const kontextRef = useRef<AppKontext | null>(null)
  if (!kontextRef.current) {
    kontextRef.current = erzeugeAppKontext()
  }
  return <AppContext.Provider value={kontextRef.current}>{children}</AppContext.Provider>
}

function erzeugeAppKontext(): AppKontext {
  const doc = new DocumentStore(erzeugeZeichnung('Zeichnung'))
  const commands = new CommandStack()
  const sperrgrundAktivesBlatt = () => {
    const blatt = doc.getBlatt(doc.getZeichnung().aktivesBlattId)
    return blatt ? nurAnsichtGrund(blatt, freigeschalteteModule()) : null
  }
  commands.setzeSperre(sperrgrundAktivesBlatt, () =>
    useUiStore.getState().zeigeToast(nurAnsichtMeldung()),
  )
  let verwaisteZonen = 0
  commands.subscribe(() => {
    const jetzt = zaehleVerwaisteTeilstueckZonen(doc.getZeichnung())
    const neu = jetzt - verwaisteZonen
    verwaisteZonen = jetzt
    if (neu > 0 && commands.canUndo())
      useUiStore.getState().zeigeToast(t('aktionen.app.teilstueckZoneVerloren', { n: neu }))
  })
  const view = new ViewTransform()
  const overlaySignal = new RedrawSignal()
  const zeichnungsDateiStore = new LokalerZeichnungsDateiStore()
  const catalogStore = new HttpCatalogStore()
  const kabeltypStore = new HttpKabeltypStore()
  const installationszonenStore = new HttpInstallationszonenStore()
  const projektStore = new HttpProjektStore()
  const dokumentStore = new HttpDokumentStore()
  const settingsStore = new HttpSettingsStore()
  const sitzung = new DokumentSitzung(doc, commands, dokumentStore, projektStore)
  const verknuepfung = new Verknuepfung(new ProjektZeichnungenLeser(dokumentStore))
  function aktualisiereVerknuepfung() {
    const offen = sitzung.getOffenesDokument()
    const zeichnung = doc.getZeichnung()
    void verknuepfung.aktualisiere(
      offen?.typ === 'zeichnung'
        ? {
            projektId: offen.projektId,
            dokumentId: offen.dokumentId,
            zeichnungsart: zeichnung.zeichnungsart,
            verteilerKennzeichen: zeichnung.verteilerKennzeichen,
          }
        : null,
    )
  }
  let verknuepftesKennzeichen = doc.getZeichnung().verteilerKennzeichen
  doc.subscribe(() => {
    const jetzt = doc.getZeichnung().verteilerKennzeichen
    if (jetzt === verknuepftesKennzeichen) return
    verknuepftesKennzeichen = jetzt
    aktualisiereVerknuepfung()
  })
  const kiKontext = erzeugeKiKontext({
    doc,
    commands,
    catalogStore,
    sitzung,
    verknuepfung,
    aktivesWerkzeug: () => toolManager.getAktivesToolId(),
    oeffneDokument: (dokumentId) => oeffneDokument(dokumentId),
  })
  const zusatzmodule = erzeugeZusatzmodulWirt({
    doc,
    commands,
    kiKontext,
    app: () => kontext,
  })
  verbindeKiSchnittstelle(kiKontext, (aufruf) =>
    aufruf.werkzeug.startsWith(ZUSATZMODUL_KI_VORSATZ)
      ? zusatzmodule.fuehreFuerKiAus(aufruf)
      : null,
  )
  const kameraProBlatt = new Map<string, KameraZustand>()
  const canvasGroesse = { breite: 0, hoehe: 0 }
  let klemmbrett: Objekt[] = []
  function setzeKlemmbrett(objekte: Objekt[]) {
    klemmbrett = objekte
    useUiStore.getState().setKlemmbrettGefuellt(objekte.length > 0)
  }
  let zuletztOffenesDokument: string | null = null

  sitzung.subscribe(() => {
    useUiStore.getState().setOffenesDokument(sitzung.getOffenesDokument())
    useUiStore.getState().setSpeicherZustand(sitzung.getZustand())

    const jetztOffen = sitzung.getOffenesDokument()?.dokumentId ?? null
    if (jetztOffen !== zuletztOffenesDokument) {
      zuletztOffenesDokument = jetztOffen
      kameraProBlatt.clear()
      verknuepftesKennzeichen = doc.getZeichnung().verteilerKennzeichen
      aktualisiereVerknuepfung()
    }
  })

  useSettingsStore.subscribe((zustand) => {
    const alt = kombinationsFaktor()
    if (zustand.kombinationsFaktor === alt) return
    setzeKombinationsFaktor(zustand.kombinationsFaktor)
    const command = erzeugeKombinationsFaktorCommand(doc, alt, (faktor) =>
      useSettingsStore.getState().setKombinationsFaktor(settingsStore, faktor),
    )
    if (command) commands.execute(command)
  })

  verbindeSpracheMitEinstellungen()

  const einstellungenGeladen = uebernehmeAlteEinstellungen(settingsStore)
    .then(() => useSettingsStore.getState().laden(settingsStore))
    .catch(() => undefined)

  async function pruefeServer(versuche = 1): Promise<boolean> {
    for (let versuch = 0; versuch < versuche; versuch++) {
      try {
        await holeServerStatus()
        useUiStore.getState().setServerZustand('bereit')
        useUiStore.getState().setProduktlizenzStatus(await holeProduktlizenzStatus())
        return true
      } catch {
        if (versuch < versuche - 1) {
          await new Promise((fertig) => setTimeout(fertig, SERVER_WARTE_MS))
        }
      }
    }
    useUiStore.getState().setServerZustand('nicht-erreichbar')
    return false
  }

  void (async () => {
    if (!(await pruefeServer(SERVER_START_VERSUCHE))) return
    try {
      setzeAktivesRegelwerk(
        neueresRegelwerk(MITGELIEFERTES_REGELWERK, await optional(() => ladeRegelwerk())),
      )
      await useKatalogStore.getState().laden(catalogStore)
      await useKabeltypStore.getState().laden(kabeltypStore)
      await optional(() => useInstallationszonenStore.getState().laden(installationszonenStore))
      await ladeKiStatus()
      await zusatzmodule.laden()
      const gesichert = await catalogStore.holeUmstellungsHinweis()
      if (gesichert.length > 0) {
        useUiStore
          .getState()
          .zeigeToast(
            t('aktionen.app.katalogeSchreibgeschuetzt', { kataloge: gesichert.join(', ') }),
          )
      }
      await einstellungenGeladen
      if (useSettingsStore.getState().einfuehrungBeimStartZeigen && VIDEOS.length > 0) {
        useUiStore.getState().setEinfuehrungDialog({ clipId: '' })
      }
      useUiStore.getState().setProjekteDialogOffen(true)
    } catch (fehler) {
      useUiStore
        .getState()
        .zeigeToast(fehler instanceof Error ? fehler.message : t('aktionen.app.startFehler'))
    }
  })()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void sitzung.speichereJetzt()
    }
  })

  function aktiviereTool(id: string) {
    toolManager.aktiviere(id)
    useUiStore.getState().setAktivesToolId(id)
    if (istBemassungVariante(id))
      useSettingsStore.getState().setBemassungVariante(settingsStore, id)
  }

  const toolContext: ToolContext = {
    view,
    doc,
    commands,
    verknuepfteZeichnungen: () => tabellenVerknuepfung(verknuepfung.getStand()),
    bekannteVerteilerKennzeichen: () =>
      verknuepfung
        .getStand()
        .verteilerplaene.map((p) => p.zeichnung.verteilerKennzeichen)
        .filter((k): k is string => !!k),
    aktiveEbeneId: () => doc.getAktivesBlatt().aktiveEbeneId,
    aktivesBlattId: () => doc.getZeichnung().aktivesBlattId,
    istSnapAktiv: () => useUiStore.getState().snapAktiv,
    wandStaerke: () => useUiStore.getState().wandStaerke,
    klemmenLeiste: () => useUiStore.getState().klemmenLeiste,
    leitungVerknuepfen: (blattId, leitungId) => {
      if (!useSettingsStore.getState().verknuepfungNachLeitung) return
      const zeichnung = doc.getZeichnung()
      const katalog = useKatalogStore.getState().komponenten
      if (ermittleLeitungsVerknuepfung(zeichnung, katalog, blattId, leitungId)) {
        useUiStore.getState().oeffneVerknuepfungDialog({ blattId, leitungId })
        return
      }
      const hinweis = leitungsVerknuepfungsHinweis(zeichnung, katalog, blattId, leitungId)
      if (hinweis) useUiStore.getState().zeigeToast(hinweis)
    },
    slotsUebernehmen: (quelle, slots) => uebernehmeSlots(doc, commands, quelle, slots),
    setWandStaerke: (wert) => useUiStore.getState().setWandStaerke(wert),
    bauteilVorgaben: () => useUiStore.getState().bauteilVorgaben,
    setBauteilVorgaben: (patch) => useUiStore.getState().setBauteilVorgaben(patch),
    verlegeVorgaben: () => useUiStore.getState().verlegeVorgaben,
    zonenZugewiesen: () => gleicheInstallationszonenAb(doc),
    erkennungsVorschau: () => useUiStore.getState().erkennungsVorschau,
    ifcBauteileVorschau: () => useUiStore.getState().ifcBauteileVorschau,
    umwandelnVorschau: () => useUiStore.getState().umwandelnVorschau,
    erkennungsProbenart: () => useUiStore.getState().erkennungsProbenart,
    meldeErkennungsProbe: (a, b) => useUiStore.getState().setErkennungsProbe({ a, b }),
    meldeTeilstueckAuswahl: (stuecke) => useUiStore.getState().setTeilstueckAuswahl(stuecke),
    gridSchritt: () =>
      ermittleGridSchritte(
        view.scale,
        useSettingsStore.getState().gridBasisSchritt,
        festerRasterSchritt(doc.getZeichnung()),
      ).neben,
    routingSettings: () => useSettingsStore.getState().routing,
    leitungenErstNachLoslassen: () => useSettingsStore.getState().leitungenErstNachLoslassen,
    wandfangAktiv: () => useUiStore.getState().wandfangAktiv,
    hintergrundLinienBei: (punkt, toleranz) => {
      if (!useUiStore.getState().hintergrundfangAktiv) return []
      const raster = hintergrundFangRaster(doc.getAktivesBlatt(), () => overlaySignal.request())
      if (!raster) return []
      return hintergrundFangObjekte(raster, punkt, toleranz).flatMap((o) =>
        o.type === 'linie' ? [{ a: o.start, b: o.ende }] : [],
      )
    },
    installationshoehenVorgabenCm: () => useSettingsStore.getState().installationshoehenVorgabenCm,
    pfeiltastenSchritte: () => useSettingsStore.getState().pfeiltastenSchritte,
    getCanvasGroesse: () => canvasGroesse,
    requestOverlayRedraw: () => overlaySignal.request(),
    setStatus: (t) => useUiStore.getState().setStatusText(t),
    zurueckZuAuswahl: () => aktiviereTool('auswahl'),
    getAuswahl: () => useUiStore.getState().auswahlIds,
    setAuswahl: (ids) => useUiStore.getState().setAuswahlIds(ids),
    oeffneEingabeDialog: (optionen, callback) =>
      useUiStore.getState().oeffneEingabeDialog(optionen, callback),
    katalogKomponenten: () => useKatalogStore.getState().komponenten,
    komponentenRenderKontext: () => {
      const katalogKomponenten = useKatalogStore.getState().komponenten
      const blatt = doc.getAktivesBlatt()
      const switchDaten = holeSwitchAnzeigeDaten(
        doc.getZeichnung(),
        katalogKomponenten,
        verteilerplanZeichnungen(verknuepfung.getStand()),
      )
      return {
        tp: planUebersetzer(doc.getZeichnung()),
        plansprache: planspracheVon(doc.getZeichnung()),
        katalogKomponenten,
        catalogStore,
        aufNeuZeichnenAnfordern: () => overlaySignal.request(),
        poeSummen: switchDaten.poeSummen,
        traegerMitModulen: switchDaten.traegerMitModulen,
        traegerVollBelegt: switchDaten.traegerVollBelegt,
        querverweisTexte: switchDaten.querverweisTexte,
        knxKanalVerweise: switchDaten.knxKanalVerweise,
        stromkreisTexte: switchDaten.stromkreisTexte,
        blattverweise: switchDaten.blattverweise,
        abgangsTexte: doc.getZeichnung().verteilerKennzeichen
          ? holeAbgangsTexte(
              doc.getZeichnung(),
              bauplanZeichnungen(verknuepfung.getStand()),
              katalogKomponenten,
            )
          : undefined,
        abgangsRaeume: doc.getZeichnung().verteilerKennzeichen
          ? holeAbgangsRaeume(doc.getZeichnung())
          : undefined,
        knxBeschriftungen: doc.getZeichnung().verteilerKennzeichen
          ? holeKnxBeschriftungen(doc.getZeichnung(), bauplanZeichnungen(verknuepfung.getStand()))
          : undefined,
        tabellenKontext: blatt
          ? {
              zeichnung: doc.getZeichnung(),
              blattId: blatt.id,
              katalog: katalogKomponenten,
              ...tabellenVerknuepfung(verknuepfung.getStand()),
            }
          : undefined,
        blattAnzeige: blatt,
        alleObjekteAufBlatt: blatt?.objekte ?? [],
        schaltplan: istSchaltplan(doc.getZeichnung()),
      }
    },
    oeffneKomponentenPicker: (callback, optionen) =>
      useUiStore.getState().oeffneKomponentenPicker(callback, optionen),
    komponenteGewaehlt: (auswahl) => {
      const hinweis = hinweisFuerKatalogAuswahl(auswahl)
      if (hinweis) zeigeHilfeHinweis(hinweis)
    },
    oeffneBestaetigung: (optionen) => useUiStore.getState().oeffneBestaetigung(optionen),
    oeffneTrunkVerbindenDialog: (von, callback) =>
      useUiStore.getState().oeffneTrunkVerbindenDialog(von, callback),
    oeffneSwitchPortDialog: (optionen, callback) =>
      useUiStore.getState().oeffneSwitchPortDialog({
        quelle: optionen.quelle,
        modus: optionen.modus ?? 'zuweisen',
        vorauswahl: optionen.vorauswahl ?? null,
        schachtErlaubt: optionen.schachtErlaubt ?? false,
        callback,
      }),
    oeffneVerteilerDialog: (optionen, callback) =>
      useUiStore
        .getState()
        .oeffneVerteilerDialog({ ...optionen, modus: optionen.modus ?? 'zuweisen', callback }),
    oeffneKnxAktorDialog: (optionen, callback) =>
      useUiStore.getState().oeffneKnxAktorDialog({ ...optionen, callback }),
    oeffnePlankopfDialog: (objektId) => useUiStore.getState().setPlankopfDialogObjektId(objektId),
    oeffneLeitungslisteKabeltypDialog: (kabelNummer) =>
      useUiStore.getState().oeffneLeitungslisteKabeltypDialog(kabelNummer),
    oeffneSchachtVerbundDialog: (optionen, callback) =>
      useUiStore.getState().oeffneSchachtVerbundDialog({
        titel: optionen.titel,
        aktuellerVerbundId: optionen.aktuellerVerbundId ?? null,
        geschosshoehe: optionen.geschosshoehe,
        callback,
      }),
    oeffneSchachtAnschlussDialog: (optionen, callback) =>
      useUiStore.getState().oeffneSchachtAnschlussDialog({
        blattId: optionen.blattId,
        schachtId: optionen.schachtId,
        art: optionen.art,
        objektId: optionen.objektId ?? null,
        trunkErlaubt: optionen.trunkErlaubt,
        callback,
      }),
    oeffneSlotWahlDialog: (optionen, callback) =>
      useUiStore.getState().oeffneSlotWahlDialog({
        blattId: optionen.blattId,
        objektId: optionen.objektId,
        callback,
      }),
  }

  const toolManager = new ToolManager(toolContext, 'auswahl')
  toolManager.setzeSperre(
    () =>
      sperrgrundAktivesBlatt() !== null ||
      (commands.sammeltGerade() && toolManager.getAktivesToolId() !== ZUSATZMODUL_ABFRAGE_TOOL_ID),
  )
  for (const tool of erzeugeStandardWerkzeuge()) toolManager.registriere(tool)
  toolManager.registriere(erzeugeZoomFensterTool())
  toolManager.registriere(erzeugeZusatzmodulAbfrageTool())
  toolManager.initialisiere()
  let letztesWerkzeug = toolManager.getAktivesToolId()
  toolManager.subscribe(() => {
    const id = toolManager.getAktivesToolId()
    if (id === letztesWerkzeug) return
    letztesWerkzeug = id
    const hinweis = hinweisFuerWerkzeug(id)
    if (hinweis) zeigeHilfeHinweis(hinweis)
  })

  function kopiereAuswahl() {
    const ids = useUiStore.getState().auswahlIds
    if (ids.length === 0) return
    const blatt = doc.getAktivesBlatt()
    const objekte = blatt.objekte.filter((o) => ids.includes(o.id))
    if (objekte.length > 0) setzeKlemmbrett(objekte)
  }

  function fuegeEin() {
    if (klemmbrett.length === 0) return
    const versatz: Point = { x: view.laengeToWorld(24), y: -view.laengeToWorld(24) }
    const zeichnung = doc.getZeichnung()
    const { kopien, neueGruppen } = dupliziereObjekte(klemmbrett, versatz, zeichnung)

    const blattId = zeichnung.aktivesBlattId
    const vorabCommands: Command[] =
      neueGruppen.length === 0
        ? []
        : [
            erzeugeZeichnungAendernCommand(doc, t('aktionen.app.einfuegen'), {
              geraeteGruppen: [...zeichnung.geraeteGruppen, ...neueGruppen],
            }),
          ]
    const einfuegenCommand = erzeugeObjektAendernCommand(
      doc,
      blattId,
      t('aktionen.app.einfuegen'),
      (objekte) => [...objekte, ...kopien],
    )
    commands.execute(
      new CompositeCommand(t('aktionen.app.einfuegen'), [...vorabCommands, einfuegenCommand]),
    )
    useUiStore.getState().setAuswahlIds(kopien.map((k) => k.id))
    setzeKlemmbrett(kopien)
  }

  function ausschneiden() {
    const ids = useUiStore.getState().auswahlIds
    if (ids.length === 0) return
    const blattId = doc.getZeichnung().aktivesBlattId
    frageLoeschung(useUiStore.getState().oeffneBestaetigung, doc, blattId, ids, (bestaetigt) => {
      if (!bestaetigt) return
      kopiereAuswahl()
      commands.execute(
        erzeugeObjekteEntfernenCommand(
          doc,
          blattId,
          ids,
          t('aktionen.app.ausschneiden', { n: ids.length }),
        ),
      )
      useUiStore.getState().setAuswahlIds([])
    })
  }

  function neueZeichnung() {
    const offen = sitzung.getOffenesDokument()
    if (!offen) {
      useUiStore.getState().setProjekteDialogOffen(true)
      return
    }
    const mitPlan = new Set(
      verknuepfung.getStand().verteilerplaene.map((p) => p.zeichnung.verteilerKennzeichen),
    )
    const zeichnungJetzt = doc.getZeichnung()
    const verteilerOhnePlan =
      offen.typ === 'zeichnung' && zeichnungJetzt.zeichnungsart === 'bauplan'
        ? alleVerteiler(zeichnungJetzt)
            .map((v) => v.verteiler.verteiler?.kennzeichen ?? '')
            .filter((k) => k && !mitPlan.has(k))
        : []
    useUiStore
      .getState()
      .oeffneEingabeDialog(
        neueZeichnungDialogOptionen('Zeichnung', verteilerOhnePlan),
        (wert, auswahl, sprachwahl) => {
          if (wert === null) return
          const plansprache = alsPlansprache(sprachwahl)
          void (async () => {
            try {
              const name = wert.trim() || 'Zeichnung'
              const fuerVerteiler = alsVerteilerplan(auswahl)
              const dokument = fuerVerteiler
                ? await sitzung.legeZeichnungAn(offen.projektId, {
                    ...erzeugeZeichnung(name, 'schaltplan', plansprache),
                    verteilerKennzeichen: fuerVerteiler,
                  })
                : await dokumentStore.lege(offen.projektId, { typ: 'zeichnung', name })
              const neu = await sitzung.oeffne(dokument.id, alsZeichnungsart(auswahl), plansprache)
              useUiStore.getState().setAuswahlIds([])
              useUiStore.getState().verlegeVorgabenZuruecksetzen()
              if (neu) fuehreZurZeichenflaecheDesNeuenPlans(doc)
              useUiStore
                .getState()
                .zeigeToast(t('aktionen.app.zeichnungAngelegt', { name: dokument.name }))
            } catch (fehler) {
              meldeFehler(fehler, t('aktionen.app.anlegenFehler'))
            }
          })()
        },
      )
  }

  function meldeFehler(fehler: unknown, ersatz: string) {
    useUiStore.getState().zeigeToast(fehler instanceof Error ? fehler.message : ersatz)
  }

  function zieheKatalogStandNach(): string[] {
    const katalog = new Map(useKatalogStore.getState().komponenten.map((k) => [k.id, k]))
    const ergebnis = erzeugeKatalogStandCommand(
      doc,
      katalog,
      useSettingsStore.getState().routing,
      freigeschalteteModule(),
    )
    if (!ergebnis.command) return []
    commands.execute(ergebnis.command)
    const meldungen = [t('aktionen.app.katalogstand', { n: ergebnis.aktualisiert })]
    if (ergebnis.abgedockt.length > 0) {
      meldungen.push(t('aktionen.app.abgedockt', { n: ergebnis.abgedockt.length }))
    }
    if (ergebnis.fehlgeschlageneLeitungenAnzahl > 0) {
      meldungen.push(
        t('aktionen.app.nichtNeuVerlegt', { n: ergebnis.fehlgeschlageneLeitungenAnzahl }),
      )
    }
    for (const konflikt of ergebnis.kennzeichenKonflikte) {
      meldungen.push(t('aktionen.app.kennzeichenKonflikt', { wert: konflikt.wert }))
    }
    return meldungen
  }

  async function oeffneDokument(
    dokumentId: string,
    neueZeichnungsart?: Zeichnungsart,
    neuePlansprache?: Sprache,
  ) {
    try {
      const neu = await sitzung.oeffne(dokumentId, neueZeichnungsart, neuePlansprache)
      useUiStore.getState().setAuswahlIds([])
      useUiStore.getState().verlegeVorgabenZuruecksetzen()
      const offen = sitzung.getOffenesDokument()
      const unbekannt = offen?.typ === 'zeichnung' ? nichtImBestand(doc) : []
      if (offen?.typ === 'zeichnung') gleicheKabeltypenAb(doc)
      const unbekannteZonen = offen?.typ === 'zeichnung' ? zonenNichtImBestand(doc) : []
      if (offen?.typ === 'zeichnung') gleicheInstallationszonenAb(doc, { aufraeumen: true })
      const meldungen = [
        offen
          ? t('aktionen.app.geoeffnet', { name: offen.name })
          : t('aktionen.app.dokumentGeoeffnet'),
      ]
      if (offen?.typ === 'zeichnung') meldungen.push(...zieheKatalogStandNach())
      if (unbekannt.length > 0) {
        meldungen.push(t('aktionen.app.kabeltypenUnbekannt', { n: unbekannt.length }))
      }
      if (unbekannteZonen.length > 0) {
        meldungen.push(t('aktionen.app.zonenUnbekannt', { n: unbekannteZonen.length }))
      }
      if (
        offen?.typ === 'zeichnung' &&
        doc.getZeichnung().herkunftTestversion === true &&
        !hinweisAktiv(useUiStore.getState().produktlizenzStatus)
      ) {
        meldungen.push(t('community.hinweis.herkunft'))
      }
      useUiStore.getState().zeigeToast(meldungen.join(' '))
      if (neu) fuehreZurZeichenflaecheDesNeuenPlans(doc)
      void ladeHintergruendeAllerBlaetterVor()
    } catch (fehler) {
      meldeFehler(fehler, t('aktionen.app.oeffnenFehler'))
    }
  }

  async function ladeHintergruendeAllerBlaetterVor() {
    try {
      await ladeAlleHintergrundBitmaps(doc.getZeichnung().blaetter, assetUrl, (erledigt, gesamt) =>
        useUiStore.getState().setHintergrundLadefortschritt({ erledigt, gesamt }),
      )
    } finally {
      useUiStore.getState().setHintergrundLadefortschritt(null)
    }
  }

  function zuletztBearbeitet(): Promise<ZuletztBearbeitet[]> {
    return dokumentStore.zuletztBearbeitet(10)
  }

  async function speichern() {
    const erzwingen = useUiStore.getState().speicherZustand.art === 'konflikt'
    await sitzung.speichereJetzt(erzwingen)
    const zustand = sitzung.getZustand()
    if (zustand.art === 'gespeichert')
      useUiStore.getState().zeigeToast(t('aktionen.app.gespeichert'))
    else if (zustand.art === 'fehler') useUiStore.getState().zeigeToast(zustand.nachricht)
  }

  function zeichnungFuerDateiExport() {
    const zeichnung = doc.getZeichnung()
    if (!hinweisAktiv(useUiStore.getState().produktlizenzStatus)) return zeichnung
    return { ...zeichnung, herkunftTestversion: true }
  }

  async function exportiereAlsDatei() {
    try {
      const zeichnung = zeichnungFuerDateiExport()
      const ok = await zeichnungsDateiStore.speichernUnter(zeichnung)
      if (ok) useUiStore.getState().zeigeToast(t('aktionen.app.dateiExportiert'))
    } catch (fehler) {
      if (fehler instanceof DateinameErforderlichError) {
        frageDateinamenUndExportiere(fehler.vorschlag)
        return
      }
      meldeFehler(fehler, t('aktionen.app.exportFehler'))
    }
  }

  function frageDateinamenUndExportiere(vorschlag: string) {
    useUiStore.getState().oeffneEingabeDialog(
      {
        titel: t('aktionen.app.dateiExportierenTitel'),
        label: t('aktionen.app.dateiname'),
        anfangswert: vorschlag,
      },
      (wert) => {
        if (wert === null) return
        void (async () => {
          try {
            await zeichnungsDateiStore.speichereMitDateiname(zeichnungFuerDateiExport(), wert)
            useUiStore.getState().zeigeToast(t('aktionen.app.dateiExportiert'))
          } catch (fehler) {
            meldeFehler(fehler, t('aktionen.app.exportFehler'))
          }
        })()
      },
    )
  }

  async function importiereAusDatei() {
    const offen = sitzung.getOffenesDokument()
    if (!offen) {
      useUiStore.getState().setProjekteDialogOffen(true)
      return
    }
    try {
      const geladen = await zeichnungsDateiStore.oeffnenDialog()
      if (!geladen) return
      const dokument = await dokumentStore.lege(offen.projektId, {
        typ: 'zeichnung',
        name: geladen.name || 'Importierte Zeichnung',
      })
      await sitzung.oeffne(dokument.id)
      doc.ersetzeZeichnung(geladen)
      await sitzung.speichereJetzt()
      useUiStore.getState().setAuswahlIds([])
      useUiStore.getState().verlegeVorgabenZuruecksetzen()
      useUiStore.getState().zeigeToast(t('aktionen.app.importiert', { name: dokument.name }))
    } catch (fehler) {
      meldeFehler(fehler, t('aktionen.app.importFehler'))
    }
  }

  function meldeHintergrundFehler(fehler: unknown) {
    useUiStore
      .getState()
      .zeigeToast(fehler instanceof Error ? fehler.message : t('aktionen.app.hintergrundFehler'))
  }

  function platziereHintergrund(hintergrund: HintergrundPdf | HintergrundDxf, dateiname: string) {
    const blattId = doc.getZeichnung().aktivesBlattId
    const zeichenflaeche = doc.getBlatt(blattId)?.zeichenflaeche ?? null
    const platzierung = zeichenflaeche
      ? berechneHintergrundEinpassung(hintergrund, zeichenflaeche)
      : { massstab: 1, ursprung: { x: 0, y: 0 } }
    commands.execute(
      erzeugeBlattAendernCommand(doc, blattId, t('aktionen.app.hintergrundLaden'), {
        hintergrund,
        massstab: platzierung.massstab,
        ursprung: platzierung.ursprung,
        hintergrundDrehung: undefined,
      }),
    )
    useUiStore.getState().setRasterSichtbar(false)
    if (zeichenflaeche) {
      useUiStore.getState().zeigeToast(t('aktionen.app.hintergrundKalibrieren', { dateiname }))
    } else {
      useUiStore.getState().setZeichenflaecheEinrichtenOffen(true, true)
      useUiStore.getState().zeigeToast(t('aktionen.app.hintergrundZeichenflaeche', { dateiname }))
    }
  }

  function legeIfcGeschosseAn(sitzung: IfcImportSitzung, ergebnis: HintergrundIfcImportErgebnis) {
    const zeichnung = doc.getZeichnung()
    const aktiv = doc.getBlatt(zeichnung.aktivesBlattId)
    const vorlage = aktiv?.zeichenflaeche ?? null
    const eintraege = [
      ...ergebnis.geschosse.map((g, index) => ({
        index,
        name: g.name,
        hoehe: g.kote,
        geschoss: {
          name: g.name,
          kote: g.kote,
          ifcGuid: g.guid,
          ...(ergebnis.grundrisse.geschosse[index].raumhoehe !== undefined
            ? { raumhoehe: ergebnis.grundrisse.geschosse[index].raumhoehe }
            : {}),
        },
        freieHoehe: undefined as number | undefined,
      })),
      ...ergebnis.freieSchnitte.map((f, i) => ({
        index: ergebnis.geschosse.length + i,
        name: f.name,
        hoehe: f.hoehe,
        geschoss: { name: f.name },
        freieHoehe: f.hoehe as number | undefined,
      })),
    ].sort((a, b) => a.hoehe - b.hoehe)
    const felder = eintraege.map((e) => {
      const huelle = ergebnis.grundrisse.geschosse[e.index].huelle
      return {
        hintergrund: baueHintergrundIfc(
          sitzung,
          ergebnis.grundrisse,
          e.index,
          ergebnis.schnitthoehe,
          e.freieHoehe,
          ergebnis.ausgeblendeteGruppen,
        ),
        massstab: 1,
        ursprung: { x: 0, y: 0 },
        hintergrundDrehung: undefined,
        zeichenflaeche: huelle ? berechneZeichenflaecheFuerPlan(huelle, vorlage) : null,
        geschoss: e.geschoss,
      } satisfies Partial<Blatt>
    })

    if (felder.length === 1 && aktiv && aktiv.objekte.length > 0) {
      starteIfcAusrichten(sitzung, ergebnis, eintraege[0], felder[0], aktiv.id)
      return
    }
    if (felder.length === 1 && aktiv) {
      commands.execute(
        erzeugeBlattAendernCommand(doc, aktiv.id, t('aktionen.app.ifcGeschossLaden'), {
          ...felder[0],
          geschoss: geschossAusIfc(felder[0].geschoss, aktiv.geschoss),
        }),
      )
    } else {
      const blaetter = eintraege.map((e, i) => ({
        ...erzeugeBlatt(e.name, zeichnung.zeichnungsart, planUebersetzer(zeichnung)),
        ...felder[i],
      }))
      const command = erzeugeBlaetterHinzufuegenCommand(
        doc,
        blaetter,
        blaetter.length === 1
          ? t('aktionen.app.ifcGeschossLaden')
          : t('aktionen.app.ifcGeschosseLaden', { n: blaetter.length }),
      )
      if (command) commands.execute(command)
    }
    useUiStore.getState().setRasterSichtbar(false)
    useUiStore
      .getState()
      .zeigeToast(
        felder.length === 1
          ? t('aktionen.app.geschossGeladen', { name: eintraege[0].name, datei: sitzung.dateiname })
          : t('aktionen.app.geschosseGeladen', { n: felder.length, datei: sitzung.dateiname }),
      )
  }

  async function ladeIfcFassungNach(datei: File) {
    if (!hatModul(useUiStore.getState().produktlizenzStatus, 'bim')) return
    const ifcBlaetter = doc.getZeichnung().blaetter.filter((b) => b.hintergrund?.typ === 'ifc')
    if (ifcBlaetter.length === 0) {
      useUiStore.getState().zeigeToast(t('aktionen.app.keinIfcBlatt'))
      return
    }
    try {
      useUiStore.getState().zeigeToast(t('aktionen.app.wirdGeoeffnet', { name: datei.name }))
      const sitzung = await oeffneIfcFuerImport(datei, (blob, name) => ladeAssetHoch(blob, name))
      useUiStore.getState().oeffneHintergrundIfcNachladenDialog({
        sitzung,
        blaetter: ifcBlaetter.flatMap((b) =>
          b.hintergrund?.typ === 'ifc'
            ? [
                {
                  blattId: b.id,
                  blattName: b.name,
                  geschossName: b.geschoss?.name,
                  ifcGuid: b.geschoss?.ifcGuid,
                  freieHoehe: b.hintergrund.freieHoehe,
                  schnitthoehe: b.hintergrund.schnitthoehe,
                  lage: b.hintergrund.lage,
                  bauteileVergleichen: b.objekte.some((o) => o.ifcGuid !== undefined),
                },
              ]
            : [],
        ),
        callback: (ergebnis) => {
          if (ergebnis) frageUmgewandeltUndWendeAn(sitzung, ergebnis)
        },
      })
    } catch (fehler) {
      meldeHintergrundFehler(fehler)
    }
  }

  function leseIfcBauteile(
    blattIds: readonly string[],
    beiFortschritt?: (gelesen: number, gesamt: number) => void,
    beiBlatt?: (eintrag: IfcBauteileJeBlatt) => void,
  ) {
    let sitzung: IfcImportSitzung | null = null
    let abgebrochen = false
    const abbruchFehler = () => new Error(t('aktionen.app.abgebrochen'))
    const ergebnis = (async (): Promise<IfcBauteileJeBlatt[]> => {
      const erstes = blattIds.length > 0 ? doc.getBlatt(blattIds[0]) : undefined
      const h = erstes?.hintergrund
      if (!erstes || h?.typ !== 'ifc') throw new Error(t('aktionen.app.blattOhneIfc'))
      if (!h.assetId) throw new Error(t('aktionen.app.ifcDateiFehlt'))
      const daten = await holeAssetBlob(h.assetId)
      if (abgebrochen) throw abbruchFehler()
      sitzung = await oeffneGespeicherteIfc(daten, h.dateiname, h.assetId)
      if (abgebrochen) throw abbruchFehler()

      const jeBlatt: IfcBauteileJeBlatt[] = []
      const melde = (eintrag: IfcBauteileJeBlatt) => {
        jeBlatt.push(eintrag)
        beiBlatt?.(eintrag)
      }
      for (const blattId of blattIds) {
        beiFortschritt?.(jeBlatt.length, blattIds.length)
        const blatt = doc.getBlatt(blattId)
        const bh = blatt?.hintergrund
        if (!blatt || bh?.typ !== 'ifc' || bh.assetId !== h.assetId) {
          melde({ blattId, fehler: t('aktionen.app.blattAnderesModell') })
          continue
        }
        let ziel: { geschossId: number } | { freieHoehe: number }
        if (bh.freieHoehe !== undefined) {
          ziel = { freieHoehe: bh.freieHoehe }
        } else {
          const guid = blatt.geschoss?.ifcGuid
          const name = blatt.geschoss?.name
          const gleichnamig = sitzung.geschosse.filter((g) => g.name === name)
          const geschoss =
            sitzung.geschosse.find((g) => guid && g.guid === guid) ??
            (gleichnamig.length === 1 ? gleichnamig[0] : undefined)
          if (!geschoss) {
            melde({
              blattId,
              fehler: t('aktionen.app.geschossNichtGefunden'),
            })
            continue
          }
          ziel = { geschossId: geschoss.expressId }
        }
        const funde = await sitzung.bauteile({ ziel, schnitthoehe: bh.schnitthoehe })
        if (abgebrochen) throw abbruchFehler()
        const aktuell = doc.getBlatt(blattId)
        if (!aktuell || aktuell.hintergrund?.typ !== 'ifc') {
          melde({ blattId, fehler: t('aktionen.app.blattOhneIfcMehr') })
          continue
        }
        melde({
          blattId,
          ergebnis: bereiteIfcBauteileAuf(funde, { ...aktuell, hintergrund: aktuell.hintergrund }),
        })
      }
      beiFortschritt?.(jeBlatt.length, blattIds.length)
      return jeBlatt
    })().finally(() => sitzung?.schliesse())
    return {
      ergebnis,
      abbrechen: () => {
        abgebrochen = true
        sitzung?.schliesse()
      },
    }
  }

  function leseIfcHuelle(
    blaetter: readonly { blattId: string; kote: number }[],
    ursprung: Point,
    beiFortschritt?: (gelesen: number, gesamt: number) => void,
  ) {
    const sitzungen: IfcImportSitzung[] = []
    let abgebrochen = false
    const ergebnis = (async (): Promise<Map<string, IfcHuelle>> => {
      const jeAsset = new Map<string, { dateiname: string; eintraege: IfcHuellenAuftrag[] }>()
      for (const { blattId, kote } of blaetter) {
        const blatt = doc.getBlatt(blattId)
        const h = blatt?.hintergrund
        if (!blatt || h?.typ !== 'ifc' || !h.assetId || h.freieHoehe !== undefined) continue
        const gruppe = jeAsset.get(h.assetId) ?? { dateiname: h.dateiname, eintraege: [] }
        gruppe.eintraege.push({
          schluessel: blattId,
          ...(blatt.geschoss?.ifcGuid ? { geschossGuid: blatt.geschoss.ifcGuid } : {}),
          ...(blatt.geschoss?.name ? { geschossName: blatt.geschoss.name } : {}),
          kote,
        })
        jeAsset.set(h.assetId, gruppe)
      }
      const gesamt = [...jeAsset.values()].reduce((n, g) => n + g.eintraege.length, 0)
      const netze = new Map<string, IfcHuelle>()
      let erledigt = 0
      for (const [assetId, { dateiname, eintraege }] of jeAsset) {
        const daten = await holeAssetBlob(assetId)
        if (abgebrochen) break
        const sitzung = await oeffneGespeicherteIfc(daten, dateiname, assetId)
        sitzungen.push(sitzung)
        if (abgebrochen) break
        const ergebnisse = await sitzung.huelle(eintraege, ursprung, (fertig) =>
          beiFortschritt?.(erledigt + fertig, gesamt),
        )
        sitzung.schliesse()
        erledigt += eintraege.length
        for (const e of ergebnisse) if ('huelle' in e) netze.set(e.schluessel, e.huelle)
      }
      return netze
    })().finally(() => sitzungen.forEach((s) => s.schliesse()))
    return {
      ergebnis,
      abbrechen: () => {
        abgebrochen = true
        sitzungen.forEach((s) => s.schliesse())
      },
    }
  }

  function frageUmgewandeltUndWendeAn(sitzung: IfcImportSitzung, ergebnis: IfcNachladeErgebnis) {
    const betroffen = ergebnis.blaetter
      .map((e) => doc.getBlatt(e.blattId))
      .filter((b): b is Blatt => b?.hintergrund?.typ === 'ifc' && !!b.hintergrund.umgewandelt)
    if (betroffen.length === 0) {
      wendeIfcFassungAn(sitzung, ergebnis, [])
      return
    }
    const objekte = betroffen.reduce(
      (summe, b) => summe + b.objekte.filter((o) => o.ausHintergrund === 'ifc').length,
      0,
    )
    useUiStore.getState().oeffneBestaetigung({
      titel: t('aktionen.app.ersetzenTitel'),
      nachricht:
        betroffen.length === 1
          ? t('aktionen.app.ersetzenEinBlatt', { name: betroffen[0].name, linien: objekte })
          : t('aktionen.app.ersetzenBlaetter', { blaetter: betroffen.length, linien: objekte }),
      bestaetigenText: t('aktionen.app.ersetzen'),
      destruktiv: true,
      callback: (bestaetigt) => {
        if (bestaetigt) {
          wendeIfcFassungAn(
            sitzung,
            ergebnis,
            betroffen.map((b) => b.id),
          )
        }
      },
    })
  }

  function wendeIfcFassungAn(
    sitzung: IfcImportSitzung,
    ergebnis: IfcNachladeErgebnis,
    umgewandelteBlattIds: readonly string[],
  ) {
    const einzeln: Command[] = []
    for (const eintrag of ergebnis.blaetter) {
      const blatt = doc.getBlatt(eintrag.blattId)
      if (!blatt || blatt.hintergrund?.typ !== 'ifc') continue
      const huelle = eintrag.grundriss.huelle
      const hintergrund: HintergrundIfc = {
        ...blatt.hintergrund,
        dateiname: sitzung.dateiname,
        assetId: sitzung.assetId,
        datenUrl: null,
        entities: eintrag.grundriss.entities,
        bauteile: eintrag.grundriss.bauteile,
        breiteRoh: Math.max(huelle?.max.x ?? 0, 1),
        hoeheRoh: Math.max(huelle?.max.y ?? 0, 1),
      }
      const geschoss = eintrag.geschoss
        ? {
            ...blatt.geschoss,
            name: eintrag.geschoss.name,
            kote: eintrag.geschoss.kote,
            ifcGuid: eintrag.geschoss.guid,
            ...(blatt.geschoss?.raumhoehe === undefined && eintrag.grundriss.raumhoehe !== undefined
              ? { raumhoehe: eintrag.grundriss.raumhoehe }
              : {}),
          }
        : blatt.geschoss
      einzeln.push(
        erzeugeBlattAendernCommand(doc, blatt.id, t('aktionen.app.neueIfcFassung'), {
          hintergrund,
          geschoss,
        }),
      )
    }
    if (einzeln.length === 0) return
    const anzahlBlaetter = einzeln.length
    if (umgewandelteBlattIds.length > 0) {
      einzeln.push(new UmgewandeltErsetzenCommand(doc, umgewandelteBlattIds))
    }
    commands.execute(
      new CompositeCommand(
        anzahlBlaetter === 1
          ? t('aktionen.app.neueIfcFassung')
          : t('aktionen.app.neueIfcFassungMehrere', { n: anzahlBlaetter }),
        einzeln,
      ),
    )
    useUiStore
      .getState()
      .zeigeToast(
        anzahlBlaetter === 1
          ? t('aktionen.app.neuGeladenEins', { datei: sitzung.dateiname })
          : t('aktionen.app.neuGeladen', { n: anzahlBlaetter, datei: sitzung.dateiname }),
      )
    zeigeIfcAbweichungen(sitzung.dateiname, ergebnis)
  }

  function zeigeIfcAbweichungen(dateiname: string, ergebnis: IfcNachladeErgebnis) {
    const blaetter: IfcAbweichungenZustand['blaetter'] = []
    for (const eintrag of ergebnis.blaetter) {
      const blatt = doc.getBlatt(eintrag.blattId)
      if (!eintrag.bauteile || !blatt || blatt.hintergrund?.typ !== 'ifc') continue
      const neu = bauteileAufsBlatt(eintrag.bauteile, blatt.hintergrund.lage, blatt)
      const eintraege = vergleicheIfcBauteile(blatt.objekte, neu)
      if (eintraege.length > 0)
        blaetter.push({ blattId: blatt.id, blattName: blatt.name, eintraege })
    }
    useUiStore.getState().setIfcAbweichungen(blaetter.length > 0 ? { dateiname, blaetter } : null)
  }

  function starteIfcAusrichten(
    sitzung: IfcImportSitzung,
    ergebnis: HintergrundIfcImportErgebnis,
    eintrag: { index: number; name: string },
    felder: { hintergrund: HintergrundIfc; geschoss: Blatt['geschoss'] },
    blattId: string,
  ) {
    const grundriss = ergebnis.grundrisse.geschosse[eintrag.index]
    const vorschauMitte = view.screenToWorld({
      x: canvasGroesse.breite / 2,
      y: canvasGroesse.hoehe / 2,
    })
    const vorschauHuelle = huelleVonEntities(grundriss.entities)
    if (vorschauHuelle) {
      const halb = {
        x: (vorschauHuelle.max.x - vorschauHuelle.min.x) / 2,
        y: (vorschauHuelle.max.y - vorschauHuelle.min.y) / 2,
      }
      let bereich: BoundingBox = {
        min: { x: vorschauMitte.x - halb.x, y: vorschauMitte.y - halb.y },
        max: { x: vorschauMitte.x + halb.x, y: vorschauMitte.y + halb.y },
      }
      for (const objekt of doc.getBlatt(blattId)?.objekte ?? []) {
        bereich = unionBoundingBox(bereich, getBoundingBox(objekt))
      }
      window.dispatchEvent(new CustomEvent('eleasycad:einpassen', { detail: bereich }))
    }
    useUiStore.getState().setAktivesToolId('ifc-ausrichten')
    toolManager.aktiviere('ifc-ausrichten', {
      art: 'ifc-ausrichten',
      auftrag: {
        entities: grundriss.entities,
        vorschauMitte,
        uebernehmen: (ausrichtung) => {
          const welt = richteEntitiesAus(grundriss.entities, ausrichtung)
          const huelle = huelleVonEntities(welt)
          const abzug = huelle?.min ?? { x: 0, y: 0 }
          const hintergrund: HintergrundIfc = {
            ...felder.hintergrund,
            lage: verketteLage(ergebnis.grundrisse.lage, ausrichtung, abzug),
            entities: verschiebeEntities(welt, abzug),
            breiteRoh: Math.max((huelle?.max.x ?? 0) - abzug.x, 1),
            hoeheRoh: Math.max((huelle?.max.y ?? 0) - abzug.y, 1),
          }
          commands.execute(
            erzeugeBlattAendernCommand(doc, blattId, t('aktionen.app.geschossZuordnen'), {
              hintergrund,
              massstab: 1,
              ursprung: abzug,
              hintergrundDrehung: undefined,
              geschoss: geschossAusIfc(felder.geschoss, doc.getBlatt(blattId)?.geschoss),
            }),
          )
          useUiStore.getState().zeigeToast(
            t('aktionen.app.geschossZugeordnet', {
              name: eintrag.name,
              datei: sitzung.dateiname,
            }),
          )
        },
      },
    })
  }

  async function importiereIfcHintergrund(datei: File) {
    useUiStore.getState().zeigeToast(t('aktionen.app.wirdGeoeffnet', { name: datei.name }))
    const sitzung = await oeffneIfcFuerImport(datei, (blob, name) => ladeAssetHoch(blob, name))
    const zeichnung = doc.getZeichnung()
    const vorhandene = zeichnung.blaetter
      .map((b) => b.hintergrund)
      .find((h) => h?.typ === 'ifc' && h.assetId === sitzung.assetId)
    useUiStore.getState().oeffneHintergrundIfcImportDialog({
      sitzung,
      lageVorgabe: vorhandene?.typ === 'ifc' ? vorhandene.lage : null,
      aktuellesBlattLeer: (doc.getBlatt(zeichnung.aktivesBlattId)?.objekte.length ?? 0) === 0,
      callback: (ergebnis) => {
        if (!ergebnis) return
        try {
          legeIfcGeschosseAn(sitzung, ergebnis)
        } catch (fehler) {
          meldeHintergrundFehler(fehler)
        }
      },
    })
  }

  function pruefeHintergrundDateityp(dateiname: string): 'pdf' | 'dxf' | 'ifc' {
    const bim = hatModul(useUiStore.getState().produktlizenzStatus, 'bim')
    let dateityp: 'pdf' | 'dxf' | 'ifc'
    try {
      dateityp = bestimmeHintergrundDateityp(dateiname)
    } catch (fehler) {
      if (!bim) throw fehler
      throw new Error(t('aktionen.app.nurPdfDxfIfc'), {
        cause: fehler,
      })
    }
    if (dateityp === 'ifc' && !bim) {
      throw new Error(t('aktionen.app.nurPdfDxf'))
    }
    return dateityp
  }

  async function importiereHintergrundDatei(datei: File) {
    if (istSchaltplan(doc.getZeichnung())) {
      useUiStore.getState().zeigeToast(t('aktionen.app.schaltplanOhneHintergrund'))
      return
    }
    const aktiv = doc.getBlatt(doc.getZeichnung().aktivesBlattId)
    if (meldeNurAnsicht(aktiv)) return
    try {
      const dateityp = pruefeHintergrundDateityp(datei.name)
      if (dateityp === 'ifc') {
        await importiereIfcHintergrund(datei)
        return
      }
      if (dateityp === 'dxf') {
        const hintergrund = await importiereDxfHintergrund(datei, (blob, name) =>
          ladeAssetHoch(blob, name),
        )
        platziereHintergrund(hintergrund, datei.name)
        return
      }
      const sitzung = await oeffnePdfFuerImport(datei, (blob, name) => ladeAssetHoch(blob, name))
      useUiStore.getState().oeffneHintergrundPdfImportDialog(sitzung, datei.name, (ergebnis) => {
        if (!ergebnis) return
        const ausschnitt = {
          offset: ergebnis.ausschnittOffset,
          breiteRoh: ergebnis.breiteRoh,
          hoeheRoh: ergebnis.hoeheRoh,
        }
        void ermittlePdfInhalt(sitzung.dokument, ergebnis.seite, ausschnitt).then((inhalt) => {
          try {
            const hintergrund = baueHintergrundPdf(
              sitzung,
              datei.name,
              ergebnis.seite,
              ausschnitt,
              inhalt,
            )
            platziereHintergrund(hintergrund, datei.name)
          } catch (fehler) {
            meldeHintergrundFehler(fehler)
          }
        })
      })
    } catch (fehler) {
      meldeHintergrundFehler(fehler)
    }
  }

  const kontext: AppKontext = {
    doc,
    commands,
    toolManager,
    view,
    toolContext,
    overlaySignal,
    zeichnungsDateiStore,
    catalogStore,
    kabeltypStore,
    installationszonenStore,
    projektStore,
    dokumentStore,
    settingsStore,
    sitzung,
    verknuepfung,
    kameraProBlatt,
    canvasGroesse,
    aktiviereTool,
    kopiereAuswahl,
    fuegeEin,
    ausschneiden,
    hatKlemmbrettInhalt: () => klemmbrett.length > 0,
    neueZeichnung,
    oeffneDokument,
    zuletztBearbeitet,
    speichern,
    exportiereAlsDatei,
    importiereAusDatei,
    pruefeServer: async () => {
      await pruefeServer()
    },
    importiereHintergrundDatei,
    ladeIfcFassungNach,
    leseIfcBauteile,
    leseIfcHuelle,
    importiereProduktlizenzDatei: async (rohdaten) => {
      const status = await importiereProduktlizenz(rohdaten)
      useUiStore.getState().setProduktlizenzStatus(status)
      if (isTauri()) {
        void invoke('programm_neu_starten')
      }
    },
    zusatzmodule,
  }
  return kontext
}
