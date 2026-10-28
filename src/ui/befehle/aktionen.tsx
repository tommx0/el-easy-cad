import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CompositeCommand,
  erzeugeBlattAendernCommand,
  erzeugeModulFelderNachtragenCommand,
  erzeugeObjekteEntfernenCommand,
  FANGARTEN_RANGFOLGE,
  frageLoeschung,
} from '../../tools'
import {
  ermittleFehlendeModulFelder,
  istKalibrierbar,
  istSchaltplan,
  blaetterDesselbenIfcModells,
  nurAnsichtGrund,
  umwandelbareBlaetter,
  umwandelbarerHintergrund,
  type Blatt,
} from '../../document-model'
import { frageBlattUmfang } from '../blatt-umfang-frage'
import { exportiereAlsExcel, exportiereAlsIfc } from '../../druck'
import {
  erzeugeDateiname,
  ladeAssetHoch,
  speichereDatei,
  starteServerDownload,
} from '../../persistence'
import { waehleEinstellungsDatei } from '../einstellungen-austausch'
import { importiereKatalogMitRueckfrage } from '../katalog-import'
import { anordnenUmfang, starteAutomatischAnordnen } from '../automatisch-anordnen'
import { verlegeLeitungenNeuBefehl } from '../nur-in-bauteilen'
import { bibliothekHerunterladen, waehleUndOeffneBibliothek } from '../bibliothek-import'
import { zeigeHilfeHinweis } from '../hilfe-hinweise'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useZusatzmodulStore } from '../store/zusatzmodul-store'
import { WERKZEUG_ABSCHNITT } from '../handbuch/kapitel'
import {
  useAktivesBlatt,
  useAppContext,
  useCanRedo,
  useCanUndo,
  useProject,
} from '../use-app-context'
import { useFreigeschalteteModule, useHatModul } from '../lizenz-module'
import { ALLE_BLATT_SICHTBARKEITEN, type BlattSichtbarkeitBefehl } from './blatt-sichtbarkeit'
import { tabellenVerknuepfung } from '../verknuepfung'
import { alleBefehle, BEFEHLE, BEFEHL_NACH_ID, kuerzelPartner } from './katalog'
import { werkzeugPasstZuZeichnungsart } from '../werkzeugleiste-reihenfolge'
import { FANGART_BEFEHL_ID } from '../objektfang-namen'
import { useT } from '../sprache-anbindung'
import { waehleZusatzmodulZumHinzufuegen } from '../zusatzmodule/hinzufuegen'

export interface Befehlsaktion {
  ausfuehren: () => void
  deaktiviert?: boolean
  haken?: boolean
  labelZusatz?: string
}

export type Aktionskarte = Record<string, Befehlsaktion>

export function useBefehlsAktionen(): { aktionen: Aktionskarte; versteckteEingaben: ReactNode } {
  const bim = useHatModul('bim')
  const freigeschaltet = useFreigeschalteteModule()
  const t = useT()
  const {
    doc,
    commands,
    aktiviereTool,
    kopiereAuswahl,
    fuegeEin,
    ausschneiden,
    neueZeichnung,
    speichern,
    exportiereAlsDatei,
    importiereAusDatei,
    importiereHintergrundDatei,
    ladeIfcFassungNach,
    catalogStore,
    sitzung,
    dokumentStore,
    settingsStore,
    verknuepfung,
    zusatzmodule,
  } = useAppContext()
  const blatt = useAktivesBlatt()
  const zeichnung = useProject()
  const zeichnungHatIfc = zeichnung.blaetter.some((b) => b.hintergrund?.typ === 'ifc')
  const schaltplan = istSchaltplan(zeichnung)
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const auswahlIds = useUiStore((s) => s.auswahlIds)
  const klemmbrettGefuellt = useUiStore((s) => s.klemmbrettGefuellt)
  const setAuswahlIds = useUiStore((s) => s.setAuswahlIds)
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  useZusatzmodulStore((s) => s.eintraege)
  const modulLaeuft = useZusatzmodulStore((s) => s.laufend !== null)
  const wasserzeichenAktiv = useUiStore((s) => s.produktlizenzStatus?.betriebsmodus === 'demo')
  const lizenznehmer = useUiStore((s) =>
    s.produktlizenzStatus?.status === 'gueltig'
      ? (s.produktlizenzStatus.lizenznehmer ?? null)
      : null,
  )
  const rasterSichtbar = useUiStore((s) => s.rasterSichtbar)
  const snapAktiv = useUiStore((s) => s.snapAktiv)
  const objektfangAktiv = useUiStore((s) => s.objektfangAktiv)
  const spurfangAktiv = useUiStore((s) => s.spurfangAktiv)
  const hintergrundfangAktiv = useUiStore((s) => s.hintergrundfangAktiv)
  const toggleRaster = useUiStore((s) => s.toggleRaster)
  const toggleSnap = useUiStore((s) => s.toggleSnap)
  const toggleObjektfang = useUiStore((s) => s.toggleObjektfang)
  const toggleSpurfang = useUiStore((s) => s.toggleSpurfang)
  const toggleHintergrundfang = useUiStore((s) => s.toggleHintergrundfang)
  const wandfangAktiv = useUiStore((s) => s.wandfangAktiv)
  const toggleWandfang = useUiStore((s) => s.toggleWandfang)
  const objektfangArten = useSettingsStore((s) => s.objektfangArten)
  const toggleObjektfangArt = useSettingsStore((s) => s.toggleObjektfangArt)
  const seitenleisteSichtbar = useSettingsStore((s) => s.seitenleisteSichtbar)
  const toggleSeitenleisteSichtbar = useSettingsStore((s) => s.toggleSeitenleisteSichtbar)
  const symbolleisteAnzeigen = useSettingsStore((s) => s.symbolleisteAnzeigen)
  const toggleSymbolleisteAnzeigen = useSettingsStore((s) => s.toggleSymbolleisteAnzeigen)
  const eigenschaftenSichtbar = useSettingsStore((s) => s.eigenschaftenSichtbar)
  const toggleEigenschaftenSichtbar = useSettingsStore((s) => s.toggleEigenschaftenSichtbar)
  const kontextleisteSichtbar = useSettingsStore((s) => s.kontextleisteSichtbar)
  const setKontextleisteSichtbar = useSettingsStore((s) => s.setKontextleisteSichtbar)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const ifcNachladenInputRef = useRef<HTMLInputElement | null>(null)
  const [vollbild, setVollbild] = useState(false)

  useEffect(() => {
    function aufVollbild() {
      setVollbild(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', aufVollbild)
    return () => document.removeEventListener('fullscreenchange', aufVollbild)
  }, [])

  function handleLoeschen() {
    if (auswahlIds.length === 0) return
    frageLoeschung(
      useUiStore.getState().oeffneBestaetigung,
      doc,
      blatt.id,
      auswahlIds,
      (bestaetigt) => {
        if (!bestaetigt) return
        commands.execute(
          erzeugeObjekteEntfernenCommand(
            doc,
            blatt.id,
            auswahlIds,
            t('aktionen.befehle.objekteLoeschen', { n: auswahlIds.length }),
          ),
        )
        setAuswahlIds([])
      },
    )
  }

  function handleAllesAuswaehlen() {
    setAuswahlIds(blatt.objekte.map((o) => o.id))
    aktiviereTool('auswahl')
  }

  function toggleVollbild() {
    const versuch = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    versuch.catch(() => zeigeToast(t('aktionen.befehle.vollbildFehlt')))
  }

  function nullpunktAufAlleBlaetter() {
    const nullpunkt = blatt.nullpunkt
    if (!nullpunkt) return
    const andere = zeichnung.blaetter.filter((b) => b.id !== blatt.id)
    if (andere.length === 0) return
    const label = t('aktionen.befehle.nullpunktAlle')
    commands.execute(
      new CompositeCommand(
        label,
        andere.map((b) =>
          erzeugeBlattAendernCommand(doc, b.id, label, {
            nullpunkt,
            nullpunktRichtung: blatt.nullpunktRichtung,
          }),
        ),
      ),
    )
    zeigeToast(t('aktionen.befehle.nullpunktAlleFertig', { n: andere.length }))
  }

  function modulfelderReparieren() {
    const patches = ermittleFehlendeModulFelder(
      zeichnung.blaetter.flatMap((b) => b.objekte),
      katalogKomponenten,
    )
    if (patches.size === 0) {
      zeigeToast(t('aktionen.befehle.modulfelderKeine'))
      return
    }
    commands.execute(
      erzeugeModulFelderNachtragenCommand(doc, patches, t('aktionen.befehle.modulfelderUndo')),
    )
    zeigeToast(t('aktionen.befehle.modulfelderFertig', { n: patches.size }))
  }

  function nullpunktAufheben() {
    commands.execute(
      erzeugeBlattAendernCommand(doc, blatt.id, t('aktionen.befehle.nullpunktAufheben'), {
        nullpunkt: null,
        nullpunktRichtung: undefined,
      }),
    )
  }

  function toggleHintergrundSichtbar() {
    commands.execute(
      erzeugeBlattAendernCommand(doc, blatt.id, t('aktionen.befehle.hintergrundSichtbar'), {
        hintergrundSichtbar: !blatt.hintergrundSichtbar,
      }),
    )
  }

  function hintergrundLoeschen() {
    if (!blatt.hintergrund) return
    useUiStore.getState().oeffneBestaetigung({
      titel: t('aktionen.befehle.hintergrundLoeschenFrage'),
      nachricht: t('aktionen.befehle.hintergrundLoeschenText'),
      bestaetigenText: t('aktionen.befehle.hintergrundLoeschen'),
      destruktiv: true,
      callback: (bestaetigt) => {
        if (!bestaetigt) return
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, t('aktionen.befehle.hintergrundLoeschen'), {
            hintergrund: null,
            massstab: null,
          }),
        )
      },
    })
  }

  function hintergrundUmwandeln() {
    if (!umwandelbarerHintergrund(blatt)) return
    const umwandelbar = new Set(umwandelbareBlaetter(zeichnung.blaetter).map((b) => b.id))
    frageBlattUmfang({
      titel: t('aktionen.befehle.umwandelnFrage'),
      nachricht: (n) => t('aktionen.befehle.umfangUmwandeln', { n }),
      kandidaten: zeichnung.blaetter.filter(
        (b) =>
          b.id === blatt.id ||
          (umwandelbar.has(b.id) && nurAnsichtGrund(b, freigeschaltet) === null),
      ),
      aktuellesBlattId: blatt.id,
      starte: (blattIds) => ui().setUmwandelnDialog({ blattIds, startBlattId: blatt.id }),
    })
  }

  function ifcBauteileUebernehmen() {
    const desselben = new Set(
      blaetterDesselbenIfcModells(zeichnung.blaetter, blatt).map((b) => b.id),
    )
    frageBlattUmfang({
      titel: t('zeichendialoge.ifcBauteile.titel'),
      nachricht: (n) => t('aktionen.befehle.umfangIfc', { n }),
      kandidaten: zeichnung.blaetter.filter(
        (b) =>
          b.id === blatt.id || (desselben.has(b.id) && nurAnsichtGrund(b, freigeschaltet) === null),
      ),
      aktuellesBlattId: blatt.id,
      starte: (blattIds) => ui().setIfcBauteileDialog({ blattIds, startBlattId: blatt.id }),
    })
  }

  function sichtbarkeitUmschalten({ feld, undoLabel }: BlattSichtbarkeitBefehl) {
    const patch = { [feld]: !blatt[feld] } as Pick<Blatt, typeof feld>
    commands.execute(erzeugeBlattAendernCommand(doc, blatt.id, undoLabel, patch))
  }

  function zoomEreignis(name: string) {
    window.dispatchEvent(new CustomEvent(`eleasycad:${name}`))
  }

  async function exportiereIfc() {
    const offenesDokument = sitzung.getOffenesDokument()
    try {
      const { datei, bericht } = await exportiereAlsIfc(zeichnung, katalogKomponenten, {
        module: freigeschaltet,
        anwendung: `el.esy.CAD ${__APP_VERSION__}`,
      })
      const dateiname = erzeugeDateiname(
        [offenesDokument?.projektBezeichnung, zeichnung.name, 'IFC'],
        'ifc',
      )
      const gespeichert = await speichereDatei(datei, dateiname, {
        beschreibung: t('aktionen.befehle.ifcModell'),
        erweiterungen: ['ifc'],
      })
      if (!gespeichert) return
      if (bericht.length === 0) {
        zeigeToast(t('aktionen.befehle.ifcExportiert'))
        return
      }
      ui().oeffneBestaetigung({
        titel: t('aktionen.befehle.ifcExportiertTitel'),
        nachricht: t('aktionen.befehle.ifcBericht'),
        liste: bericht,
        bestaetigenText: t('aktionen.befehle.ok'),
        destruktiv: false,
        ohneAbbrechen: true,
        callback: () => {},
      })
    } catch (fehler) {
      zeigeToast(fehler instanceof Error ? fehler.message : t('aktionen.befehle.ifcFehler'))
    }
  }

  async function exportiereListenAlsExcel() {
    const offenesDokument = sitzung.getOffenesDokument()
    const blob = await exportiereAlsExcel(
      zeichnung,
      katalogKomponenten,
      wasserzeichenAktiv,
      lizenznehmer,
      tabellenVerknuepfung(verknuepfung.getStand()),
    )
    const heute = new Date()
    const datum = [heute.getFullYear(), heute.getMonth() + 1, heute.getDate()]
      .map((teil, i) => (i === 0 ? String(teil) : String(teil).padStart(2, '0')))
      .join('-')
    const dateiname = erzeugeDateiname(
      [offenesDokument?.projektBezeichnung, zeichnung.name, 'Liste', datum],
      'xlsx',
    )

    try {
      await speichereDatei(blob, dateiname, {
        beschreibung: t('aktionen.befehle.excelArbeitsmappe'),
        erweiterungen: ['xlsx'],
      })

      if (offenesDokument) {
        const assetId = await ladeAssetHoch(blob, dateiname)
        const dokumente = await dokumentStore.liste(offenesDokument.projektId)
        const vorhandeneAnlage = dokumente.find(
          (d) => d.typ === 'excel' && d.quelleDokumentId === offenesDokument.dokumentId,
        )
        if (vorhandeneAnlage) {
          await dokumentStore.aendere(vorhandeneAnlage.id, { name: dateiname })
          const geladen = await dokumentStore.hole(vorhandeneAnlage.id)
          await dokumentStore.speichereInhalt(vorhandeneAnlage.id, {
            formatVersion: 1,
            version: geladen?.inhalt.version ?? 0,
            inhalt: null,
            assetId,
          })
        } else {
          const angelegt = await dokumentStore.lege(offenesDokument.projektId, {
            typ: 'excel',
            name: dateiname,
            quelleDokumentId: offenesDokument.dokumentId,
          })
          await dokumentStore.speichereInhalt(angelegt.id, {
            formatVersion: 1,
            version: 0,
            inhalt: null,
            assetId,
          })
        }
      }

      zeigeToast(
        offenesDokument
          ? t('aktionen.befehle.excelExportiertProjekt')
          : t('aktionen.befehle.excelExportiert'),
      )
    } catch (fehler) {
      zeigeToast(fehler instanceof Error ? fehler.message : t('aktionen.befehle.excelFehler'))
    }
  }

  function sicherungHerunterladen() {
    useUiStore.getState().zeigeToast(t('aktionen.befehle.sicherungLaeuft'))
    void starteServerDownload('/sicherung').catch((fehler) =>
      useUiStore
        .getState()
        .zeigeToast(
          fehler instanceof Error ? fehler.message : t('aktionen.befehle.sicherungFehler'),
        ),
    )
  }

  const ui = () => useUiStore.getState()
  const ohneAuswahl = auswahlIds.length === 0

  const aktionen: Aktionskarte = {
    'datei.projekte': { ausfuehren: () => ui().setProjekteDialogOffen(true) },
    'datei.neue-zeichnung': { ausfuehren: neueZeichnung },
    'datei.verteilerplan-assistent': {
      ausfuehren: () => ui().setVerteilerplanErzeugen({ art: 'projekt' }),
    },
    'datei.speichern': {
      ausfuehren: () => {
        void speichern()
      },
    },
    'datei.import-zeichnung': {
      ausfuehren: () => {
        void importiereAusDatei()
      },
    },
    ...(bim
      ? {
          'blatt.ifc-nachladen': {
            ausfuehren: () => ifcNachladenInputRef.current?.click(),
            deaktiviert: !zeichnungHatIfc,
          },
          'datei.export-ifc': {
            ausfuehren: () => void exportiereIfc(),
            deaktiviert: schaltplan || wasserzeichenAktiv,
            labelZusatz: wasserzeichenAktiv ? t('aktionen.befehle.nichtInTestversion') : undefined,
          },
          'ansicht.dreid': {
            ausfuehren: () => {
              ui().setDreidDialogOffen(true)
              zeigeHilfeHinweis('dreid')
            },
            deaktiviert: schaltplan,
          },
          'blatt.ifc-bauteilgruppen': {
            ausfuehren: () => ui().setIfcBauteilgruppenDialogOffen(true),
            deaktiviert: blatt.hintergrund?.typ !== 'ifc',
          },
          'blatt.ifc-bauteile': {
            ausfuehren: ifcBauteileUebernehmen,
            deaktiviert: blatt.hintergrund?.typ !== 'ifc',
          },
        }
      : {}),
    'datei.import-hintergrund': {
      ausfuehren: () => importInputRef.current?.click(),
      deaktiviert: schaltplan,
    },
    'datei.import-katalog': {
      ausfuehren: () => void importiereKatalogMitRueckfrage(catalogStore),
    },
    'datei.import-bibliothek': {
      ausfuehren: () => void waehleUndOeffneBibliothek(),
    },
    'datei.export-bibliothek': {
      ausfuehren: bibliothekHerunterladen,
    },
    'datei.export-zeichnung': {
      ausfuehren: () => {
        void exportiereAlsDatei()
      },
    },
    'datei.export-plan': {
      ausfuehren: () => ui().oeffneDruckExportDialog('export'),
    },
    'datei.export-excel': { ausfuehren: () => void exportiereListenAlsExcel() },
    'datei.drucken': { ausfuehren: () => ui().oeffneDruckExportDialog('druck') },
    'datei.sicherung': { ausfuehren: sicherungHerunterladen },

    'bearbeiten.rueckgaengig': {
      ausfuehren: () => commands.undo(),
      deaktiviert: !canUndo,
      labelZusatz: commands.peekUndoLabel() ? `: ${commands.peekUndoLabel()}` : '',
    },
    'bearbeiten.wiederholen': {
      ausfuehren: () => commands.redo(),
      deaktiviert: !canRedo,
      labelZusatz: commands.peekRedoLabel() ? `: ${commands.peekRedoLabel()}` : '',
    },
    'bearbeiten.ausschneiden': { ausfuehren: ausschneiden, deaktiviert: ohneAuswahl },
    'bearbeiten.kopieren': { ausfuehren: kopiereAuswahl, deaktiviert: ohneAuswahl },
    'bearbeiten.einfuegen': { ausfuehren: fuegeEin, deaktiviert: !klemmbrettGefuellt },
    'bearbeiten.loeschen': { ausfuehren: handleLoeschen, deaktiviert: ohneAuswahl },
    'bearbeiten.alles-auswaehlen': { ausfuehren: handleAllesAuswaehlen },
    'bearbeiten.auswahl-aufheben': {
      ausfuehren: () => setAuswahlIds([]),
      deaktiviert: ohneAuswahl,
    },
    'bearbeiten.leitungen-neu-verlegen': {
      ausfuehren: () => verlegeLeitungenNeuBefehl(doc, commands, blatt.id, auswahlIds),
      deaktiviert: !blatt.objekte.some((o) => o.type === 'leitung'),
    },
    'bearbeiten.automatisch-anordnen': {
      ausfuehren: () => starteAutomatischAnordnen({ doc }, auswahlIds),
      deaktiviert: !anordnenUmfang(blatt.objekte, auswahlIds, blatt.ebenen),
    },

    'blatt.zeichenflaeche-einrichten': {
      ausfuehren: () => ui().setZeichenflaecheEinrichtenOffen(true),
    },
    'blatt.beschriftung-groesse': { ausfuehren: () => ui().setBeschriftungGroesseOffen(true) },
    'blatt.nullpunkt-alle': {
      ausfuehren: nullpunktAufAlleBlaetter,
      deaktiviert: !blatt.nullpunkt || zeichnung.blaetter.length < 2,
    },
    'blatt.nullpunkt-aufheben': {
      ausfuehren: nullpunktAufheben,
      deaktiviert: !blatt.nullpunkt,
    },
    'blatt.ausrichten': {
      ausfuehren: () => ui().setBlaetterAusrichtenOffen(true),
      deaktiviert: schaltplan,
    },
    'blatt.verwaltung': { ausfuehren: () => ui().setBlattVerwaltungOffen(true) },
    'blatt.etagen': {
      ausfuehren: () => ui().setEtagenDialogOffen(true),
      deaktiviert: schaltplan,
    },

    'ansicht.zoom-rein': { ausfuehren: () => zoomEreignis('zoom-in') },
    'ansicht.zoom-raus': { ausfuehren: () => zoomEreignis('zoom-out') },
    'ansicht.zoom-alles': { ausfuehren: () => zoomEreignis('zoom-alles') },
    'ansicht.zoom-100': { ausfuehren: () => zoomEreignis('zoom-100') },
    'ansicht.raster': { ausfuehren: toggleRaster, haken: rasterSichtbar },
    'ansicht.fang': { ausfuehren: toggleSnap, haken: snapAktiv },
    'ansicht.objektfang': { ausfuehren: toggleObjektfang, haken: objektfangAktiv },
    'ansicht.spurfang': {
      ausfuehren: toggleSpurfang,
      haken: spurfangAktiv,
      deaktiviert: !objektfangAktiv,
    },
    'ansicht.hintergrundfang': {
      ausfuehren: toggleHintergrundfang,
      haken: hintergrundfangAktiv,
      deaktiviert: !objektfangAktiv,
    },
    'ansicht.wandfang': {
      ausfuehren: toggleWandfang,
      haken: wandfangAktiv,
      deaktiviert: schaltplan,
    },
    'ansicht.hintergrund': {
      ausfuehren: toggleHintergrundSichtbar,
      deaktiviert: !blatt.hintergrund,
      haken: Boolean(blatt.hintergrund) && blatt.hintergrundSichtbar,
    },
    'blatt.hintergrund-ausblendungen': {
      ausfuehren: () => ui().setHintergrundAusblendungenDialogOffen(true),
      deaktiviert: !blatt.hintergrund,
    },
    'blatt.hintergrund-loeschen': {
      ausfuehren: hintergrundLoeschen,
      deaktiviert: !blatt.hintergrund,
    },
    'blatt.hintergrund-umwandeln': {
      ausfuehren: hintergrundUmwandeln,
      deaktiviert:
        !umwandelbarerHintergrund(blatt) || nurAnsichtGrund(blatt, freigeschaltet) !== null,
    },
    'blatt.ebenen': {
      ausfuehren: () => ui().setEbenenDialogOffen(true),
    },
    'ansicht.vollbild': { ausfuehren: toggleVollbild, haken: vollbild },
    'ansicht.symbolleiste': {
      ausfuehren: () => toggleSymbolleisteAnzeigen(settingsStore),
      haken: symbolleisteAnzeigen,
    },
    'ansicht.seitenleiste': {
      ausfuehren: () => toggleSeitenleisteSichtbar(settingsStore),
      haken: seitenleisteSichtbar,
    },
    'ansicht.eigenschaften': {
      ausfuehren: () => toggleEigenschaftenSichtbar(settingsStore),
      haken: eigenschaftenSichtbar,
    },
    'ansicht.kontextleiste': {
      ausfuehren: () => setKontextleisteSichtbar(settingsStore, !kontextleisteSichtbar),
      haken: kontextleisteSichtbar,
    },

    'katalog.oeffnen': { ausfuehren: () => ui().setKatalogDialogOffen(true) },
    'katalog.komponente-neu': {
      ausfuehren: () => {
        ui().setKatalogDialogOffen(true)
        ui().zeigeToast(t('aktionen.befehle.neueKomponenteKlicken'))
      },
    },
    'katalog.kabeltypen': { ausfuehren: () => ui().setKabeltypenDialogOffen(true) },
    'katalog.installationszonen': {
      ausfuehren: () => ui().setInstallationszonenDialogOffen(true),
    },

    'extras.einstellungen': { ausfuehren: () => ui().setEinstellungenOffen(true) },
    'extras.tastenkuerzel': { ausfuehren: () => ui().setTastenkuerzelDialogOffen(true) },
    'extras.einstellungen-sichern': {
      ausfuehren: () => ui().setEinstellungenAustausch({ art: 'sichern' }),
    },
    'extras.einstellungen-einspielen': { ausfuehren: () => void waehleEinstellungsDatei() },
    'extras.modulfelder-reparieren': { ausfuehren: modulfelderReparieren },
    'module.hinzufuegen': { ausfuehren: () => void waehleZusatzmodulZumHinzufuegen() },
    'module.anzeigen': { ausfuehren: () => ui().setModuleDialog('anzeigen') },
    'module.entfernen': { ausfuehren: () => ui().setModuleDialog('entfernen') },
    'hilfe.handbuch': {
      ausfuehren: () =>
        ui().setHandbuchDialog({
          anker: WERKZEUG_ABSCHNITT[useUiStore.getState().aktivesToolId] ?? null,
        }),
    },
    'hilfe.hinweise': { ausfuehren: () => ui().setHilfeHinweiseDialogOffen(true) },
    'hilfe.ueber': { ausfuehren: () => ui().setUeberDialogOffen(true) },
    'hilfe.meine-lizenz': { ausfuehren: () => ui().setMeineLizenzDialogOffen(true) },
    'hilfe.lizenzen': { ausfuehren: () => ui().setLizenzenDialogOffen(true) },
    'hilfe.fehlerprotokoll': { ausfuehren: () => ui().setFehlerprotokollDialogOffen(true) },
  }

  for (const eintrag of ALLE_BLATT_SICHTBARKEITEN) {
    aktionen[eintrag.id] = {
      ausfuehren: () => sichtbarkeitUmschalten(eintrag),
      haken: blatt[eintrag.feld],
      deaktiviert:
        (schaltplan &&
          (eintrag.feld === 'installationshoeheSichtbar' ||
            eintrag.feld === 'stromkreisSichtbar' ||
            eintrag.feld === 'stromkreisSchildSichtbar')) ||
        (!schaltplan && eintrag.feld === 'abgaengeSichtbar'),
    }
  }

  for (const art of FANGARTEN_RANGFOLGE) {
    aktionen[FANGART_BEFEHL_ID[art]] = {
      ausfuehren: () => toggleObjektfangArt(settingsStore, art),
      haken: objektfangArten.includes(art),
    }
  }

  for (const befehl of BEFEHLE) {
    if (!befehl.werkzeugId) continue
    const passendeId = [befehl.id, ...kuerzelPartner(befehl.id)]
      .map((id) => BEFEHL_NACH_ID[id].werkzeugId)
      .find((id) => id !== undefined && werkzeugPasstZuZeichnungsart(id, zeichnung.zeichnungsart))
    aktionen[befehl.id] = {
      ausfuehren: () => passendeId && aktiviereTool(passendeId),
      deaktiviert:
        passendeId === undefined ||
        (befehl.werkzeugId === 'kalibrieren' && !istKalibrierbar(blatt.hintergrund)) ||
        (befehl.werkzeugId === 'hintergrund-ausblenden' && !blatt.hintergrund) ||
        (befehl.werkzeugId === 'zeichenflaeche-verschieben' &&
          (!blatt.zeichenflaeche || schaltplan)),
    }
  }

  for (const befehl of alleBefehle()) {
    const modul = befehl.zusatzmodul
    if (!modul) continue
    aktionen[befehl.id] = {
      ausfuehren: () => void zusatzmodule.fuehreAus(modul.kennung, modul.befehlId),
      deaktiviert:
        modulLaeuft ||
        (modul.nurZeichnungsart !== undefined &&
          modul.nurZeichnungsart !== zeichnung.zeichnungsart),
    }
  }

  const versteckteEingaben = (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept={bim ? '.pdf,.dxf,.ifc' : '.pdf,.dxf'}
        style={{ display: 'none' }}
        onChange={(e) => {
          const datei = e.target.files?.[0]
          e.target.value = ''
          if (datei) void importiereHintergrundDatei(datei)
        }}
      />
      <input
        ref={ifcNachladenInputRef}
        type="file"
        accept=".ifc"
        style={{ display: 'none' }}
        onChange={(e) => {
          const datei = e.target.files?.[0]
          e.target.value = ''
          if (datei) void ladeIfcFassungNach(datei)
        }}
      />
    </>
  )

  return { aktionen, versteckteEingaben }
}
