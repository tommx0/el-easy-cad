import { useEffect, useRef } from 'react'
import { AppProvider } from './app-context'
import { useAppContext } from './use-app-context'
import { Kopfzeile } from './Kopfzeile'
import { Seitenleiste } from './Seitenleiste'
import { SheetTabs } from './SheetTabs'
import { Statuszeile } from './Statuszeile'
import { CanvasArea } from './CanvasArea'
import { PropertiesPanel } from './PropertiesPanel'
import { ContextMenu } from './components/ContextMenu'
import { Toast } from './components/Toast'
import { EingabeDialog } from './dialogs/EingabeDialog'
import { GridVerteilenDialog } from './dialogs/GridVerteilenDialog'
import { AutomatischAnordnenDialog } from './dialogs/AutomatischAnordnenDialog'
import { VerteilenAbstandDialog } from './dialogs/VerteilenAbstandDialog'
import { BlattVerwaltungDialog } from './dialogs/BlattVerwaltungDialog'
import { EinstellungenDialog } from './dialogs/EinstellungenDialog'
import { UeberDialog } from './dialogs/UeberDialog'
import { LizenzenDialog } from './dialogs/LizenzenDialog'
import { MeineLizenzDialog } from './dialogs/MeineLizenzDialog'
import { FehlerprotokollDialog } from './dialogs/FehlerprotokollDialog'
import { ZusatzmoduleDialog } from './dialogs/ZusatzmoduleDialog'
import { ZusatzmodulHinzufuegenDialog } from './dialogs/ZusatzmodulHinzufuegenDialog'
import { ZusatzmodulFormularDialog } from './dialogs/ZusatzmodulFormularDialog'
import { ZusatzmodulPanelsSchwebend } from './zusatzmodule/ZusatzmodulPanels'
import { TastenkuerzelDialog } from './dialogs/TastenkuerzelDialog'
import { HandbuchDialog } from './dialogs/HandbuchDialog'
import { KatalogDialog } from './dialogs/KatalogDialog'
import { KabeltypenDialog } from './dialogs/KabeltypenDialog'
import { InstallationszonenDialog } from './dialogs/InstallationszonenDialog'
import { KomponentenPickerDialog } from './dialogs/KomponentenPickerDialog'
import { KnxAktorDialog } from './dialogs/KnxAktorDialog'
import { KnxZuordnenDialog } from './dialogs/KnxZuordnenDialog'
import { RaeumeVorschlagenDialog } from './dialogs/RaeumeVorschlagenDialog'
import { TrunkVerbindenDialog } from './dialogs/TrunkVerbindenDialog'
import { SwitchPortDialog } from './dialogs/SwitchPortDialog'
import { VerteilerDialog } from './dialogs/VerteilerDialog'
import { VerteilerplanErzeugenDialog } from './dialogs/VerteilerplanErzeugenDialog'
import { SchaltplanZuordnenDialog } from './dialogs/SchaltplanZuordnenDialog'
import { SchachtVerbundDialog } from './dialogs/SchachtVerbundDialog'
import { SchachtAnschlussDialog } from './dialogs/SchachtAnschlussDialog'
import { InhaltDialog } from './dialogs/InhaltDialog'
import { LeitungVerknuepfenDialog } from './dialogs/LeitungVerknuepfenDialog'
import { GruppeBildenDialog } from './dialogs/GruppeBildenDialog'
import { DruckExportDialog } from './dialogs/DruckExportDialog'
import { ZeichenflaecheEinrichtenDialog } from './dialogs/ZeichenflaecheEinrichtenDialog'
import { BlaetterAusrichtenDialog } from './dialogs/BlaetterAusrichtenDialog'
import { EtageEinfuegenDialog } from './dialogs/EtageEinfuegenDialog'
import { EtagenDialog } from './dialogs/EtagenDialog'
import { BeschriftungGroesseDialog } from './dialogs/BeschriftungGroesseDialog'
import { EinstellungenAustauschDialog } from './dialogs/EinstellungenAustauschDialog'
import { HintergrundAusblendungenDialog } from './dialogs/HintergrundAusblendungenDialog'
import { IfcBauteilgruppenDialog } from './dialogs/IfcBauteilgruppenDialog'
import { DreidDialog } from './dialogs/DreidDialog'
import { IfcBauteileDialog } from './dialogs/IfcBauteileDialog'
import { HintergrundUmwandelnDialog } from './dialogs/HintergrundUmwandelnDialog'
import { IfcAbweichungenPanel } from './dialogs/IfcAbweichungenPanel'
import { EbenenDialog } from './dialogs/EbenenDialog'
import { HintergrundPdfImportDialog } from './dialogs/HintergrundPdfImportDialog'
import { HintergrundIfcImportDialog } from './dialogs/HintergrundIfcImportDialog'
import { HintergrundIfcNachladenDialog } from './dialogs/HintergrundIfcNachladenDialog'
import { BauteilerkennungDialog } from './dialogs/BauteilerkennungDialog'
import { PlankopfDialog } from './dialogs/PlankopfDialog'
import { SlotMatrixDialog } from './dialogs/SlotMatrixDialog'
import { BibliothekImportDialog } from './dialogs/BibliothekImportDialog'
import { SlotWahlDialog } from './dialogs/SlotWahlDialog'
import { LeitungslisteKabeltypDialog } from './dialogs/LeitungslisteKabeltypDialog'
import { BestaettigungsDialog } from './dialogs/BestaettigungsDialog'
import { BefehleProvider } from './befehle/BefehleProvider'
import { useBefehle } from './befehle/use-befehle'
import { befehlNachId } from './befehle/katalog'
import { ZUSATZMODUL_ABFRAGE_TOOL_ID } from '../tools'
import { normalform } from './befehle/kuerzel'
import { useSettingsStore } from './store/settings-store'
import { istModalerDialogOffen, useUiStore } from './store/ui-store'
import './App.css'
import { ServerHinweis } from './ServerHinweis'
import { ProduktlizenzSperre } from './ProduktlizenzSperre'
import { DemoHinweisDialog } from './DemoHinweisDialog'
import { UpdateDialog, UpdateStartPruefung } from './dialogs/UpdateDialog'
import { ProjekteDialog } from './dialogs/ProjekteDialog'
import { EinfuehrungDialog } from './dialogs/EinfuehrungDialog'
import { HilfeHinweisDialog } from './dialogs/HilfeHinweisDialog'
import { HilfeHinweiseAuswahlDialog } from './dialogs/HilfeHinweiseAuswahlDialog'
import { useSprache } from './sprache-anbindung'
import { NotizAnsicht } from './NotizAnsicht'
import { PdfAnsicht } from './PdfAnsicht'
import { istEingabeFeldFokussiert } from './tastatur-fokus'

const ESCAPE_DOPPEL_MS = 500

function GlobaleTastenkuerzel() {
  const { toolManager, aktiviereTool, zusatzmodule } = useAppContext()
  const befehleRef = useRef(useBefehle())
  befehleRef.current = useBefehle()
  const nachKuerzelRef = useRef(useSettingsStore((s) => s.nachKuerzel))
  nachKuerzelRef.current = useSettingsStore((s) => s.nachKuerzel)

  const letzteEscapeRef = useRef(0)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (istModalerDialogOffen()) return

      if (zusatzmodule.laeuft()) {
        if (toolManager.getAktivesToolId() === ZUSATZMODUL_ABFRAGE_TOOL_ID) {
          if (e.key === 'Escape' || e.key === 'Enter') toolManager.handleKeyDown(e)
        } else if (e.key === 'Escape') {
          zusatzmodule.abbrechen()
        }
        e.preventDefault()
        return
      }

      const kuerzel = normalform(e)
      const befehlId = kuerzel ? nachKuerzelRef.current[kuerzel] : undefined
      const befehl = befehlId ? befehlNachId(befehlId) : undefined
      const aktion = befehlId ? befehleRef.current[befehlId] : undefined

      if (befehl?.auchBeimTippen && aktion && !aktion.deaktiviert) {
        e.preventDefault()
        aktion.ausfuehren()
        return
      }

      if (istEingabeFeldFokussiert()) return

      if (aktion) {
        e.preventDefault()
        if (!aktion.deaktiviert) aktion.ausfuehren()
        return
      }

      if (e.key === 'Escape') {
        useUiStore.getState().setAuswahlIds([])
        const jetzt = Date.now()
        const doppelt = !e.repeat && jetzt - letzteEscapeRef.current <= ESCAPE_DOPPEL_MS
        letzteEscapeRef.current = doppelt ? 0 : jetzt
        if (doppelt) {
          toolManager.handleKeyDown(e)
          aktiviereTool('auswahl')
          return
        }
      }

      toolManager.handleKeyDown(e)
    }

    function handleKeyUp(e: KeyboardEvent) {
      toolManager.handleKeyUp(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [toolManager, aktiviereTool, zusatzmodule])

  return null
}

function AppInhalt() {
  useSprache()
  const serverZustand = useUiStore((s) => s.serverZustand)
  const produktlizenzStatus = useUiStore((s) => s.produktlizenzStatus)
  const dokumentTyp = useUiStore((s) => s.offenesDokument?.typ)
  const istZeichnung = dokumentTyp === undefined || dokumentTyp === 'zeichnung'

  if (serverZustand === 'pruefe') return null
  if (serverZustand === 'nicht-erreichbar') return <ServerHinweis />
  const betriebsmodus = produktlizenzStatus?.betriebsmodus
  if (betriebsmodus === 'gesperrt' || betriebsmodus === 'demo-abgelaufen') {
    return <ProduktlizenzSperre />
  }

  return (
    <div className="app">
      {betriebsmodus === 'demo' && (
        <DemoHinweisDialog resttage={produktlizenzStatus?.resttageDemo ?? 0} />
      )}
      <UpdateStartPruefung />
      <BefehleProvider>
        <GlobaleTastenkuerzel />
        <Kopfzeile />
      </BefehleProvider>
      {istZeichnung ? (
        <>
          <SheetTabs />
          <div className="arbeitsbereich">
            <Seitenleiste />
            <CanvasArea />
            <PropertiesPanel />
            <ZusatzmodulPanelsSchwebend />
          </div>
          <Statuszeile />
        </>
      ) : dokumentTyp === 'notiz' ? (
        <NotizAnsicht />
      ) : (
        <PdfAnsicht />
      )}
      <ContextMenu />
      <Toast />
      <BlattVerwaltungDialog />
      <ProjekteDialog />
      <EinfuehrungDialog />
      <EinstellungenDialog />
      <UeberDialog />
      <LizenzenDialog />
      <MeineLizenzDialog />
      <ZusatzmoduleDialog />
      <ZusatzmodulHinzufuegenDialog />
      <ZusatzmodulFormularDialog />
      <FehlerprotokollDialog />
      <TastenkuerzelDialog />
      <HandbuchDialog />
      <KatalogDialog />
      <KabeltypenDialog />
      <InstallationszonenDialog />
      <VerteilerDialog />
      <VerteilerplanErzeugenDialog />
      <KnxZuordnenDialog />
      <RaeumeVorschlagenDialog />
      <SchaltplanZuordnenDialog />
      <KomponentenPickerDialog />
      <KnxAktorDialog />
      <TrunkVerbindenDialog />
      <SwitchPortDialog />
      <SchachtVerbundDialog />
      <SchachtAnschlussDialog />
      <InhaltDialog />
      <LeitungVerknuepfenDialog />
      <GruppeBildenDialog />
      <DruckExportDialog />
      <ZeichenflaecheEinrichtenDialog />
      <BeschriftungGroesseDialog />
      <BlaetterAusrichtenDialog />
      <EtageEinfuegenDialog />
      <EtagenDialog />
      <EinstellungenAustauschDialog />
      <HintergrundAusblendungenDialog />
      <IfcBauteilgruppenDialog />
      <DreidDialog />
      <IfcBauteileDialog />
      <HintergrundUmwandelnDialog />
      <IfcAbweichungenPanel />
      <EbenenDialog />
      <HintergrundPdfImportDialog />
      <HintergrundIfcImportDialog />
      <HintergrundIfcNachladenDialog />
      <BauteilerkennungDialog />
      <PlankopfDialog />
      <SlotMatrixDialog />
      <BibliothekImportDialog />
      <SlotWahlDialog />
      <LeitungslisteKabeltypDialog />
      <BestaettigungsDialog />
      <EingabeDialog />
      <GridVerteilenDialog />
      <AutomatischAnordnenDialog />
      <VerteilenAbstandDialog />
      <UpdateDialog />
      <HilfeHinweiseAuswahlDialog />
      <HilfeHinweisDialog />
    </div>
  )
}

export function App() {
  return (
    <AppProvider>
      <AppInhalt />
    </AppProvider>
  )
}
