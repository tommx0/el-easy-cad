import { useMemo, useState, type ChangeEvent } from 'react'
import type {
  Ansteuerung,
  Blatt,
  Einheit,
  KomponentenDarstellung,
  KomponentenTyp,
  LeitungsObjekt,
  Linientyp,
  Montageort,
  Objekt,
  PlankopfObjekt,
  SchaltverbindungObjekt,
  Slot,
  SlotMatrix,
  SlotZiel,
  TreppenForm,
  Zeichnung,
  ZonenVerlegung,
} from '../document-model'
import {
  aufgeloesteVariante,
  hatLeiterfarbe,
  LEITER_FARBEN,
  leiterfarbePatch,
  benoetigtePortAnzahl,
  istFuellbar,
  istBearbeitbar,
  freieStuecke,
  deckenstaerkeMeter,
  ifcGruppeInfo,
  ifcGruppeVonKlasse,
  istNurAnsicht,
  ermittleAlleKomponenten,
  ermittleUnterbrechungsVerweise,
  ermittleAlleSwitches,
  ermittleAnsteuerung,
  ermittleEingehendeSlotVerweise,
  ermittleLeitungsLaenge,
  ermittleOeffnungsGeometrie,
  ermittleTypUndSlots,
  fensterBruestung,
  fensterHoehe,
  OEFFNUNG_HOEHE_MIN,
  tuerHoehe,
  ermittleUrsprung,
  erzeugeId,
  erzeugeSlot,
  erzeugtZyklus,
  variablerTextName,
  typHatAnsteuerung,
  typHatSlotMatrix,
  typHatSlots,
  waehlbareAnsteuerungen,
  waehlbareTypen,
  pfadGesamtLaenge,
  beschreibeSchachtStraenge,
  ermittleSchachtStraenge,
  istSwitchOderPatchpanelKomponente,
  portAnzahlKonfiguration,
  portBezeichnung,
  schachtEtagenVerweise,
  wirksameGeschosshoehe,
  leitungslistenTitel,
  stuecklistenTitel,
  toDegrees,
  toRadians,
  trunkAnzeigeName,
  leitungsbaumTitel,
  trunklistenTitel,
  raumlistenTitel,
  betriebsmittellistenTitel,
  stromkreisverzeichnisTitel,
  aktorkanallistenTitel,
  alleVerteiler,
  verteilerKennzeichenText,
  potentiallistenTitel,
  spanneJeSlot,
  steuerungslogikTitel,
  mindestTreppenStufenanzahl,
  lFormMasseAendern,
  TREPPEN_FORM_LABELS,
  bauePlankopfModell,
  plankopfNutztErsatzMassstab,
  zeichenflaecheGroesseWelt,
  PLANKOPF_ERSATZ_MASSSTAB,
  gemeinsameVariableFelder,
  istVariablerText,
  setzeVariablenWert,
  istSchaltplan,
  ableiteSlotMatrix,
  SLOT_ANZAHL_MAX,
  SLOT_RASTER_ZEILEN_MAX,
  slotAenderungFuerWert,
  slotKopplungWirksam,
  zahlAusText,
  setzeVerlegung,
  verlegungsAbweichungen,
  verlegungsKuerzel,
  verlegungVon,
  istKlemme,
  klemmenNummerVergeben,
  klemmenZahl,
  STROMKREIS_NUMMER_MAX,
  endenAmKnoten,
  segmentNetz,
  ermittleKnxZiele,
  gruppenVorgabe,
  knxHaken,
  stromkreisVorgabe,
  stromkreisWertText,
  wirksamePolzahl,
  wirksamerStromkreis,
  planMassstabNenner,
  planMassstabText,
  type StromkreisPolzahl,
  type StromkreisWert,
  planspracheVon,
} from '../document-model'
import { SlotZielverwaltung } from './components/SlotZielverwaltung'
import { uebernehmeSlots } from './slots-uebernehmen'
import {
  erzeugeAnsteuerungAendernCommand,
  erzeugeKnxAendernCommand,
  erzeugeBlattAendernCommand,
  erzeugeGruppeBeitretenCommand,
  erzeugeGruppeErstellenCommand,
  erzeugeGruppeLoeschenCommand,
  erzeugeGruppeVerlassenCommand,
  erzeugeKomponenteAustauschenCommand,
  erzeugeObjektAendernCommand,
  erzeugeObjektAktualisierenCommand,
  erzeugeTypAendernCommand,
  erzeugeZeichnungAendernCommand,
  erzeugeSchachtAendernCommand,
  erzeugeSchachtVerbundUmbenennenCommand,
  erzeugeSchachtVerbundWechselCommand,
  erzeugeSwitchPortZuweisenCommand,
  erzeugeTrunkEigenschaftenSyncCommand,
  zaehleAnschluesseAmSchacht,
} from '../tools'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { KabeltypFeld } from './components/KabeltypFeld'
import { gleicheKabeltypenAb } from './kabeltyp-abgleich'
import { useFreigeschalteteModule } from './lizenz-module'
import { useUiStore } from './store/ui-store'
import { EntwurfsTextfeld } from './EntwurfsTextfeld'
import {
  KennzeichenFeld,
  KlemmenNummerFeld,
  VerteilerFelder,
  VerteilerplanFeld,
} from './KennzeichenFeld'
import { KnxAktorFelder } from './KnxAktorFelder'
import { VerteilerAnschlussFeld } from './VerteilerAnschlussFeld'
import { StromkreisInfo } from './StromkreisFeld'
import { AbgangsAusrichtungFeld, AbgangstextFelder } from './AbgangstextFelder'
import { useStromkreisZuordnungen } from './use-stromkreis-zuordnungen'
import { useKatalogStore } from './store/katalog-store'
import { useSettingsStore } from './store/settings-store'
import { anzeige } from './befehle/kuerzel'
import { GroessenFaktorFeld } from './GroessenFaktorFeld'
import { FuellungFelder } from './FuellungFelder'
import { ZahlenFeld, ZahlenFeldOptional } from './ZahlenFeld'
import { GeschossFelder } from './GeschossFelder'
import { TrunkAusfuehrungFelder } from './TrunkAusfuehrungFelder'
import { InstallationszoneFeld } from './InstallationszoneFeld'
import { NurInBauteilenFeld } from './NurInBauteilenFeld'
import { StrangNameFeld, StrangNamenAnObjekt } from './StrangNameFeld'
import { useFensterKlein } from './use-fenster-klein'
import { useSprache, useT } from './sprache-anbindung'
import { ansteuerungAnzeige, typAnzeige } from './regelwerk-anzeige'
import {
  SPRACH_EIGENNAMEN,
  SPRACHEN,
  SPRACHWAHL_FREIGEGEBEN,
  t as tAktuell,
  type Schluessel,
  type Sprache,
} from '../sprache'
import {
  IconEigenschaftenPanel,
  IconFang,
  IconHintergrund,
  IconObjektfang,
  IconRaster,
  IconSpurfang,
  IconHintergrundfang,
  IconWandfang,
} from './components/Icons'

const EINHEITEN: Einheit[] = ['mm', 'cm', 'm', 'km']

const LINIENTYP_FORMTYPEN: Objekt['type'][] = [
  'schaltverbindung',
  'linie',
  'polylinie',
  'rechteck',
  'wand',
  'treppe',
  'bodenplatte',
  'kreis',
  'bogen',
  'ellipse',
  'polygon',
]

const LINIENTYP_LABELS: Record<Linientyp, Schluessel> = {
  standard: 'eigenschaften.panel.linientyp.standard',
  gestrichelt: 'eigenschaften.panel.linientyp.gestrichelt',
  gepunktet: 'eigenschaften.panel.linientyp.gepunktet',
  strichpunkt: 'eigenschaften.panel.linientyp.strichpunkt',
}

function AnsichtSchalter() {
  const t = useT()
  const { commands, doc, settingsStore } = useAppContext()
  const blatt = useAktivesBlatt()
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
  const zeichnung = useProject()
  const eigenschaftenSichtbar = useSettingsStore((s) => s.eigenschaftenSichtbar)
  const toggleEigenschaftenSichtbar = useSettingsStore((s) => s.toggleEigenschaftenSichtbar)
  const belegung = useSettingsStore((s) => s.belegung)

  function toggleHintergrundSichtbar() {
    commands.execute(
      erzeugeBlattAendernCommand(doc, blatt.id, t('eigenschaften.panel.ansicht.hintergrundUndo'), {
        hintergrundSichtbar: !blatt.hintergrundSichtbar,
      }),
    )
  }

  function mitKuerzel(label: string, befehlId: string): string {
    const kuerzel = belegung[befehlId]
    return kuerzel ? `${label} (${anzeige(kuerzel)})` : label
  }

  return (
    <div
      className="properties-panel-kopf"
      role="toolbar"
      aria-label={t('eigenschaften.panel.ansicht.aria')}
    >
      <div className="toolbar-gruppe">
        <button
          type="button"
          className={`werkzeug-button nur-icon${rasterSichtbar ? ' aktiv' : ''}`}
          onClick={toggleRaster}
          title={mitKuerzel(t('eigenschaften.panel.ansicht.raster'), 'ansicht.raster')}
          aria-label={t('eigenschaften.panel.ansicht.raster')}
          aria-pressed={rasterSichtbar}
        >
          <IconRaster />
        </button>
        <button
          type="button"
          className={`werkzeug-button nur-icon${snapAktiv ? ' aktiv' : ''}`}
          onClick={toggleSnap}
          title={mitKuerzel(t('eigenschaften.panel.ansicht.fang'), 'ansicht.fang')}
          aria-label={t('eigenschaften.panel.ansicht.fang')}
          aria-pressed={snapAktiv}
        >
          <IconFang />
        </button>
        <button
          type="button"
          className={`werkzeug-button nur-icon${objektfangAktiv ? ' aktiv' : ''}`}
          onClick={toggleObjektfang}
          title={mitKuerzel(t('eigenschaften.panel.ansicht.objektfang'), 'ansicht.objektfang')}
          aria-label={t('eigenschaften.panel.ansicht.objektfang')}
          aria-pressed={objektfangAktiv}
        >
          <IconObjektfang />
        </button>
        <button
          type="button"
          className={`werkzeug-button nur-icon${spurfangAktiv ? ' aktiv' : ''}`}
          onClick={toggleSpurfang}
          disabled={!objektfangAktiv}
          title={mitKuerzel(t('eigenschaften.panel.ansicht.spurfangTitel'), 'ansicht.spurfang')}
          aria-label={t('eigenschaften.panel.ansicht.spurfang')}
          aria-pressed={spurfangAktiv}
        >
          <IconSpurfang />
        </button>
        {blatt.hintergrund && blatt.hintergrund.typ !== 'unbekannt' && (
          <button
            type="button"
            className={`werkzeug-button nur-icon${hintergrundfangAktiv ? ' aktiv' : ''}`}
            onClick={toggleHintergrundfang}
            disabled={!objektfangAktiv}
            title={mitKuerzel(
              t('eigenschaften.panel.ansicht.hintergrundfangTitel'),
              'ansicht.hintergrundfang',
            )}
            aria-label={t('eigenschaften.panel.ansicht.hintergrundfang')}
            aria-pressed={hintergrundfangAktiv}
          >
            <IconHintergrundfang />
          </button>
        )}
        {!istSchaltplan(zeichnung) && (
          <button
            type="button"
            className={`werkzeug-button nur-icon${wandfangAktiv ? ' aktiv' : ''}`}
            onClick={toggleWandfang}
            title={mitKuerzel(t('eigenschaften.panel.ansicht.wandfangTitel'), 'ansicht.wandfang')}
            aria-label={t('eigenschaften.panel.ansicht.wandfang')}
            aria-pressed={wandfangAktiv}
          >
            <IconWandfang />
          </button>
        )}
        {blatt.hintergrund && (
          <button
            type="button"
            className={`werkzeug-button nur-icon${blatt.hintergrundSichtbar ? ' aktiv' : ''}`}
            onClick={toggleHintergrundSichtbar}
            title={mitKuerzel(t('eigenschaften.panel.ansicht.hintergrund'), 'ansicht.hintergrund')}
            aria-label={t('eigenschaften.panel.ansicht.hintergrund')}
            aria-pressed={blatt.hintergrundSichtbar}
          >
            <IconHintergrund />
          </button>
        )}
      </div>
      <span className="toolbar-trenner toolbar-trenner--dehnbar" />
      <div className="toolbar-gruppe">
        <button
          type="button"
          className="werkzeug-button nur-icon"
          onClick={() => toggleEigenschaftenSichtbar(settingsStore)}
          title={
            eigenschaftenSichtbar
              ? t('eigenschaften.panel.ansicht.eigenschaftenAusblenden')
              : t('eigenschaften.panel.ansicht.eigenschaftenEinblenden')
          }
          aria-label={
            eigenschaftenSichtbar
              ? t('eigenschaften.panel.ansicht.eigenschaftenAusblenden')
              : t('eigenschaften.panel.ansicht.eigenschaftenEinblenden')
          }
        >
          <IconEigenschaftenPanel />
        </button>
      </div>
    </div>
  )
}

function PropertiesPanelInhalt({ schwebend = false }: { schwebend?: boolean }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const zeichnung = useProject()
  const auswahlIds = useUiStore((s) => s.auswahlIds)
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const freigeschaltet = useFreigeschalteteModule()
  const ausgewaehlt = blatt.objekte.filter((o) => auswahlIds.includes(o.id))
  const klasse = `properties-panel${schwebend ? ' properties-panel-schwebend' : ''}`

  function aktualisiereAusgewaehlte(
    patch: Partial<Objekt>,
    label: string,
    nurFuer: (o: Objekt) => boolean = () => true,
  ) {
    const ids = ausgewaehlt
      .filter((o) => istBearbeitbar(o, blatt.ebenen) && nurFuer(o))
      .map((o) => o.id)
    if (ids.length === 0) return
    commands.execute(
      erzeugeObjektAendernCommand(doc, blatt.id, label, (objekte) =>
        objekte.map((o) => (ids.includes(o.id) ? ({ ...o, ...patch } as Objekt) : o)),
      ),
    )
  }

  function setzeVariablenWertMehrfach(feldname: string, wert: string) {
    const ids = ausgewaehlt.filter((o) => istBearbeitbar(o, blatt.ebenen)).map((o) => o.id)
    if (ids.length === 0) return
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blatt.id,
        t('eigenschaften.panel.gemeinsam.textUndo'),
        (objekte) =>
          objekte.map((o) =>
            ids.includes(o.id) && o.type === 'komponente' && o.textElemente
              ? { ...o, textElemente: setzeVariablenWert(o.textElemente, feldname, wert) }
              : o,
          ),
      ),
    )
  }

  function setzeVariablenWertMitSlots(feldname: string, wert: string) {
    const komponenten = ausgewaehlt.filter(
      (o): o is Extract<Objekt, { type: 'komponente' }> =>
        o.type === 'komponente' && istBearbeitbar(o, blatt.ebenen),
    )
    if (komponenten.length === 0) return
    const ids = komponenten.map((o) => o.id)
    const aenderungen = new Map(
      komponenten.flatMap((o) => {
        const aenderung = slotAenderungFuerWert(o, feldname, wert)
        return aenderung ? [[o.id, aenderung] as const] : []
      }),
    )
    const anwenden = (mitSlots: boolean) =>
      commands.execute(
        erzeugeObjektAendernCommand(
          doc,
          blatt.id,
          t('eigenschaften.panel.gemeinsam.textUndo'),
          (objekte) =>
            objekte.map((o) => {
              if (!ids.includes(o.id) || o.type !== 'komponente' || !o.textElemente) return o
              const aenderung = mitSlots ? aenderungen.get(o.id) : undefined
              return {
                ...o,
                textElemente: setzeVariablenWert(o.textElemente, feldname, wert),
                ...(aenderung && { slots: aenderung.slots }),
                ...(aenderung?.slotMatrix && { slotMatrix: aenderung.slotMatrix }),
              }
            }),
        ),
      )
    const entfernt = [...aenderungen.values()].flatMap((a) => a.entfernteMitZielen)
    if (entfernt.length === 0) {
      anwenden(true)
      return
    }
    useUiStore.getState().oeffneBestaetigung({
      titel: t('eigenschaften.panel.slots.entfernenTitel'),
      nachricht: t('eigenschaften.panel.slots.verringertFrage', {
        feld: feldname,
        n: entfernt.length,
      }),
      bestaetigenText: t('eigenschaften.panel.slots.verkleinern'),
      destruktiv: true,
      callback: (bestaetigt) => anwenden(bestaetigt),
    })
  }

  const istEinzelTrunk = ausgewaehlt.length === 1 && ausgewaehlt[0].type === 'trunk'
  function aktualisiereFarbeStrichstaerke(
    patch: Partial<Pick<Objekt, 'farbe' | 'strichstaerke'>>,
    label: string,
  ) {
    if (istEinzelTrunk) {
      if (!istBearbeitbar(ausgewaehlt[0], blatt.ebenen)) return
      commands.execute(
        erzeugeTrunkEigenschaftenSyncCommand(doc, blatt.id, ausgewaehlt[0].id, patch, label),
      )
      return
    }
    aktualisiereAusgewaehlte(patch, label)
  }

  if (ausgewaehlt.length === 0) {
    const nurAnsicht = istNurAnsicht(blatt, freigeschaltet)
    return (
      <aside className={klasse} aria-label={t('eigenschaften.panel.aria')}>
        <AnsichtSchalter />
        <h2>{t('eigenschaften.panel.blatt.titel')}</h2>
        {nurAnsicht && <p className="feld-info">{t('eigenschaften.panel.blatt.nurAnsicht')}</p>}
        <fieldset disabled={nurAnsicht} className="eigenschaften-fieldset">
          <label className="feld">
            {t('eigenschaften.panel.gemeinsam.name')}
            <input
              value={blatt.name}
              onChange={(e) =>
                commands.execute(
                  erzeugeBlattAendernCommand(
                    doc,
                    blatt.id,
                    t('eigenschaften.panel.blatt.umbenennen'),
                    {
                      name: e.target.value,
                    },
                  ),
                )
              }
            />
          </label>
          <label className="feld">
            {t('eigenschaften.panel.blatt.einheit')}
            <select
              value={blatt.einheit}
              onChange={(e) =>
                commands.execute(
                  erzeugeBlattAendernCommand(
                    doc,
                    blatt.id,
                    t('eigenschaften.panel.blatt.einheitUndo'),
                    {
                      einheit: e.target.value as Einheit,
                    },
                  ),
                )
              }
            >
              {EINHEITEN.map((einheit) => (
                <option key={einheit} value={einheit}>
                  {einheit}
                </option>
              ))}
            </select>
          </label>
          <p className="feld-info">
            {t('eigenschaften.panel.blatt.massstab', {
              wert:
                blatt.hintergrund?.typ === 'ifc'
                  ? t('eigenschaften.panel.blatt.massstabIfc')
                  : planMassstabNenner(blatt) !== null
                    ? t(
                        blatt.hintergrund?.typ === 'pdf' &&
                          blatt.hintergrund.kalibrierung?.normmassstab
                          ? 'eigenschaften.panel.blatt.massstabPlanErkannt'
                          : 'eigenschaften.panel.blatt.massstabPlan',
                        { wert: planMassstabText(planMassstabNenner(blatt)!) },
                      )
                    : blatt.massstab
                      ? t('eigenschaften.panel.blatt.massstabRoh', {
                          wert: (1 / blatt.massstab).toFixed(1),
                        })
                      : t('eigenschaften.panel.blatt.keinHintergrund'),
            })}
          </p>
          <label className="feld">
            {t('eigenschaften.panel.blatt.aktiveEbene')}
            <select
              value={blatt.aktiveEbeneId}
              onChange={(e) =>
                commands.execute(
                  erzeugeBlattAendernCommand(
                    doc,
                    blatt.id,
                    t('eigenschaften.panel.blatt.aktiveEbeneUndo'),
                    {
                      aktiveEbeneId: e.target.value,
                    },
                  ),
                )
              }
            >
              {blatt.ebenen
                .filter((ebene) => !ebene.gesperrt)
                .map((ebene) => (
                  <option key={ebene.id} value={ebene.id}>
                    {ebene.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            className="feld-button"
            onClick={() => useUiStore.getState().setEbenenDialogOffen(true)}
          >
            {t('eigenschaften.panel.blatt.ebenenVerwalten')}
          </button>
          {!istSchaltplan(zeichnung) && <GeschossFelder blatt={blatt} />}
          {istSchaltplan(zeichnung) && <VerteilerplanFeld />}
          {SPRACHWAHL_FREIGEGEBEN && <PlanspracheFeld />}
        </fieldset>
        <p className="feld-info">
          {t('eigenschaften.panel.blatt.objekte', { n: blatt.objekte.length })}
        </p>
      </aside>
    )
  }

  const erstes = ausgewaehlt[0]
  const fuellbare = ausgewaehlt.filter(istFuellbar)
  const alleGesperrt = ausgewaehlt.every((o) => !istBearbeitbar(o, blatt.ebenen))

  return (
    <aside className={klasse} aria-label={t('eigenschaften.panel.aria')}>
      <AnsichtSchalter />
      <h2>
        {ausgewaehlt.length > 1
          ? t('eigenschaften.panel.gemeinsam.mehrereAusgewaehlt', { n: ausgewaehlt.length })
          : bezeichnungFuer(erstes)}
      </h2>
      {alleGesperrt && (
        <p className="feld-info">
          {ausgewaehlt.length > 1
            ? t('eigenschaften.panel.gemeinsam.gesperrtMehrere')
            : t('eigenschaften.panel.gemeinsam.gesperrtEins')}
        </p>
      )}
      {ausgewaehlt.length === 1 && erstes.ausBauteil && (
        <p className="feld-info">{ifcBauteilText(blatt, erstes.ausBauteil)}</p>
      )}
      <fieldset disabled={alleGesperrt} className="eigenschaften-fieldset">
        <label className="feld">
          {t('eigenschaften.panel.gemeinsam.farbe')}
          <input
            type="color"
            value={normFarbe(erstes.farbe)}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              aktualisiereFarbeStrichstaerke(
                { farbe: e.target.value },
                t('eigenschaften.panel.gemeinsam.farbeUndo'),
              )
            }
          />
        </label>
        {ausgewaehlt.every((o) => o.type === 'schaltverbindung') && (
          <div className="feld">
            {t('eigenschaften.panel.gemeinsam.leiterfarbe')}
            <div
              className="leiterfarben"
              role="group"
              aria-label={t('eigenschaften.panel.gemeinsam.leiterfarbe')}
            >
              {LEITER_FARBEN.map((l) => {
                const aktiv = hatLeiterfarbe(erstes as SchaltverbindungObjekt, l)
                return (
                  <button
                    key={l.name}
                    type="button"
                    className={`leiterfarbe${aktiv ? ' aktiv' : ''}`}
                    title={l.name}
                    aria-label={l.name}
                    aria-pressed={aktiv}
                    style={{
                      background: l.zweiteFarbe
                        ? `repeating-linear-gradient(90deg, ${l.farbe} 0 6px, ${l.zweiteFarbe} 6px 12px)`
                        : l.farbe,
                    }}
                    onClick={() =>
                      aktualisiereAusgewaehlte(
                        leiterfarbePatch(l),
                        t('eigenschaften.panel.gemeinsam.leiterfarbeUndo'),
                      )
                    }
                  />
                )
              })}
            </div>
          </div>
        )}
        <label className="feld">
          {t('eigenschaften.panel.gemeinsam.strichstaerke')}
          <ZahlenFeld
            min={0.5}
            step={0.5}
            value={erstes.strichstaerke}
            onCommit={(wert) =>
              aktualisiereFarbeStrichstaerke(
                { strichstaerke: wert },
                t('eigenschaften.panel.gemeinsam.strichstaerkeUndo'),
              )
            }
          />
        </label>
        {ausgewaehlt.every((o) => LINIENTYP_FORMTYPEN.includes(o.type)) && (
          <label className="feld">
            {t('eigenschaften.panel.gemeinsam.linientyp')}
            <select
              value={erstes.linientyp}
              onChange={(e) =>
                aktualisiereAusgewaehlte(
                  { linientyp: e.target.value as Linientyp },
                  t('eigenschaften.panel.gemeinsam.linientypUndo'),
                )
              }
            >
              {(Object.keys(LINIENTYP_LABELS) as Linientyp[]).map((typ) => (
                <option key={typ} value={typ}>
                  {t(LINIENTYP_LABELS[typ])}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="feld">
          {t('eigenschaften.panel.gemeinsam.ebene')}
          <select
            className="ebene-auswahl"
            value={ausgewaehlt.every((o) => o.ebeneId === erstes.ebeneId) ? erstes.ebeneId : ''}
            onChange={(e) =>
              aktualisiereAusgewaehlte(
                { ebeneId: e.target.value },
                t('eigenschaften.panel.gemeinsam.ebeneUndo'),
              )
            }
          >
            {!ausgewaehlt.every((o) => o.ebeneId === erstes.ebeneId) && (
              <option value="">{t('eigenschaften.panel.gemeinsam.verschieden')}</option>
            )}
            {blatt.ebenen
              .filter((ebene) => !ebene.istHintergrundLayer)
              .map((ebene) => (
                <option key={ebene.id} value={ebene.id}>
                  {ebene.name}
                </option>
              ))}
          </select>
        </label>
        {fuellbare.length > 0 && <FuellungFelder objekte={fuellbare} />}
        {ausgewaehlt.length === 1 && erstes.type === 'kreis' && (
          <label className="feld">
            {t('eigenschaften.panel.form.radius')}
            <ZahlenFeld
              min={0.01}
              step={0.05}
              value={erstes.radius}
              onCommit={(wert) =>
                aktualisiereAusgewaehlte({ radius: wert }, t('eigenschaften.panel.form.radiusUndo'))
              }
            />
          </label>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'rechteck' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.breiteM')}
              <ZahlenFeld
                min={0.01}
                step={0.05}
                value={erstes.breite}
                onCommit={(wert) =>
                  aktualisiereAusgewaehlte(
                    { breite: wert },
                    t('eigenschaften.panel.gemeinsam.breiteUndo'),
                  )
                }
              />
            </label>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.hoeheM')}
              <ZahlenFeld
                min={0.01}
                step={0.05}
                value={erstes.hoehe}
                onCommit={(wert) =>
                  aktualisiereAusgewaehlte(
                    { hoehe: wert },
                    t('eigenschaften.panel.gemeinsam.hoeheUndo'),
                  )
                }
              />
            </label>
            <DrehungFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'wand' && (
          <label className="feld">
            {t('eigenschaften.panel.form.wandstaerke')}
            <ZahlenFeld
              min={0.02}
              step={0.01}
              value={erstes.staerke}
              onCommit={(wert) =>
                aktualisiereAusgewaehlte(
                  { staerke: wert },
                  t('eigenschaften.panel.form.wandstaerkeUndo'),
                )
              }
            />
          </label>
        )}
        {ausgewaehlt.length === 1 &&
          (erstes.type === 'tuer' ||
            erstes.type === 'fenster' ||
            erstes.type === 'wanddurchbruch') && (
            <WandOeffnungFelder
              objekt={erstes}
              objekte={blatt.objekte}
              aktualisiere={aktualisiereAusgewaehlte}
            />
          )}
        {ausgewaehlt.length === 1 && erstes.type === 'raum' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.name')}
              <input
                value={erstes.name}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { name: e.target.value },
                    t('eigenschaften.panel.raum.nameUndo'),
                  )
                }
              />
            </label>
            <p className="feld-info">
              {t(
                erstes.gueltig
                  ? 'eigenschaften.panel.raum.flaeche'
                  : 'eigenschaften.panel.raum.flaecheUngueltig',
                { wert: erstes.flaeche.toFixed(1) },
              )}
            </p>
            <label className="feld">
              {t('eigenschaften.panel.raum.schriftgroesse')}
              <ZahlenFeld
                min={1}
                step={1}
                value={Math.round(erstes.schriftgroesse * 100)}
                onCommit={(cm) =>
                  aktualisiereAusgewaehlte(
                    { schriftgroesse: cm / 100 },
                    t('eigenschaften.panel.raum.schriftgroesseUndo'),
                  )
                }
              />
            </label>
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.gemeinsam.name')}
              wert={erstes.nameSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { nameSichtbar: v },
                  t('eigenschaften.panel.raum.nameSichtbarUndo'),
                )
              }
            />
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.raum.flaecheSichtbar')}
              wert={erstes.flaecheSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { flaecheSichtbar: v },
                  t('eigenschaften.panel.raum.flaecheSichtbarUndo'),
                )
              }
            />
            <label className="feld">
              {t('eigenschaften.panel.raum.deckenstaerke')}
              <ZahlenFeldOptional
                min={1}
                step={1}
                value={
                  erstes.deckenstaerke !== undefined
                    ? Math.round(erstes.deckenstaerke * 100)
                    : undefined
                }
                placeholder={t('eigenschaften.panel.raum.deckenstaerkeVorgabe', {
                  cm: Math.round(deckenstaerkeMeter(zeichnung, blatt) * 100),
                })}
                onCommit={(cm) =>
                  aktualisiereAusgewaehlte(
                    { deckenstaerke: cm !== null && cm > 0 ? cm / 100 : undefined },
                    t('eigenschaften.panel.raum.deckenstaerkeUndo'),
                  )
                }
              />
            </label>
            <label className="feld">
              {t('eigenschaften.panel.raum.stromkreisMit')}
              <select
                value={erstes.stromkreisMitRaumId ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { stromkreisMitRaumId: e.target.value || undefined },
                    t('eigenschaften.panel.raum.stromkreisUndo'),
                  )
                }
              >
                <option value="">{t('eigenschaften.panel.raum.stromkreisEigener')}</option>
                {blatt.objekte
                  .filter(
                    (o): o is Extract<Objekt, { type: 'raum' }> =>
                      o.type === 'raum' && o.id !== erstes.id,
                  )
                  .sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.trim() || t('eigenschaften.panel.raum.ohneName')}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'treppe' && (
          <TreppeFelder objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
        )}
        {erstes.type === 'bodenplatte' && ausgewaehlt.every((o) => o.type === 'bodenplatte') && (
          <BodenplatteFelder objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'bemassungsreihe' && (
          <BemassungsreiheFelder objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'ellipse' && (
          <DrehungFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'polygon' && (
          <DrehungFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'text' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.text.text')}
              <input
                value={erstes.inhalt}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { inhalt: e.target.value },
                    t('eigenschaften.panel.gemeinsam.textUndo'),
                  )
                }
              />
            </label>
            <label className="feld">
              {t('eigenschaften.panel.text.hoehe')}
              <ZahlenFeld
                min={0.01}
                step={0.01}
                value={erstes.hoehe}
                onCommit={(wert) =>
                  aktualisiereAusgewaehlte({ hoehe: wert }, t('eigenschaften.panel.text.hoeheUndo'))
                }
              />
            </label>
            <DrehungFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'potential' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.name')}
              <input
                value={erstes.name}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { name: e.target.value },
                    t('eigenschaften.panel.potential.umbenennen'),
                  )
                }
              />
            </label>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.beschreibung')}
              <input
                value={erstes.beschreibung ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { beschreibung: e.target.value || undefined },
                    t('eigenschaften.panel.potential.beschreibungUndo'),
                  )
                }
              />
            </label>
            <DrehungFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'knotenpunkt' && (
          <p className="feld-info">
            {t('eigenschaften.panel.knoten.info', {
              n: endenAmKnoten(blatt.objekte, erstes.id).length,
            })}
          </p>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'schaltverbindung' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.schaltverbindung.bezeichnung')}
              <input
                value={erstes.bezeichnung ?? ''}
                onChange={(e) => {
                  const netz = segmentNetz(blatt.objekte, erstes.id)
                  const bezeichnung = e.target.value || undefined
                  commands.execute(
                    erzeugeObjektAendernCommand(
                      doc,
                      blatt.id,
                      t('eigenschaften.panel.schaltverbindung.umbenennen'),
                      (objekte) =>
                        objekte.map((o) =>
                          o.type === 'schaltverbindung' &&
                          netz.has(o.id) &&
                          istBearbeitbar(o, blatt.ebenen)
                            ? { ...o, bezeichnung }
                            : o,
                        ),
                    ),
                  )
                }}
              />
            </label>
            {(() => {
              const anzahl = segmentNetz(blatt.objekte, erstes.id).size
              return anzahl > 1 ? (
                <p className="feld-info">
                  {t('eigenschaften.panel.schaltverbindung.netzHinweis', { n: anzahl })}
                </p>
              ) : null
            })()}
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.schaltverbindung.bezeichnung')}
              wert={erstes.bezeichnungSichtbar}
              aendern={(v) => {
                if (v !== false) {
                  aktualisiereAusgewaehlte(
                    { bezeichnungSichtbar: v },
                    t('eigenschaften.panel.schaltverbindung.sichtbarUndo'),
                  )
                  return
                }
                const netz = new Set(
                  ausgewaehlt.flatMap((o) => [...segmentNetz(blatt.objekte, o.id)]),
                )
                commands.execute(
                  erzeugeObjektAendernCommand(
                    doc,
                    blatt.id,
                    t('eigenschaften.panel.schaltverbindung.ausblendenUndo'),
                    (objekte) =>
                      objekte.map((o) =>
                        o.type === 'schaltverbindung' &&
                        netz.has(o.id) &&
                        istBearbeitbar(o, blatt.ebenen)
                          ? { ...o, bezeichnungSichtbar: false }
                          : o,
                      ),
                  ),
                )
              }}
            />
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.bezeichnungNurAmAnfang === true}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { bezeichnungNurAmAnfang: e.target.checked || undefined },
                    t('eigenschaften.panel.schaltverbindung.nurAmAnfangUndo'),
                  )
                }
              />
              {t('eigenschaften.panel.schaltverbindung.nurAmAnfang')}
            </label>
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.blattverweis === true}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { blattverweis: e.target.checked || undefined },
                    t('eigenschaften.panel.schaltverbindung.blattverweisUndo'),
                  )
                }
              />
              {t('eigenschaften.panel.schaltverbindung.blattverweis')}
            </label>
            <label className="feld">
              {t('eigenschaften.panel.schaltverbindung.unterbrechung')}
              <select
                value={erstes.unterbrechung ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    {
                      unterbrechung: (e.target.value || undefined) as
                        SchaltverbindungObjekt['unterbrechung'] | undefined,
                    },
                    t('eigenschaften.panel.schaltverbindung.unterbrechungUndo'),
                  )
                }
              >
                <option value="">
                  {t('eigenschaften.panel.schaltverbindung.unterbrechungKeine')}
                </option>
                <option value="quelle">
                  {t('eigenschaften.panel.schaltverbindung.unterbrechungQuelle')}
                </option>
                <option value="ziel">
                  {t('eigenschaften.panel.schaltverbindung.unterbrechungZiel')}
                </option>
              </select>
            </label>
            {erstes.unterbrechung && (
              <UnterbrechungsHinweis objektId={erstes.id} bezeichnung={erstes.bezeichnung} />
            )}
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.zweiteFarbe !== undefined}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { zweiteFarbe: e.target.checked ? '#f2c200' : undefined },
                    t('eigenschaften.panel.schaltverbindung.zweiteFarbeUndo'),
                  )
                }
              />
              {t('eigenschaften.panel.schaltverbindung.zweifarbig')}
            </label>
            {erstes.zweiteFarbe !== undefined && (
              <label className="feld">
                {t('eigenschaften.panel.schaltverbindung.zweiteFarbe')}
                <input
                  type="color"
                  value={normFarbe(erstes.zweiteFarbe)}
                  onChange={(e) =>
                    aktualisiereAusgewaehlte(
                      { zweiteFarbe: e.target.value },
                      t('eigenschaften.panel.schaltverbindung.zweiteFarbeUndo'),
                    )
                  }
                />
              </label>
            )}
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.beschreibung')}
              <input
                value={erstes.beschreibung ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { beschreibung: e.target.value || undefined },
                    t('eigenschaften.panel.schaltverbindung.beschreibungUndo'),
                  )
                }
              />
            </label>
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.autoRouting === true}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { autoRouting: e.target.checked || undefined },
                    e.target.checked
                      ? t('eigenschaften.panel.gemeinsam.autoVerlegenEin')
                      : t('eigenschaften.panel.gemeinsam.autoVerlegenAus'),
                  )
                }
              />
              {t('eigenschaften.panel.gemeinsam.autoVerlegen')}
            </label>
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'trunk' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.name')}
              <input
                value={erstes.name}
                onChange={(e) =>
                  commands.execute(
                    erzeugeTrunkEigenschaftenSyncCommand(
                      doc,
                      blatt.id,
                      erstes.id,
                      { name: e.target.value },
                      t('eigenschaften.panel.trunk.umbenennen'),
                    ),
                  )
                }
              />
              {trunkAnzeigeName(doc.getZeichnung(), blatt.id, erstes.id) !== erstes.name && (
                <span className="dialog-hinweis">
                  {t('eigenschaften.panel.trunk.teilstueck', {
                    name: trunkAnzeigeName(doc.getZeichnung(), blatt.id, erstes.id),
                  })}
                </span>
              )}
            </label>
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.trunk.bezeichnungSichtbar')}
              wert={erstes.bezeichnungSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { bezeichnungSichtbar: v },
                  t('eigenschaften.panel.trunk.bezeichnungSichtbarUndo'),
                )
              }
            />
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.beschreibung')}
              <input
                value={erstes.beschreibung ?? ''}
                onChange={(e) =>
                  commands.execute(
                    erzeugeTrunkEigenschaftenSyncCommand(
                      doc,
                      blatt.id,
                      erstes.id,
                      { beschreibung: e.target.value || undefined },
                      t('eigenschaften.panel.trunk.beschreibungUndo'),
                    ),
                  )
                }
              />
            </label>
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.gemeinsam.beschreibung')}
              wert={erstes.beschreibungSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { beschreibungSichtbar: v },
                  t('eigenschaften.panel.trunk.beschreibungSichtbarUndo'),
                )
              }
            />
            <TrunkAusfuehrungFelder key={erstes.id} blattId={blatt.id} trunk={erstes} />
            <StrangNamenAnObjekt objekt={erstes} />
          </>
        )}
        {!istSchaltplan(zeichnung) &&
          (ausgewaehlt.every((o) => o.type === 'leitung') ||
            ausgewaehlt.every((o) => o.type === 'trunk')) && (
            <InstallationszoneFeld
              objekte={ausgewaehlt as Extract<Objekt, { type: 'leitung' | 'trunk' }>[]}
              blatt={blatt}
              hinweis={
                erstes.type === 'trunk'
                  ? t('eigenschaften.panel.trunk.zoneHinweis')
                  : t('eigenschaften.panel.leitung.zoneHinweis')
              }
              aendern={(zone) =>
                aktualisiereAusgewaehlte(
                  erstes.type === 'leitung'
                    ? { installationszone: zone, teilstueckZonen: undefined }
                    : { installationszone: zone },
                  t('eigenschaften.panel.leitung.zoneUndo'),
                )
              }
            />
          )}
        {!istSchaltplan(zeichnung) && ausgewaehlt.every((o) => o.type === 'leitung') && (
          <NurInBauteilenFeld leitungen={ausgewaehlt as LeitungsObjekt[]} blatt={blatt} />
        )}
        {!istSchaltplan(zeichnung) &&
          ausgewaehlt.length === 1 &&
          erstes.type === 'leitung' &&
          (() => {
            const anzahl = freieStuecke(erstes, blatt.objekte).filter((t) => t.zone).length
            if (anzahl === 0) return null
            return (
              <p className="feld-info">
                {t('eigenschaften.panel.leitung.teilstueckZonen', { n: anzahl })}{' '}
                <button
                  type="button"
                  className="knopf-verlinkt"
                  onClick={() =>
                    aktualisiereAusgewaehlte(
                      { teilstueckZonen: undefined },
                      t('eigenschaften.panel.leitung.teilstueckZonenUndo'),
                    )
                  }
                >
                  {t('eigenschaften.panel.gemeinsam.zuruecksetzen')}
                </button>
              </p>
            )
          })()}
        {ausgewaehlt.length === 1 && erstes.type === 'kabelschacht' && (
          <KabelschachtFelder objekt={erstes} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'komponente' && (
          <KomponentenFelder
            objekt={erstes}
            blattId={blatt.id}
            zeichnung={zeichnung}
            katalogKomponenten={katalogKomponenten}
            aktualisiere={aktualisiereAusgewaehlte}
            setzeGekoppelt={setzeVariablenWertMitSlots}
          />
        )}
        {ausgewaehlt.length > 1 && ausgewaehlt.every((o) => o.type === 'komponente') && (
          <KomponentenMehrfachFelder
            objekte={ausgewaehlt as Extract<Objekt, { type: 'komponente' }>[]}
            zeichnung={zeichnung}
            aktualisiere={aktualisiereAusgewaehlte}
          />
        )}
        {ausgewaehlt.length > 1 && ausgewaehlt.every((o) => o.type === 'komponente') && (
          <VariableTexteMehrfachFelder
            objekte={ausgewaehlt as Extract<Objekt, { type: 'komponente' }>[]}
            setzeWert={setzeVariablenWertMehrfach}
            setzeGekoppelt={setzeVariablenWertMitSlots}
          />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'plankopf' && (
          <PlankopfFelder objekt={erstes} blattId={blatt.id} />
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'stueckliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.stuecklisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.nurDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={stuecklistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'leitungsliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.leitungslisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.kabelDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={leitungslistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.stromkreisSpalte !== false}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { stromkreisSpalte: e.target.checked ? undefined : false },
                    t('eigenschaften.panel.liste.stromkreisSpalteUndo'),
                  )
                }
              />
              {t('eigenschaften.panel.liste.stromkreisSpalte')}
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
            <AnschlussreserveFeld />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'trunkliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.trunklisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.nurDieseEtage')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.trunkKomplett')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={trunklistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'raumliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.raumlisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.nurDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={raumlistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'betriebsmittelliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.betriebsmittellisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.nurDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={betriebsmittellistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 &&
          (erstes.type === 'stromkreisverzeichnis' || erstes.type === 'aktorkanalliste') && (
            <StromkreisverzeichnisFelder objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          )}
        {ausgewaehlt.length === 1 && erstes.type === 'potentialliste' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.potentiallisteUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.nurDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={potentiallistenTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'steuerungslogik' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.liste.steuerungslogikUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.liste.quellenDiesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={steuerungslogikTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={erstes.unbelegteSlotsAusblenden}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { unbelegteSlotsAusblenden: e.target.checked },
                    e.target.checked
                      ? t('eigenschaften.panel.liste.unbelegteSlots')
                      : t('eigenschaften.panel.liste.unbelegteSlotsEinUndo'),
                  )
                }
              />
              {t('eigenschaften.panel.liste.unbelegteSlots')}
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'leitungsbaum' && (
          <>
            <label className="feld">
              {t('eigenschaften.panel.leitungsbaum.gliederung')}
              <select
                value={erstes.gliederung}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { gliederung: e.target.value as 'trunk' | 'verteiler' },
                    t('eigenschaften.panel.leitungsbaum.gliederungUndo'),
                  )
                }
              >
                <option value="trunk">{t('eigenschaften.panel.leitungsbaum.nachTrunk')}</option>
                <option value="verteiler">
                  {t('eigenschaften.panel.leitungsbaum.nachVerteiler')}
                </option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.liste.umfang')}
              <select
                value={erstes.umfang}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { umfang: e.target.value as 'blatt' | 'projekt' },
                    t('eigenschaften.panel.leitungsbaum.umfangUndo'),
                  )
                }
              >
                <option value="blatt">{t('eigenschaften.panel.leitungsbaum.diesesBlatt')}</option>
                <option value="projekt">{t('eigenschaften.panel.liste.gesamteZeichnung')}</option>
              </select>
            </label>
            <label className="feld">
              {t('eigenschaften.panel.leitungsbaum.titelAutomatisch')}
              <input
                value={erstes.titel ?? ''}
                placeholder={leitungsbaumTitel(erstes)}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            {erstes.gliederung === 'verteiler' && (
              <label className="feld feld-checkbox">
                <input
                  type="checkbox"
                  checked={erstes.trunksAnzeigen}
                  onChange={(e) =>
                    aktualisiereAusgewaehlte(
                      { trunksAnzeigen: e.target.checked },
                      e.target.checked
                        ? t('eigenschaften.panel.leitungsbaum.trunksEinUndo')
                        : t('eigenschaften.panel.leitungsbaum.trunksAusUndo'),
                    )
                  }
                />
                {t('eigenschaften.panel.leitungsbaum.trunksAnzeigen')}
              </label>
            )}
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
            <EinpassenFelder objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'switchplan' && (
          <>
            <SwitchAuswahlFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
            <label className="feld">
              {erstes.planArt === 'patchpanel'
                ? t('eigenschaften.panel.switchplan.titelPatchpanel')
                : t('eigenschaften.panel.switchplan.titelSwitch')}
              <input
                value={erstes.titel ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { titel: e.target.value || null },
                    t('eigenschaften.panel.gemeinsam.titelUndo'),
                  )
                }
              />
            </label>
            <TexthoeheFeld objekt={erstes} aktualisiere={aktualisiereAusgewaehlte} />
          </>
        )}
        {ausgewaehlt.length === 1 && erstes.type === 'leitung' && (
          <>
            <p className="feld-info">
              {t('eigenschaften.panel.leitung.kabelnummer', { nummer: String(erstes.nummer) })}
            </p>
            <StrangNamenAnObjekt objekt={erstes} />
            <LeitungsLaengeFelder blattId={blatt.id} leitungId={erstes.id} />
            {!istSchaltplan(zeichnung) && <VerlegungsHinweise ids={[erstes.id]} />}
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.leitung.bezeichnungSichtbar')}
              wert={erstes.bezeichnungSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { bezeichnungSichtbar: v },
                  t('eigenschaften.panel.leitung.bezeichnungSichtbarUndo'),
                )
              }
            />
            <KabeltypFeld
              titel={t('eigenschaften.panel.leitung.kabeltyp')}
              wertId={erstes.kabeltypId}
              freierText={erstes.typ}
              zusatzTypen={zeichnung.kabeltypen}
              aendern={(wahl) => {
                aktualisiereAusgewaehlte(wahl, t('eigenschaften.panel.leitung.kabeltypUndo'))
                gleicheKabeltypenAb(doc)
              }}
            />
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.leitung.typSichtbar')}
              wert={erstes.typSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { typSichtbar: v },
                  t('eigenschaften.panel.leitung.typSichtbarUndo'),
                )
              }
            />
            <label className="feld">
              {t('eigenschaften.panel.gemeinsam.beschreibung')}
              <input
                value={erstes.beschreibung ?? ''}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { beschreibung: e.target.value || undefined },
                    t('eigenschaften.panel.leitung.beschreibungUndo'),
                  )
                }
              />
            </label>
            <SichtbarkeitFeld
              titel={t('eigenschaften.panel.gemeinsam.beschreibung')}
              wert={erstes.beschreibungSichtbar}
              aendern={(v) =>
                aktualisiereAusgewaehlte(
                  { beschreibungSichtbar: v },
                  t('eigenschaften.panel.leitung.beschreibungSichtbarUndo'),
                )
              }
            />
            <label className="feld feld-checkbox">
              <input
                type="checkbox"
                checked={!erstes.autoRoutingAus}
                onChange={(e) =>
                  aktualisiereAusgewaehlte(
                    { autoRoutingAus: !e.target.checked },
                    e.target.checked
                      ? t('eigenschaften.panel.gemeinsam.autoVerlegenEin')
                      : t('eigenschaften.panel.gemeinsam.autoVerlegenAus'),
                  )
                }
              />
              {t('eigenschaften.panel.gemeinsam.autoVerlegen')}
            </label>
            {erstes.ziel.art === 'switchport' && (
              <SwitchPortFeld leitung={erstes} blattId={blatt.id} />
            )}
            <VerteilerAnschlussFeld leitung={erstes} blattId={blatt.id} />
            <StromkreisInfo objektId={erstes.id} art="leitung" />
          </>
        )}
      </fieldset>
    </aside>
  )
}

export function PropertiesPanel() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const sichtbar = useSettingsStore((s) => s.eigenschaftenSichtbar)
  const toggleSichtbar = useSettingsStore((s) => s.toggleEigenschaftenSichtbar)
  const fensterKlein = useFensterKlein()
  const [schwebtBeimUeberfahren, setSchwebtBeimUeberfahren] = useState(false)
  const versteckt = !sichtbar || fensterKlein

  const [vorherVersteckt, setVorherVersteckt] = useState(versteckt)
  if (versteckt !== vorherVersteckt) {
    setVorherVersteckt(versteckt)
    if (!versteckt) setSchwebtBeimUeberfahren(false)
  }

  if (!versteckt) return <PropertiesPanelInhalt />

  return (
    <div
      className="eigenschaften-rand-zone"
      onMouseEnter={() => setSchwebtBeimUeberfahren(true)}
      onMouseLeave={() => setSchwebtBeimUeberfahren(false)}
    >
      <button
        type="button"
        className="eigenschaften-griff"
        onClick={() => toggleSichtbar(settingsStore)}
        title={
          sichtbar
            ? t('eigenschaften.panel.ansicht.eigenschaftenAusblenden')
            : t('eigenschaften.panel.ansicht.eigenschaftenEinblenden')
        }
        aria-label={
          sichtbar
            ? t('eigenschaften.panel.ansicht.eigenschaftenAusblenden')
            : t('eigenschaften.panel.ansicht.eigenschaftenEinblenden')
        }
      >
        <IconEigenschaftenPanel />
      </button>
      {schwebtBeimUeberfahren && <PropertiesPanelInhalt schwebend />}
    </div>
  )
}

function KomponentenFelder({
  objekt,
  blattId,
  zeichnung,
  katalogKomponenten,
  aktualisiere,
  setzeGekoppelt,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  blattId: string
  zeichnung: Zeichnung
  katalogKomponenten: ReturnType<typeof useKatalogStore.getState>['komponenten']
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
  setzeGekoppelt: (feldname: string, wert: string) => void
}) {
  const t = useT()
  const sprache = useSprache()
  const katalogEintrag = katalogKomponenten.find((k) => k.id === objekt.catalogComponentId)
  const aufgeloest = katalogEintrag
    ? aufgeloesteVariante(katalogEintrag, objekt.variantId, sprache)
    : null
  const mitInstallationshoehe = !istSchaltplan(zeichnung)

  return (
    <>
      <p className="feld-info">
        {aufgeloest
          ? aufgeloest.farbe
            ? t('eigenschaften.panel.komponente.katalogMitFarbe', {
                name: aufgeloest.name,
                farbe: aufgeloest.farbe,
              })
            : t('eigenschaften.panel.komponente.katalog', { name: aufgeloest.name })
          : t('eigenschaften.panel.komponente.referenzFehlt')}
      </p>
      {objekt.traegerId !== undefined ? (
        <p className="feld-info">{t('eigenschaften.panel.komponente.aufgesetzt')}</p>
      ) : (
        <DrehungFeld objekt={objekt} aktualisiere={aktualisiere} />
      )}
      <label className="feld">
        {t('eigenschaften.panel.komponente.beschriftung')}
        <input
          value={objekt.beschriftung ?? ''}
          onChange={(e) =>
            aktualisiere(
              { beschriftung: e.target.value || undefined },
              t('eigenschaften.panel.komponente.beschriftungUndo'),
            )
          }
        />
      </label>
      {objekt.verteiler ? (
        <VerteilerFelder objekt={objekt} blattId={blattId} />
      ) : (
        (objekt.geraeteKennzeichen !== undefined || katalogEintrag?.kennzeichenBuchstabe) && (
          <>
            <KennzeichenFeld objekt={objekt} blattId={blattId} />
            {istKlemme(objekt) && <KlemmenNummerFeld objekt={objekt} blattId={blattId} />}
          </>
        )
      )}
      {objekt.knxAktor && (
        <KnxAktorFelder objekt={{ ...objekt, knxAktor: objekt.knxAktor }} blattId={blattId} />
      )}
      <StromkreisInfo objektId={objekt.id} art="komponente" />
      <AbgangstextFelder objekt={objekt} aktualisiere={aktualisiere} />
      {mitInstallationshoehe && <MontageortFeld objekte={[objekt]} aktualisiere={aktualisiere} />}
      {mitInstallationshoehe && <VerlegungFeld objekte={[objekt]} />}
      {mitInstallationshoehe && <VerlegungsHinweise ids={[objekt.id]} />}
      {mitInstallationshoehe && !objekt.verteiler && !objekt.knxAktor && (
        <StromkreisEigenschaftFeld objekte={[objekt]} aktualisiere={aktualisiere} />
      )}
      {mitInstallationshoehe && montageortVon(objekt) === 'wand' && (
        <InstallationshoeheFeld objekte={[objekt]} aktualisiere={aktualisiere} />
      )}
      {!objekt.knxAktor && (
        <label className="feld">
          {t('eigenschaften.panel.komponente.darstellung')}
          <select
            value={objekt.darstellung ?? 'global'}
            onChange={(e) =>
              aktualisiere(
                {
                  darstellung:
                    e.target.value === 'global'
                      ? undefined
                      : (e.target.value as KomponentenDarstellung),
                },
                t('eigenschaften.panel.komponente.darstellungUndo'),
              )
            }
          >
            <option value="global">{t('eigenschaften.panel.sichtbarkeit.wieGlobal')}</option>
            <option value="symbol">{t('eigenschaften.panel.komponente.schaltplansymbol')}</option>
            <option value="bild">{t('eigenschaften.panel.komponente.produktbild')}</option>
          </select>
        </label>
      )}
      {!objekt.knxAktor && (
        <TexteFelder objekt={objekt} aktualisiere={aktualisiere} setzeGekoppelt={setzeGekoppelt} />
      )}
      {!objekt.knxAktor && <AnschlussFelder objekt={objekt} aktualisiere={aktualisiere} />}
      {(objekt.verteiler || objekt.geraeteKennzeichen) && (
        <SichtbarkeitFeld
          titel={t('eigenschaften.panel.komponente.kennzeichen')}
          wert={objekt.kennzeichenSichtbar}
          aendern={(v) =>
            aktualisiere(
              { kennzeichenSichtbar: v },
              t('eigenschaften.panel.komponente.kennzeichenUndo'),
            )
          }
        />
      )}
      <StromkreisSichtbarkeit objekt={objekt} aktualisiere={aktualisiere} />
      {!objekt.knxAktor && (
        <SichtbarkeitFeld
          titel={t('eigenschaften.panel.komponente.bezeichnung')}
          wert={objekt.bezeichnungSichtbar}
          aendern={(v) =>
            aktualisiere(
              { bezeichnungSichtbar: v },
              t('eigenschaften.panel.komponente.bezeichnungUndo'),
            )
          }
        />
      )}
      <SichtbarkeitFeld
        titel={t('eigenschaften.panel.komponente.beschriftungSichtbar')}
        wert={objekt.beschriftungSichtbar}
        aendern={(v) =>
          aktualisiere(
            { beschriftungSichtbar: v },
            t('eigenschaften.panel.komponente.beschriftungSichtbarUndo'),
          )
        }
      />
      {mitInstallationshoehe && (
        <SichtbarkeitFeld
          titel={t('eigenschaften.panel.komponente.installationshoehe')}
          wert={objekt.installationshoeheSichtbar}
          aendern={(v) =>
            aktualisiere(
              { installationshoeheSichtbar: v },
              t('eigenschaften.panel.komponente.installationshoeheSichtbarUndo'),
            )
          }
        />
      )}
      <GroessenFaktorFeld objekte={[objekt]} feld="textGroessenFaktor" />
      <GroessenFaktorFeld objekte={[objekt]} feld="symbolGroessenFaktor" />
      {istSwitchOderPatchpanelKomponente(objekt) && <SwitchAustauschenFeld objekt={objekt} />}
      <GeraetegruppenFelder objekt={objekt} blattId={blattId} zeichnung={zeichnung} />
    </>
  )
}

function gemeinsamerWert<O, W>(objekte: readonly O[], wertVon: (o: O) => W): W | null {
  const werte = new Set(objekte.map(wertVon))
  return werte.size === 1 ? [...werte][0] : null
}

function KomponentenMehrfachFelder({
  objekte,
  zeichnung,
  aktualisiere,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
  zeichnung: Zeichnung
  aktualisiere: (patch: Partial<Objekt>, label: string, nurFuer?: (o: Objekt) => boolean) => void
}) {
  const t = useT()
  const mitInstallationshoehe = !istSchaltplan(zeichnung)
  const drehbare = objekte.filter((o) => o.traegerId === undefined)
  const drehungGrad = gemeinsamerWert(drehbare, (o) => Math.round(toDegrees(o.drehung)))
  const beschriftung = gemeinsamerWert(objekte, (o) => o.beschriftung ?? '')
  const darstellung = gemeinsamerWert(objekte, (o) => o.darstellung ?? 'global')

  return (
    <>
      <p className="feld-info">{t('eigenschaften.panel.komponente.mehrfach')}</p>
      {drehbare.length > 0 && (
        <label className="feld">
          {t('eigenschaften.panel.gemeinsam.drehung')}
          <ZahlenFeldOptional
            step={5}
            value={drehungGrad}
            placeholder={t('eigenschaften.panel.gemeinsam.verschieden')}
            onCommit={(grad) => {
              if (grad === null) return
              aktualisiere(
                { drehung: toRadians(grad) },
                t('eigenschaften.panel.gemeinsam.drehungUndo'),
                (o) => o.type === 'komponente' && o.traegerId === undefined,
              )
            }}
          />
        </label>
      )}
      <label className="feld">
        {t('eigenschaften.panel.komponente.beschriftung')}
        <input
          value={beschriftung ?? ''}
          placeholder={
            beschriftung === null ? t('eigenschaften.panel.gemeinsam.verschieden') : undefined
          }
          onChange={(e) =>
            aktualisiere(
              { beschriftung: e.target.value || undefined },
              t('eigenschaften.panel.komponente.beschriftungUndo'),
            )
          }
        />
      </label>
      {mitInstallationshoehe && <MontageortFeld objekte={objekte} aktualisiere={aktualisiere} />}
      {mitInstallationshoehe && <VerlegungFeld objekte={objekte} />}
      {mitInstallationshoehe && objekte.every((o) => !o.verteiler && !o.knxAktor) && (
        <StromkreisEigenschaftFeld objekte={objekte} aktualisiere={aktualisiere} />
      )}
      {zeichnung.verteilerKennzeichen && <AbgangsAusrichtungFeld objekte={objekte} />}
      {mitInstallationshoehe && objekte.every((o) => montageortVon(o) === 'wand') && (
        <InstallationshoeheFeld objekte={objekte} aktualisiere={aktualisiere} />
      )}
      <label className="feld">
        {t('eigenschaften.panel.komponente.darstellung')}
        <select
          value={darstellung ?? ''}
          onChange={(e) => {
            if (!e.target.value) return
            aktualisiere(
              {
                darstellung:
                  e.target.value === 'global'
                    ? undefined
                    : (e.target.value as KomponentenDarstellung),
              },
              t('eigenschaften.panel.komponente.darstellungUndo'),
            )
          }}
        >
          {darstellung === null && (
            <option value="">{t('eigenschaften.panel.gemeinsam.verschieden')}</option>
          )}
          <option value="global">{t('eigenschaften.panel.sichtbarkeit.wieGlobal')}</option>
          <option value="symbol">{t('eigenschaften.panel.komponente.schaltplansymbol')}</option>
          <option value="bild">{t('eigenschaften.panel.komponente.produktbild')}</option>
        </select>
      </label>
      <SichtbarkeitFeld
        titel={t('eigenschaften.panel.komponente.bezeichnung')}
        wert={gemeinsamerWert(objekte, (o) => o.bezeichnungSichtbar)}
        aendern={(v) =>
          aktualisiere(
            { bezeichnungSichtbar: v },
            t('eigenschaften.panel.komponente.bezeichnungUndo'),
          )
        }
      />
      <SichtbarkeitFeld
        titel={t('eigenschaften.panel.komponente.beschriftungSichtbar')}
        wert={gemeinsamerWert(objekte, (o) => o.beschriftungSichtbar)}
        aendern={(v) =>
          aktualisiere(
            { beschriftungSichtbar: v },
            t('eigenschaften.panel.komponente.beschriftungSichtbarUndo'),
          )
        }
      />
      {mitInstallationshoehe && (
        <SichtbarkeitFeld
          titel={t('eigenschaften.panel.komponente.installationshoehe')}
          wert={gemeinsamerWert(objekte, (o) => o.installationshoeheSichtbar)}
          aendern={(v) =>
            aktualisiere(
              { installationshoeheSichtbar: v },
              t('eigenschaften.panel.komponente.installationshoeheSichtbarUndo'),
            )
          }
        />
      )}
      <GroessenFaktorFeld objekte={objekte} feld="textGroessenFaktor" />
      <GroessenFaktorFeld objekte={objekte} feld="symbolGroessenFaktor" />
    </>
  )
}

function montageortVon(objekt: Extract<Objekt, { type: 'komponente' }>): Montageort {
  return objekt.montageort ?? 'wand'
}

function MontageortFeld({
  objekte,
  aktualisiere,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const orte = new Set(objekte.map(montageortVon))
  const wert = orte.size === 1 ? [...orte][0] : ''
  return (
    <label className="feld">
      {t('eigenschaften.panel.montageort.titel')}
      <select
        value={wert}
        onChange={(e) => {
          const ort = e.target.value as Montageort | ''
          if (!ort) return
          aktualisiere(
            { montageort: ort === 'wand' ? undefined : ort },
            t('eigenschaften.panel.montageort.undo'),
          )
        }}
      >
        {wert === '' && (
          <option value="">{t('eigenschaften.panel.gemeinsam.unterschiedlich')}</option>
        )}
        <option value="decke">{t('eigenschaften.panel.montageort.decke')}</option>
        <option value="wand">{t('eigenschaften.panel.montageort.wand')}</option>
        <option value="boden">{t('eigenschaften.panel.montageort.boden')}</option>
      </select>
    </label>
  )
}

function StromkreisEigenschaftFeld({
  objekte,
  aktualisiere,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  type Auswahl = 'vorgabe' | 'kein' | 'raum' | 'nummer' | 'eigen'
  const auswahlVon = (o: (typeof objekte)[number]): Auswahl =>
    o.stromkreis === undefined
      ? 'vorgabe'
      : typeof o.stromkreis === 'number'
        ? 'nummer'
        : o.stromkreis
  const auswahl = gemeinsamerWert(objekte, auswahlVon)
  const vorgabe = gemeinsamerWert(objekte, (o) => stromkreisVorgabe(o, zeichnung, katalog))
  const nummer = gemeinsamerWert(objekte, (o) =>
    typeof o.stromkreis === 'number' ? o.stromkreis : null,
  )
  const wirksam = new Set(objekte.map((o) => wirksamerStromkreis(o, zeichnung, katalog)))
  const polzahl = gemeinsamerWert(objekte, (o) =>
    o.stromkreisPolzahl ? String(o.stromkreisPolzahl) : 'vorgabe',
  )
  const polzahlVorgabe = gemeinsamerWert(objekte, (o) =>
    wirksamePolzahl({ ...o, stromkreisPolzahl: undefined }, katalog),
  )
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.stromkreis.titel')}
        <select
          value={auswahl ?? ''}
          onChange={(e) => {
            const wert = e.target.value as Auswahl | ''
            if (!wert) return
            const stromkreis: StromkreisWert | undefined =
              wert === 'vorgabe' ? undefined : wert === 'nummer' ? (nummer ?? 1) : wert
            aktualisiere({ stromkreis }, t('eigenschaften.panel.stromkreis.undo'))
          }}
        >
          {auswahl === null && (
            <option value="">{t('eigenschaften.panel.gemeinsam.unterschiedlich')}</option>
          )}
          <option value="vorgabe">
            {vorgabe
              ? t('eigenschaften.panel.stromkreis.vorgabeMit', {
                  wert: stromkreisWertText(vorgabe),
                })
              : t('eigenschaften.panel.stromkreis.vorgabe')}
          </option>
          <option value="kein">{t('eigenschaften.panel.stromkreis.kein')}</option>
          <option value="raum">{t('eigenschaften.panel.stromkreis.raum')}</option>
          <option value="nummer">
            {t('eigenschaften.panel.stromkreis.nummer', { max: STROMKREIS_NUMMER_MAX })}
          </option>
          <option value="eigen">{t('eigenschaften.panel.stromkreis.eigen')}</option>
        </select>
      </label>
      {auswahl === 'nummer' && (
        <label className="feld">
          {t('eigenschaften.panel.stromkreis.nummerImRaum')}
          <ZahlenFeldOptional
            min={1}
            max={STROMKREIS_NUMMER_MAX}
            step={1}
            value={nummer ?? undefined}
            placeholder={t('eigenschaften.panel.gemeinsam.verschieden')}
            onCommit={(n) => {
              if (n === null) return
              const wert = Math.min(STROMKREIS_NUMMER_MAX, Math.max(1, Math.round(n)))
              aktualisiere({ stromkreis: wert }, t('eigenschaften.panel.stromkreis.undo'))
            }}
          />
        </label>
      )}
      {wirksam.size === 1 && wirksam.has('eigen') && (
        <label className="feld">
          {t('eigenschaften.panel.stromkreis.polzahl')}
          <select
            value={polzahl ?? ''}
            onChange={(e) => {
              const wert = e.target.value
              if (!wert) return
              aktualisiere(
                {
                  stromkreisPolzahl:
                    wert === 'vorgabe' ? undefined : (Number(wert) as StromkreisPolzahl),
                },
                t('eigenschaften.panel.stromkreis.polzahlUndo'),
              )
            }}
          >
            {polzahl === null && (
              <option value="">{t('eigenschaften.panel.gemeinsam.unterschiedlich')}</option>
            )}
            <option value="vorgabe">
              {polzahlVorgabe
                ? t('eigenschaften.panel.stromkreis.vorgabeMit', { wert: `${polzahlVorgabe}~` })
                : t('eigenschaften.panel.stromkreis.vorgabe')}
            </option>
            <option value="1">1~</option>
            <option value="3">3~</option>
          </select>
        </label>
      )}
    </>
  )
}

function VerlegungFeld({
  objekte,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const arten = new Set(objekte.map(verlegungVon))
  const wert = arten.size === 1 ? [...arten][0] : ''
  return (
    <label className="feld">
      {t('eigenschaften.panel.verlegung.titel')}
      <select
        value={wert}
        onChange={(e) => {
          const verlegung = e.target.value as ZonenVerlegung | ''
          if (!verlegung) return
          const ids = new Set(
            objekte.filter((o) => istBearbeitbar(o, blatt.ebenen)).map((o) => o.id),
          )
          if (ids.size === 0) return
          commands.execute(
            erzeugeObjektAendernCommand(
              doc,
              blatt.id,
              t('eigenschaften.panel.verlegung.undo'),
              (alle) => setzeVerlegung(alle, ids, verlegung),
            ),
          )
        }}
      >
        {wert === '' && (
          <option value="">{t('eigenschaften.panel.gemeinsam.unterschiedlich')}</option>
        )}
        <option value="auf">{t('eigenschaften.panel.verlegung.auf')}</option>
        <option value="in">{t('eigenschaften.panel.verlegung.in')}</option>
      </select>
    </label>
  )
}

function VerlegungsHinweise({ ids }: { ids: readonly string[] }) {
  const t = useT()
  const sprache = useSprache()
  const blatt = useAktivesBlatt()
  const zeichnung = useProject()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const abweichungen = verlegungsAbweichungen(blatt, zeichnung, new Set(ids))
  if (abweichungen.length === 0) return null
  const name = (komponenteId: string) => {
    const k = blatt.objekte.find((o) => o.id === komponenteId)
    const eintrag =
      k?.type === 'komponente'
        ? katalogKomponenten.find((c) => c.id === k.catalogComponentId)
        : undefined
    return eintrag && k?.type === 'komponente'
      ? aufgeloesteVariante(eintrag, k.variantId, sprache).name
      : t('eigenschaften.panel.komponente.ohneName')
  }
  const ap = (v: ZonenVerlegung) => verlegungsKuerzel(v)
  const anKomponente = ids.some((id) => abweichungen.some((a) => a.komponenteId === id))
  let zeilen: string[]
  if (anKomponente && abweichungen.length >= 3) {
    const a = abweichungen[0]
    zeilen = [
      t('eigenschaften.panel.verlegung.mehrere', {
        n: abweichungen.length,
        kabelArt: ap(a.leitung),
        geraetArt: ap(a.komponente),
      }),
    ]
  } else if (anKomponente) {
    zeilen = abweichungen.map((a) =>
      t('eigenschaften.panel.verlegung.leitung', {
        nummer: String(a.leitungNummer),
        kabelArt: ap(a.leitung),
        geraetArt: ap(a.komponente),
      }),
    )
  } else {
    zeilen = abweichungen.map((a) =>
      t('eigenschaften.panel.verlegung.ende', {
        name: name(a.komponenteId),
        geraetArt: ap(a.komponente),
        kabelArt: ap(a.leitung),
      }),
    )
  }
  return (
    <>
      {zeilen.map((z) => (
        <p key={z} className="feld-info feld-info-warnung">
          {z}
        </p>
      ))}
    </>
  )
}

function InstallationshoeheFeld({
  objekte,
  aktualisiere,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const vorgaben = useSettingsStore((s) => s.installationshoehenVorgabenCm)
  const hoehen = new Set(
    objekte.map((o) =>
      o.installationshoehe != null ? Math.round(o.installationshoehe * 100) : null,
    ),
  )
  const unterschiedlich = hoehen.size > 1
  const aktuellCm = unterschiedlich ? null : [...hoehen][0]

  function setze(cm: number | null) {
    aktualisiere(
      { installationshoehe: cm != null ? cm / 100 : undefined },
      t('eigenschaften.panel.installationshoehe.undo'),
    )
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.installationshoehe.titel')}
        <ZahlenFeldOptional
          min={0}
          step={1}
          value={aktuellCm}
          placeholder={unterschiedlich ? t('eigenschaften.panel.gemeinsam.verschieden') : undefined}
          onCommit={setze}
        />
      </label>
      {vorgaben.length > 0 && (
        <div className="feld-vorgabeknoepfe">
          {vorgaben.map((cm) => (
            <button
              key={cm}
              type="button"
              className={aktuellCm === cm ? 'aktiv' : undefined}
              aria-pressed={aktuellCm === cm}
              onClick={() => setze(aktuellCm === cm ? null : cm)}
            >
              {cm} cm
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function TexteFelder({
  objekt,
  aktualisiere,
  setzeGekoppelt,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
  setzeGekoppelt: (feldname: string, wert: string) => void
}) {
  const t = useT()
  const sprache = useSprache()
  const katalogEintrag = useKatalogStore((s) =>
    s.komponenten.find((k) => k.id === objekt.catalogComponentId),
  )
  const variablenName = (variable: string) =>
    variablerTextName(katalogEintrag ?? {}, variable, sprache)
  const textElemente = objekt.textElemente
  if (!textElemente || textElemente.length === 0) return null
  const nurFeste = !textElemente.some(istVariablerText)

  function aendereText(index: number, text: string) {
    aktualisiere(
      {
        textElemente: textElemente!.map((element, i) =>
          i === index ? { ...element, text } : element,
        ),
      },
      istVariablerText(textElemente![index])
        ? t('eigenschaften.panel.gemeinsam.textUndo')
        : t('eigenschaften.panel.texte.klemmenbezeichnungUndo'),
    )
  }

  let festNummer = 0
  return (
    <>
      <p className="feld-info">
        {nurFeste
          ? t('eigenschaften.panel.texte.klemmenbezeichnungen')
          : t('eigenschaften.panel.texte.texte')}
      </p>
      {textElemente.map((element, index) => {
        if (istVariablerText(element) && element.variable === objekt.slotAnzahlAus) {
          return (
            <label className="feld" key={index}>
              {variablenName(element.variable!)}
              <EntwurfsTextfeld
                wert={element.text}
                onUebernehmen={(wert) => setzeGekoppelt(element.variable!, wert)}
              />
              <span className="feld-info">{slotKopplungHinweis(objekt, element.text)}</span>
            </label>
          )
        }
        if (istVariablerText(element)) {
          return (
            <label className="feld" key={index}>
              {(element.variable && variablenName(element.variable)) ||
                t('eigenschaften.panel.texte.textNr', { n: index + 1 })}
              <textarea
                rows={Math.max(1, element.text.split('\n').length)}
                value={element.text}
                onChange={(e) => aendereText(index, e.target.value)}
              />
            </label>
          )
        }
        festNummer += 1
        return (
          <label className="feld" key={index}>
            {t('eigenschaften.panel.texte.klemmeNr', { n: festNummer })}
            <input value={element.text} onChange={(e) => aendereText(index, e.target.value)} />
          </label>
        )
      })}
    </>
  )
}

function AnschlussFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const zeichnung = useProject()
  const konfiguration = objekt.dockpunkte
  if (konfiguration?.modus !== 'frei') return null
  const punkte = konfiguration.punkte
  if (!punkte.some((p) => p.bezeichnung !== undefined)) return null
  const klemme = istKlemme(objekt)

  function aendere(index: number, bezeichnung: string) {
    const nummer = klemmenZahl(bezeichnung)
    if (klemme && nummer !== null) {
      const eigene = punkte.some(
        (p, i) =>
          i !== index &&
          p.bezeichnung?.trim() !== punkte[index].bezeichnung?.trim() &&
          klemmenZahl(p.bezeichnung) === nummer,
      )
      const vergeben = eigene
        ? t('eigenschaften.panel.anschluss.polVergeben', {
            klemme: `${objekt.geraeteKennzeichen?.trim()}:${nummer}`,
          })
        : klemmenNummerVergeben(zeichnung, objekt, [nummer])
      if (vergeben) {
        useUiStore.getState().zeigeToast(vergeben)
        return
      }
    }
    aktualisiere(
      {
        dockpunkte: {
          modus: 'frei',
          punkte: punkte.map((p, i) => (i === index ? { ...p, bezeichnung } : p)),
        },
      },
      t('eigenschaften.panel.anschluss.bezeichnungUndo'),
    )
  }

  return (
    <>
      <p className="feld-info">{t('eigenschaften.panel.anschluss.bezeichnungen')}</p>
      {punkte.map((punkt, index) =>
        punkt.bezeichnung === undefined ? null : (
          <label className="feld" key={index}>
            {t('eigenschaften.panel.anschluss.nr', { n: index + 1 })}
            {klemme ? (
              <EntwurfsTextfeld wert={punkt.bezeichnung} onUebernehmen={(w) => aendere(index, w)} />
            ) : (
              <input value={punkt.bezeichnung} onChange={(e) => aendere(index, e.target.value)} />
            )}
          </label>
        ),
      )}
    </>
  )
}

function VariableTexteMehrfachFelder({
  objekte,
  setzeWert,
  setzeGekoppelt,
}: {
  objekte: Extract<Objekt, { type: 'komponente' }>[]
  setzeWert: (feldname: string, wert: string) => void
  setzeGekoppelt: (feldname: string, wert: string) => void
}) {
  const t = useT()
  const sprache = useSprache()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const feldName = (feldname: string) => {
    const traeger = objekte.find((o) =>
      o.textElemente?.some((e) => istVariablerText(e) && e.variable === feldname),
    )
    const eintrag = traeger
      ? katalogKomponenten.find((k) => k.id === traeger.catalogComponentId)
      : undefined
    return variablerTextName(eintrag ?? {}, feldname, sprache)
  }
  const felder = gemeinsameVariableFelder(objekte.map((o) => o.textElemente))
  if (felder.length === 0) return null
  return (
    <>
      <p className="feld-info">{t('eigenschaften.panel.texte.mehrfach')}</p>
      {felder.map((feld) =>
        objekte.some((o) => o.slotAnzahlAus === feld.feldname) ? (
          <label className="feld" key={feld.feldname}>
            {feldName(feld.feldname)}
            <EntwurfsTextfeld
              wert={feld.wert ?? ''}
              platzhalter={
                feld.wert === null ? t('eigenschaften.panel.gemeinsam.verschieden') : undefined
              }
              onUebernehmen={(wert) => setzeGekoppelt(feld.feldname, wert)}
            />
            <span className="feld-info">{t('eigenschaften.panel.texte.gekoppelt')}</span>
          </label>
        ) : (
          <label className="feld" key={feld.feldname}>
            {feldName(feld.feldname)}
            <textarea
              rows={Math.max(1, (feld.wert ?? '').split('\n').length)}
              value={feld.wert ?? ''}
              placeholder={
                feld.wert === null ? t('eigenschaften.panel.gemeinsam.verschieden') : undefined
              }
              onChange={(e) => setzeWert(feld.feldname, e.target.value)}
            />
          </label>
        ),
      )}
    </>
  )
}

function slotKopplungHinweis(
  objekt: Extract<Objekt, { type: 'komponente' }>,
  wert: string,
): string | null {
  if (objekt.gruppeId) return tAktuell('eigenschaften.panel.slots.gruppe')
  if (!slotKopplungWirksam(objekt.typ, objekt.slotAnzahlAus)) return null
  const raster = typHatSlotMatrix(objekt.typ)
  const slots = objekt.slots ?? []
  const bisher = raster
    ? tAktuell('eigenschaften.panel.slots.reihen', {
        n: ableiteSlotMatrix(objekt.slotMatrix, slots).zeilen,
      })
    : tAktuell('eigenschaften.panel.slots.anzahl', { n: slots.length })
  const zahl = zahlAusText(wert)
  if (zahl === null) return tAktuell('eigenschaften.panel.slots.keineZahl', { bisher })
  const grenze = raster ? SLOT_RASTER_ZEILEN_MAX : SLOT_ANZAHL_MAX
  if (zahl > grenze) {
    return tAktuell(
      raster
        ? 'eigenschaften.panel.slots.bestimmtReihenGrenze'
        : 'eigenschaften.panel.slots.bestimmtAnzahlGrenze',
      { n: grenze },
    )
  }
  return tAktuell(
    raster
      ? 'eigenschaften.panel.slots.bestimmtReihen'
      : 'eigenschaften.panel.slots.bestimmtAnzahl',
  )
}

function KnxHakenFeld({
  objekt,
  blattId,
  zeichnung,
  gruppe,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  blattId: string
  zeichnung: Zeichnung
  gruppe: boolean
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const katalog = useKatalogStore((s) => s.komponenten)
  const ausloeser = useMemo(
    () => ermittleKnxZiele(zeichnung, katalog).get(`${blattId}#${objekt.id}`)?.ausloeser ?? [],
    [zeichnung, katalog, blattId, objekt.id],
  )
  const ueberAusloeser = ausloeser.length > 0
  return (
    <>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={ueberAusloeser || knxHaken(objekt, zeichnung)}
          disabled={ueberAusloeser}
          onChange={(e) =>
            commands.execute(erzeugeKnxAendernCommand(doc, blattId, objekt.id, e.target.checked))
          }
        />
        {gruppe ? t('eigenschaften.panel.knx.gruppe') : 'KNX'}
      </label>
      {ueberAusloeser && (
        <p className="feld-info">
          {t('eigenschaften.panel.knx.ueber', {
            ausloeser: ausloeser.map((a) => `${a.name} · ${a.slot}`).join(', '),
          })}
        </p>
      )}
    </>
  )
}

function GeraetegruppenFelder({
  objekt,
  blattId,
  zeichnung,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  blattId: string
  zeichnung: Zeichnung
}) {
  const t = useT()
  const sprache = useSprache()
  const { doc, commands } = useAppContext()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const aufgeloest = ermittleTypUndSlots(objekt, zeichnung)
  const gruppe = objekt.gruppeId
    ? zeichnung.geraeteGruppen.find((g) => g.id === objekt.gruppeId)
    : undefined
  const eingehendeVerweise = ermittleEingehendeSlotVerweise(
    objekt,
    blattId,
    zeichnung,
    katalogKomponenten,
  )

  function typAendern(wert: string) {
    function anwenden() {
      if (gruppe) {
        if (wert)
          commands.execute(
            erzeugeTypAendernCommand(doc, blattId, objekt.id, wert as KomponentenTyp),
          )
        return
      }
      if (!wert) {
        commands.execute(
          erzeugeObjektAktualisierenCommand(
            doc,
            blattId,
            objekt.id,
            { typ: undefined },
            t('eigenschaften.panel.geraet.typEntfernen'),
          ),
        )
        return
      }
      commands.execute(erzeugeTypAendernCommand(doc, blattId, objekt.id, wert as KomponentenTyp))
    }

    const neuerTyp = wert as KomponentenTyp
    if (wert && !typHatSlots(neuerTyp) && (aufgeloest?.slots.length ?? 0) > 0) {
      useUiStore.getState().oeffneBestaetigung({
        titel: t('eigenschaften.panel.slots.entfernenTitel'),
        nachricht: t('eigenschaften.panel.geraet.typOhneSlotsFrage', {
          typ: typAnzeige(neuerTyp, sprache),
        }),
        bestaetigenText: t('eigenschaften.panel.geraet.typWechseln'),
        destruktiv: true,
        callback: (bestaetigt) => {
          if (bestaetigt) anwenden()
        },
      })
      return
    }
    anwenden()
  }

  function gruppeAendern(wert: string) {
    if (!wert) {
      if (objekt.gruppeId) {
        commands.execute(erzeugeGruppeVerlassenCommand(doc, blattId, objekt.id))
      }
      return
    }
    if (wert === '__neu__') {
      const typ = objekt.typ ?? 'bediengeraet'
      useUiStore.getState().oeffneGruppeBildenDialog({
        titel: t('eigenschaften.panel.geraet.neueGruppe'),
        vorgabe: gruppenVorgabe(zeichnung, typ, [{ blattId, objekt }]),
        callback: (angaben) => {
          if (angaben)
            commands.execute(erzeugeGruppeErstellenCommand(doc, blattId, objekt.id, typ, angaben))
        },
      })
      return
    }
    commands.execute(erzeugeGruppeBeitretenCommand(doc, blattId, objekt.id, wert))
  }

  function gruppennameAendern(name: string) {
    if (!gruppe) return
    commands.execute(
      erzeugeZeichnungAendernCommand(doc, t('eigenschaften.panel.geraet.gruppennameUndo'), {
        geraeteGruppen: zeichnung.geraeteGruppen.map((g) =>
          g.id === gruppe.id ? { ...g, name: name || undefined } : g,
        ),
      }),
    )
  }

  return (
    <>
      <p className="feld-info">{t('eigenschaften.panel.geraet.ueberschrift')}</p>
      {eingehendeVerweise.length > 0 && (
        <div className="feld">
          {t('eigenschaften.panel.geraet.angesteuertVon')}
          <ul className="slot-eingehend-liste">
            {eingehendeVerweise.map((v, i) => (
              <li key={i}>
                {v.quelleBezeichnung}
                {v.slotBezeichnung
                  ? ` ${t('eigenschaften.panel.geraet.slotVerweis', { name: v.slotBezeichnung })}`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label className="feld">
        {t('eigenschaften.panel.geraet.typ')}
        <select value={aufgeloest?.typ ?? ''} onChange={(e) => typAendern(e.target.value)}>
          {!gruppe && <option value="">{t('eigenschaften.panel.geraet.keinTyp')}</option>}
          {waehlbareTypen(aufgeloest?.typ).map((t) => (
            <option key={t.kennung} value={t.kennung}>
              {typAnzeige(t.kennung, sprache)}
            </option>
          ))}
        </select>
      </label>
      <label className="feld">
        {t('eigenschaften.panel.geraet.gruppe')}
        <select value={objekt.gruppeId ?? ''} onChange={(e) => gruppeAendern(e.target.value)}>
          <option value="">{t('eigenschaften.panel.geraet.eigenstaendig')}</option>
          {zeichnung.geraeteGruppen.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name ||
                t('eigenschaften.panel.geraet.gruppeOhneName', {
                  typ: typAnzeige(g.typ, sprache),
                })}
            </option>
          ))}
          <option value="__neu__">{t('eigenschaften.panel.geraet.neueGruppeAus')}</option>
        </select>
      </label>
      {gruppe && (
        <>
          <label className="feld">
            {t('eigenschaften.panel.geraet.gruppenname')}
            <input value={gruppe.name ?? ''} onChange={(e) => gruppennameAendern(e.target.value)} />
          </label>
          <div className="geraetegruppe-aktionen">
            <button
              type="button"
              className="feld-button"
              onClick={() =>
                commands.execute(erzeugeGruppeVerlassenCommand(doc, blattId, objekt.id))
              }
            >
              {t('eigenschaften.panel.geraet.gruppeVerlassen')}
            </button>
            <button
              type="button"
              className="feld-button"
              onClick={() => commands.execute(erzeugeGruppeLoeschenCommand(doc, gruppe.id))}
            >
              {t('eigenschaften.panel.geraet.gruppeLoeschen')}
            </button>
          </div>
        </>
      )}
      {aufgeloest && typHatAnsteuerung(aufgeloest.typ) && (
        <label className="feld">
          {gruppe
            ? t('eigenschaften.panel.geraet.ansteuerungGruppe')
            : t('eigenschaften.panel.geraet.ansteuerung')}
          <select
            value={ermittleAnsteuerung(objekt, zeichnung) ?? ''}
            onChange={(e) =>
              commands.execute(
                erzeugeAnsteuerungAendernCommand(
                  doc,
                  blattId,
                  objekt.id,
                  (e.target.value || undefined) as Ansteuerung | undefined,
                ),
              )
            }
          >
            <option value="">{t('eigenschaften.panel.geraet.keineAngabe')}</option>
            {waehlbareAnsteuerungen(ermittleAnsteuerung(objekt, zeichnung) ?? undefined).map(
              (a) => (
                <option key={a.kennung} value={a.kennung}>
                  {ansteuerungAnzeige(a.kennung, sprache)}
                </option>
              ),
            )}
          </select>
        </label>
      )}
      {aufgeloest && (typHatAnsteuerung(aufgeloest.typ) || aufgeloest.typ === 'anschlussdose') && (
        <KnxHakenFeld objekt={objekt} blattId={blattId} zeichnung={zeichnung} gruppe={!!gruppe} />
      )}
      {aufgeloest && !typHatSlots(aufgeloest.typ) && (
        <p className="feld-info">
          {t('eigenschaften.panel.geraet.typOhneSlots', {
            typ: typAnzeige(aufgeloest.typ, sprache),
          })}
          {aufgeloest.slots.length > 0 && ` ${t('eigenschaften.panel.geraet.altesRegelwerk')}`}
        </p>
      )}
      {aufgeloest && typHatSlotMatrix(aufgeloest.typ) && (
        <SlotMatrixVorschau
          objekt={objekt}
          blattId={blattId}
          slots={aufgeloest.slots}
          slotMatrix={aufgeloest.slotMatrix}
        />
      )}
      {aufgeloest &&
        !typHatSlotMatrix(aufgeloest.typ) &&
        (typHatSlots(aufgeloest.typ) || aufgeloest.slots.length > 0) && (
          <SlotsFelder
            ohneHinzufuegen={!typHatSlots(aufgeloest.typ)}
            slots={aufgeloest.slots}
            quelleTyp={aufgeloest.typ}
            onChange={(slots) =>
              uebernehmeSlots(doc, commands, { blattId, objektId: objekt.id }, slots)
            }
            ursprung={ermittleUrsprung(objekt, blattId)}
            zeichnung={zeichnung}
            katalogKomponenten={katalogKomponenten}
            eigeneBlattId={blattId}
            eigeneObjektId={objekt.id}
          />
        )}
    </>
  )
}

function SlotMatrixVorschau({
  objekt,
  blattId,
  slots,
  slotMatrix,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  blattId: string
  slots: Slot[]
  slotMatrix: SlotMatrix
}) {
  const t = useT()
  const spannen = spanneJeSlot(slotMatrix)
  const seite = Math.max(48, slotMatrix.zeilen * 10 + (slotMatrix.zeilen - 1) * 3)
  return (
    <div className="feld">
      {t('eigenschaften.panel.slots.titel')}
      <button
        type="button"
        className="slotmatrix-vorschau"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: `repeat(${slotMatrix.zeilen}, 1fr)`,
          width: seite,
          height: seite,
        }}
        onClick={() => useUiStore.getState().setSlotMatrixDialog({ blattId, objektId: objekt.id })}
        title={t('eigenschaften.panel.slots.matrixBearbeiten', { n: slotMatrix.zeilen })}
      >
        {slots.map((slot, index) => (
          <span
            key={slot.id}
            className={
              slot.ziele.length > 0
                ? 'slotmatrix-vorschau-zelle slotmatrix-vorschau-zelle-belegt'
                : 'slotmatrix-vorschau-zelle'
            }
            style={{ gridColumn: `span ${spannen[index]}` }}
          />
        ))}
      </button>
    </div>
  )
}

function SlotsFelder({
  ohneHinzufuegen,
  slots,
  quelleTyp,
  onChange,
  ursprung,
  zeichnung,
  katalogKomponenten,
  eigeneBlattId,
  eigeneObjektId,
}: {
  ohneHinzufuegen?: boolean
  slots: Slot[]
  quelleTyp: KomponentenTyp
  onChange: (slots: Slot[]) => void
  ursprung: SlotZiel
  zeichnung: Zeichnung
  katalogKomponenten: ReturnType<typeof useKatalogStore.getState>['komponenten']
  eigeneBlattId: string
  eigeneObjektId: string
}) {
  const t = useT()
  const alleKomponenten = ermittleAlleKomponenten(zeichnung, katalogKomponenten).filter(
    (k) => !(k.blattId === eigeneBlattId && k.objektId === eigeneObjektId),
  )
  const alleGruppen = zeichnung.geraeteGruppen.filter(
    (g) => !(ursprung.art === 'gruppe' && g.id === ursprung.gruppeId),
  )

  function slotHinzufuegen() {
    onChange([...slots, erzeugeSlot()])
  }
  function slotEntfernen(slotId: string) {
    onChange(slots.filter((s) => s.id !== slotId))
  }
  function bezeichnungAendern(slotId: string, bezeichnung: string) {
    onChange(
      slots.map((s) => (s.id === slotId ? { ...s, bezeichnung: bezeichnung || undefined } : s)),
    )
  }
  function zielHinzufuegen(slotId: string, ziel: SlotZiel) {
    if (erzeugtZyklus(zeichnung, ursprung, ziel)) {
      useUiStore.getState().zeigeToast(t('eigenschaften.panel.slots.kreislauf'))
      return
    }
    onChange(slots.map((s) => (s.id === slotId ? { ...s, ziele: [...s.ziele, ziel] } : s)))
  }
  function zielEntfernen(slotId: string, index: number) {
    onChange(
      slots.map((s) =>
        s.id === slotId ? { ...s, ziele: s.ziele.filter((_, i) => i !== index) } : s,
      ),
    )
  }

  return (
    <div className="feld">
      {t('eigenschaften.panel.slots.titel')}
      {slots.map((slot) => (
        <div key={slot.id} className="slot-eintrag">
          <div className="slot-eintrag-kopf">
            <input
              value={slot.bezeichnung ?? ''}
              placeholder={t('eigenschaften.panel.slots.bezeichnungOptional')}
              onChange={(e) => bezeichnungAendern(slot.id, e.target.value)}
            />
            <button
              type="button"
              className="feld-button"
              onClick={() => slotEntfernen(slot.id)}
              title={t('eigenschaften.panel.slots.entfernenTitelKnopf')}
            >
              {t('eigenschaften.panel.slots.entfernen')}
            </button>
          </div>
          <SlotZielverwaltung
            slot={slot}
            quelleTyp={quelleTyp}
            onZielHinzufuegen={(ziel) => zielHinzufuegen(slot.id, ziel)}
            onZielEntfernen={(index) => zielEntfernen(slot.id, index)}
            zeichnung={zeichnung}
            katalogKomponenten={katalogKomponenten}
            alleKomponenten={alleKomponenten}
            alleGruppen={alleGruppen}
          />
        </div>
      ))}
      {!ohneHinzufuegen && (
        <button type="button" className="feld-button" onClick={slotHinzufuegen}>
          {t('eigenschaften.panel.slots.hinzufuegen')}
        </button>
      )}
    </div>
  )
}

function BemassungsreiheFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'bemassungsreihe' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.bemassung.art')}
        <select
          value={objekt.art}
          onChange={(e) =>
            aktualisiere(
              { art: e.target.value as 'kette' | 'parallel' },
              t('eigenschaften.panel.bemassung.artUndo'),
            )
          }
        >
          <option value="kette">{t('eigenschaften.panel.objektnamen.kettenbemassung')}</option>
          <option value="parallel">{t('eigenschaften.panel.objektnamen.parallelbemassung')}</option>
        </select>
      </label>
      {objekt.art === 'kette' && (
        <label className="feld feld-checkbox">
          <input
            type="checkbox"
            checked={objekt.gesamtmass}
            onChange={(e) =>
              aktualisiere(
                { gesamtmass: e.target.checked },
                e.target.checked
                  ? t('eigenschaften.panel.bemassung.gesamtmassEin')
                  : t('eigenschaften.panel.bemassung.gesamtmassAus'),
              )
            }
          />
          {t('eigenschaften.panel.bemassung.gesamtmass')}
        </label>
      )}
      <label className="feld">
        {t('eigenschaften.panel.bemassung.staffelabstand')}
        <ZahlenFeld
          min={1}
          step={5}
          value={Math.round(objekt.staffelabstand * 100)}
          onCommit={(cm) =>
            aktualisiere(
              { staffelabstand: Math.max(cm, 1) / 100 },
              t('eigenschaften.panel.bemassung.staffelabstandUndo'),
            )
          }
        />
      </label>
    </>
  )
}

function BodenplatteFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'bodenplatte' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.bodenplatte.staerke')}
        <ZahlenFeld
          min={1}
          step={1}
          value={Math.round(objekt.staerke * 100)}
          onCommit={(cm) => {
            if (cm > 0)
              aktualisiere({ staerke: cm / 100 }, t('eigenschaften.panel.bodenplatte.staerkeUndo'))
          }}
        />
      </label>
      <label className="feld">
        {t('eigenschaften.panel.bodenplatte.oberkante')}
        <ZahlenFeld
          step={1}
          value={Math.round(objekt.oberkante * 100)}
          onCommit={(cm) =>
            aktualisiere(
              { oberkante: cm / 100 },
              t('eigenschaften.panel.bodenplatte.oberkanteUndo'),
            )
          }
        />
      </label>
    </>
  )
}

function TreppeFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'treppe' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const mindest = mindestTreppenStufenanzahl(objekt.form)
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.treppe.form')}
        <select
          value={objekt.form}
          onChange={(e) => {
            const form = e.target.value as TreppenForm
            aktualisiere(
              {
                form,
                stufenanzahl: Math.max(objekt.stufenanzahl, mindestTreppenStufenanzahl(form)),
              },
              t('eigenschaften.panel.treppe.formUndo'),
            )
          }}
        >
          {(Object.keys(TREPPEN_FORM_LABELS) as TreppenForm[]).map((form) => (
            <option key={form} value={form}>
              {TREPPEN_FORM_LABELS[form]}
            </option>
          ))}
        </select>
      </label>
      <label className="feld">
        {t('eigenschaften.panel.treppe.stufenanzahl')}
        <ZahlenFeld
          min={mindest}
          step={1}
          value={objekt.stufenanzahl}
          onCommit={(wert) =>
            aktualisiere(
              { stufenanzahl: Math.round(wert) },
              t('eigenschaften.panel.treppe.stufenanzahlUndo'),
            )
          }
        />
      </label>
      {objekt.form === 'l-kehre' && (
        <>
          <p className="feld-info">{t('eigenschaften.panel.treppe.lFormHinweis')}</p>
          <label className="feld">
            {t('eigenschaften.panel.treppe.laufALaenge')}
            <ZahlenFeld
              min={0.1}
              step={0.05}
              value={objekt.lFormLaufALaenge}
              onCommit={(wert) =>
                aktualisiere(
                  lFormMasseAendern(objekt, { lFormLaufALaenge: wert }),
                  t('eigenschaften.panel.treppe.laufALaengeUndo'),
                )
              }
            />
          </label>
          <label className="feld">
            {t('eigenschaften.panel.treppe.laufABreite')}
            <ZahlenFeld
              min={0.1}
              step={0.05}
              value={objekt.lFormLaufABreite}
              onCommit={(wert) =>
                aktualisiere(
                  lFormMasseAendern(objekt, { lFormLaufABreite: wert }),
                  t('eigenschaften.panel.treppe.laufABreiteUndo'),
                )
              }
            />
          </label>
          <label className="feld">
            {t('eigenschaften.panel.treppe.laufBLaenge')}
            <ZahlenFeld
              min={0.1}
              step={0.05}
              value={objekt.lFormLaufBLaenge}
              onCommit={(wert) =>
                aktualisiere(
                  lFormMasseAendern(objekt, { lFormLaufBLaenge: wert }),
                  t('eigenschaften.panel.treppe.laufBLaengeUndo'),
                )
              }
            />
          </label>
          <label className="feld">
            {t('eigenschaften.panel.treppe.laufBBreite')}
            <ZahlenFeld
              min={0.1}
              step={0.05}
              value={objekt.lFormLaufBBreite}
              onCommit={(wert) =>
                aktualisiere(
                  lFormMasseAendern(objekt, { lFormLaufBBreite: wert }),
                  t('eigenschaften.panel.treppe.laufBBreiteUndo'),
                )
              }
            />
          </label>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={objekt.lFormSpiegelHorizontal}
              onChange={(e) =>
                aktualisiere(
                  { lFormSpiegelHorizontal: e.target.checked },
                  t('eigenschaften.panel.treppe.spiegelnHorizontal'),
                )
              }
            />
            {t('eigenschaften.panel.treppe.spiegelnHorizontal')}
          </label>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={objekt.lFormSpiegelVertikal}
              onChange={(e) =>
                aktualisiere(
                  { lFormSpiegelVertikal: e.target.checked },
                  t('eigenschaften.panel.treppe.spiegelnVertikal'),
                )
              }
            />
            {t('eigenschaften.panel.treppe.spiegelnVertikal')}
          </label>
        </>
      )}
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={objekt.laufrichtungGespiegelt}
          onChange={(e) =>
            aktualisiere(
              { laufrichtungGespiegelt: e.target.checked },
              t('eigenschaften.panel.treppe.laufrichtung'),
            )
          }
        />
        {t('eigenschaften.panel.treppe.laufrichtung')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={objekt.beschriftungSichtbar}
          onChange={(e) =>
            aktualisiere(
              { beschriftungSichtbar: e.target.checked },
              t('eigenschaften.panel.treppe.stufenzahlUndo'),
            )
          }
        />
        {t('eigenschaften.panel.treppe.stufenzahl')}
      </label>
    </>
  )
}

function StromkreisSichtbarkeit({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'komponente' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const zuordnungen = useStromkreisZuordnungen(objekt.id, 'komponente')
  if (zuordnungen.length === 0 && objekt.stromkreisSichtbar === undefined) return null
  return (
    <SichtbarkeitFeld
      titel={t('eigenschaften.panel.stromkreis.titel')}
      wert={objekt.stromkreisSichtbar}
      aendern={(v) =>
        aktualisiere({ stromkreisSichtbar: v }, t('eigenschaften.panel.stromkreis.sichtbarUndo'))
      }
    />
  )
}

function SichtbarkeitFeld({
  titel,
  wert,
  aendern,
}: {
  titel: string
  wert: boolean | undefined | null
  aendern: (wert: boolean | undefined) => void
}) {
  const t = useT()
  return (
    <label className="feld">
      {titel}
      <select
        value={wert === null ? '' : wert === undefined ? 'global' : wert ? 'an' : 'aus'}
        onChange={(e) => {
          const gewaehlt = e.target.value
          if (!gewaehlt) return
          aendern(gewaehlt === 'global' ? undefined : gewaehlt === 'an')
        }}
      >
        {wert === null && (
          <option value="">{t('eigenschaften.panel.gemeinsam.verschieden')}</option>
        )}
        <option value="global">{t('eigenschaften.panel.sichtbarkeit.wieGlobal')}</option>
        <option value="an">{t('eigenschaften.panel.sichtbarkeit.anzeigen')}</option>
        <option value="aus">{t('eigenschaften.panel.sichtbarkeit.ausblenden')}</option>
      </select>
    </label>
  )
}

function SwitchAustauschenFeld({ objekt }: { objekt: Extract<Objekt, { type: 'komponente' }> }) {
  const t = useT()
  const { doc, commands, toolContext } = useAppContext()
  const blatt = useAktivesBlatt()

  function austauschen() {
    toolContext.oeffneKomponentenPicker(
      (ergebnis) => {
        if (!ergebnis) return
        const command = erzeugeKomponenteAustauschenCommand(
          doc,
          blatt.id,
          objekt.id,
          {
            catalogComponentId: ergebnis.catalogComponentId,
            variantId: ergebnis.variantId,
            dockpunkte: ergebnis.dockpunkte,
            fangpunkt: ergebnis.fangpunkt,
            breitenFaktor: ergebnis.breitenFaktor,
            hoehenFaktor: ergebnis.hoehenFaktor,
          },
          t('eigenschaften.panel.komponente.austauschenUndo'),
        )
        if (!command) {
          const benoetigtePorts = benoetigtePortAnzahl(doc.getZeichnung(), objekt)
          const neuePorts = ergebnis.dockpunkte ? portAnzahlKonfiguration(ergebnis.dockpunkte) : 0
          useUiStore.getState().zeigeToast(
            neuePorts < benoetigtePorts
              ? t('eigenschaften.panel.switch.zuWenigPorts', {
                  n: neuePorts,
                  benoetigt: benoetigtePorts,
                })
              : t('eigenschaften.panel.switch.passtNicht'),
          )
          return
        }
        commands.execute(command)
      },
      {
        filter: 'switchPatchpanel',
        titel: t('eigenschaften.panel.switch.ersatzWaehlen'),
        bestaetigenText: t('eigenschaften.panel.switch.austauschen'),
      },
    )
  }

  return (
    <button type="button" onClick={austauschen}>
      {t('eigenschaften.panel.switch.austauschenKnopf')}
    </button>
  )
}

function DrehungFeld({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { drehung: number }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  return (
    <label className="feld">
      {t('eigenschaften.panel.gemeinsam.drehung')}
      <ZahlenFeld
        step={5}
        value={Math.round(toDegrees(objekt.drehung))}
        onCommit={(grad) =>
          aktualisiere({ drehung: toRadians(grad) }, t('eigenschaften.panel.gemeinsam.drehungUndo'))
        }
      />
    </label>
  )
}

function WandOeffnungFelder({
  objekt,
  objekte,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'tuer' | 'fenster' | 'wanddurchbruch' }>
  objekte: Objekt[]
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const wand = objekte.find(
    (o): o is Extract<Objekt, { type: 'wand' }> => o.type === 'wand' && o.id === objekt.wandId,
  )
  const wandLaenge = wand ? pfadGesamtLaenge(wand.punkte) : 0
  const aenderungsName = t(
    objekt.type === 'tuer'
      ? 'eigenschaften.panel.oeffnung.tuerUndo'
      : objekt.type === 'fenster'
        ? 'eigenschaften.panel.oeffnung.fensterUndo'
        : 'eigenschaften.panel.oeffnung.durchbruchUndo',
  )

  function aendereEntlangWand(patch: { t?: number; breite?: number }) {
    if (!wand) {
      aktualisiere(patch, aenderungsName)
      return
    }
    const neuesT = patch.t ?? objekt.t
    const geometrie = ermittleOeffnungsGeometrie(wand, { t: neuesT })
    aktualisiere({ ...patch, ...geometrie }, aenderungsName)
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.gemeinsam.breiteM')}
        <ZahlenFeld
          min={0.2}
          step={0.05}
          value={objekt.breite}
          onCommit={(wert) => aendereEntlangWand({ breite: wert })}
        />
      </label>
      {wand && wandLaenge > 0 && (
        <label className="feld">
          {t('eigenschaften.panel.oeffnung.position')}
          <ZahlenFeld
            min={0}
            max={Number(wandLaenge.toFixed(2))}
            step={0.05}
            value={Number((objekt.t * wandLaenge).toFixed(2))}
            onCommit={(wert) => aendereEntlangWand({ t: wert / wandLaenge })}
          />
        </label>
      )}
      {objekt.type === 'fenster' && (
        <>
          <label className="feld">
            {t('eigenschaften.panel.gemeinsam.hoeheM')}
            <ZahlenFeld
              min={OEFFNUNG_HOEHE_MIN}
              step={0.01}
              value={fensterHoehe(objekt)}
              onCommit={(wert) =>
                aktualisiere({ hoehe: wert }, t('eigenschaften.panel.oeffnung.fensterhoeheUndo'))
              }
            />
          </label>
          <label className="feld">
            {t('eigenschaften.panel.oeffnung.bruestung')}
            <ZahlenFeld
              min={0}
              step={0.01}
              value={fensterBruestung(objekt)}
              onCommit={(wert) =>
                aktualisiere(
                  { bruestungshoehe: wert },
                  t('eigenschaften.panel.oeffnung.bruestungUndo'),
                )
              }
            />
          </label>
        </>
      )}
      {objekt.type === 'tuer' && (
        <>
          <label className="feld">
            {t('eigenschaften.panel.gemeinsam.hoeheM')}
            <ZahlenFeld
              min={OEFFNUNG_HOEHE_MIN}
              step={0.01}
              value={tuerHoehe(objekt)}
              onCommit={(wert) =>
                aktualisiere({ hoehe: wert }, t('eigenschaften.panel.oeffnung.tuerhoeheUndo'))
              }
            />
          </label>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={objekt.gespiegelt}
              onChange={(e) =>
                aktualisiere(
                  { gespiegelt: e.target.checked },
                  t('eigenschaften.panel.oeffnung.anschlagSpiegeln'),
                )
              }
            />
            {t('eigenschaften.panel.oeffnung.anschlagSpiegeln')}
          </label>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={objekt.schwenkInnen}
              onChange={(e) =>
                aktualisiere(
                  { schwenkInnen: e.target.checked },
                  t('eigenschaften.panel.oeffnung.schwenkUndo'),
                )
              }
            />
            {t('eigenschaften.panel.oeffnung.schwenk')}
          </label>
        </>
      )}
    </>
  )
}

function normFarbe(farbe: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(farbe) ? farbe : '#1a1a1a'
}

function LeitungsLaengeFelder({ blattId, leitungId }: { blattId: string; leitungId: string }) {
  const t = useT()
  const { doc } = useAppContext()
  const laenge = ermittleLeitungsLaenge(doc.getZeichnung(), blattId, leitungId)

  if (laenge.status === 'unkalibriert') {
    const namen = laenge.unkalibrierteBlaetter.map((b) => b.name).join(', ')
    return (
      <p className="feld-info">
        {t('eigenschaften.panel.laenge.unkalibriert', {
          n: laenge.unkalibrierteBlaetter.length,
          namen,
        })}
      </p>
    )
  }

  const meter = (wert: number) => `${wert.toFixed(2)} m`
  const nichtGezeichnet: string[] = []
  if (laenge.anteile.trunk > 0)
    nichtGezeichnet.push(
      t('eigenschaften.panel.laenge.imBuendel', { laenge: meter(laenge.anteile.trunk) }),
    )
  if (laenge.anteile.buendel > 0)
    nichtGezeichnet.push(
      t('eigenschaften.panel.laenge.imBuendelZumPort', { laenge: meter(laenge.anteile.buendel) }),
    )
  if (laenge.anteile.steig > 0)
    nichtGezeichnet.push(
      t('eigenschaften.panel.laenge.steigstrecke', { laenge: meter(laenge.anteile.steig) }),
    )
  const hoehe = laenge.anteile.hoehe

  return (
    <>
      <p className="feld-info">
        {t('eigenschaften.panel.laenge.laenge', {
          laenge: meter(laenge.planLaengeMeter),
          reserve: meter(laenge.verlegeLaengeMeter),
        })}
      </p>
      {nichtGezeichnet.length > 0 && (
        <p className="feld-info">
          {t('eigenschaften.panel.laenge.davon', { teile: nichtGezeichnet.join(', ') })}
        </p>
      )}
      {Math.abs(hoehe) >= 0.005 && (
        <p className="feld-info">
          {t('eigenschaften.panel.laenge.hoehenanteil', {
            hoehe: `${hoehe < 0 ? '−' : ''}${meter(Math.abs(hoehe))}`,
          })}
        </p>
      )}
    </>
  )
}

function PlanspracheFeld() {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = doc.getZeichnung()
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.plansprache.titel')}
        <select
          value={planspracheVon(zeichnung)}
          onChange={(e) =>
            commands.execute(
              erzeugeZeichnungAendernCommand(doc, t('eigenschaften.panel.plansprache.undo'), {
                plansprache: e.target.value as Sprache,
              }),
            )
          }
        >
          {SPRACHEN.map((sprache) => (
            <option key={sprache} value={sprache}>
              {SPRACH_EIGENNAMEN[sprache]}
            </option>
          ))}
        </select>
      </label>
      <p className="feld-info">{t('eigenschaften.panel.plansprache.hinweis')}</p>
    </>
  )
}

function AnschlussreserveFeld() {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = doc.getZeichnung()
  return (
    <label className="feld">
      {t('eigenschaften.panel.laenge.anschlussreserve')}
      <ZahlenFeld
        min={0}
        step={10}
        value={Math.round(zeichnung.anschlussreserveMeter * 100)}
        onCommit={(cm) =>
          commands.execute(
            erzeugeZeichnungAendernCommand(
              doc,
              t('eigenschaften.panel.laenge.anschlussreserveUndo'),
              {
                anschlussreserveMeter: cm / 100,
              },
            ),
          )
        }
      />
    </label>
  )
}

function bezeichnungFuer(o: Objekt): string {
  if (o.type === 'switchplan' && o.planArt === 'patchpanel')
    return tAktuell('eigenschaften.panel.objektnamen.patchpanelplan')
  if (o.type === 'bemassungsreihe') {
    return o.art === 'kette'
      ? tAktuell('eigenschaften.panel.objektnamen.kettenbemassung')
      : tAktuell('eigenschaften.panel.objektnamen.parallelbemassung')
  }
  const namen: Record<Objekt['type'], Schluessel> = {
    linie: 'eigenschaften.panel.objektnamen.linie',
    polylinie: 'eigenschaften.panel.objektnamen.polylinie',
    rechteck: 'eigenschaften.panel.objektnamen.rechteck',
    kreis: 'eigenschaften.panel.objektnamen.kreis',
    bogen: 'eigenschaften.panel.objektnamen.bogen',
    ellipse: 'eigenschaften.panel.objektnamen.ellipse',
    polygon: 'eigenschaften.panel.objektnamen.polygon',
    punkt: 'eigenschaften.panel.objektnamen.punkt',
    text: 'eigenschaften.panel.objektnamen.text',
    bemassung: 'eigenschaften.panel.objektnamen.bemassung',
    bemassungsreihe: 'eigenschaften.panel.objektnamen.bemassungsreihe',
    schraffur: 'eigenschaften.panel.objektnamen.schraffur',
    komponente: 'eigenschaften.panel.objektnamen.komponente',
    leitung: 'eigenschaften.panel.objektnamen.leitung',
    schaltverbindung: 'eigenschaften.panel.objektnamen.schaltverbindung',
    stueckliste: 'eigenschaften.panel.objektnamen.stueckliste',
    leitungsliste: 'eigenschaften.panel.objektnamen.leitungsliste',
    trunkliste: 'eigenschaften.panel.objektnamen.trunkliste',
    raumliste: 'eigenschaften.panel.objektnamen.raumliste',
    betriebsmittelliste: 'eigenschaften.panel.objektnamen.betriebsmittelliste',
    stromkreisverzeichnis: 'eigenschaften.panel.objektnamen.stromkreisverzeichnis',
    aktorkanalliste: 'eigenschaften.panel.objektnamen.aktorkanalliste',
    potential: 'eigenschaften.panel.objektnamen.potential',
    knotenpunkt: 'eigenschaften.panel.objektnamen.knotenpunkt',
    potentialliste: 'eigenschaften.panel.objektnamen.potentialliste',
    steuerungslogik: 'eigenschaften.panel.objektnamen.steuerungslogik',
    leitungsbaum: 'eigenschaften.panel.objektnamen.leitungsbaum',
    switchplan: 'eigenschaften.panel.objektnamen.switchplan',
    trunk: 'eigenschaften.panel.objektnamen.trunk',
    kabelschacht: 'eigenschaften.panel.objektnamen.kabelschacht',
    plankopf: 'eigenschaften.panel.objektnamen.plankopf',
    wand: 'eigenschaften.panel.objektnamen.wand',
    tuer: 'eigenschaften.panel.objektnamen.tuer',
    fenster: 'eigenschaften.panel.objektnamen.fenster',
    wanddurchbruch: 'eigenschaften.panel.objektnamen.wanddurchbruch',
    raum: 'eigenschaften.panel.objektnamen.raum',
    treppe: 'eigenschaften.panel.objektnamen.treppe',
    bodenplatte: 'eigenschaften.panel.objektnamen.bodenplatte',
  }
  return tAktuell(namen[o.type])
}

function SwitchPortFeld({
  leitung,
  blattId,
}: {
  leitung: Extract<Objekt, { type: 'leitung' }>
  blattId: string
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const ziel = leitung.ziel
  if (ziel.art !== 'switchport') return null

  const zielBlatt = doc.getZeichnung().blaetter.find((b) => b.id === ziel.blattId)
  const switchInstanz = zielBlatt?.objekte.find(
    (o): o is Extract<Objekt, { type: 'komponente' }> =>
      o.type === 'komponente' && o.id === ziel.objektId,
  )
  const name = switchInstanz?.beschriftung?.trim() || 'Switch'
  const blattHinweis = ziel.blattId === blattId ? '' : ` · ${zielBlatt?.name ?? '?'}`

  return (
    <>
      <p className="feld-info">
        {switchInstanz
          ? t('eigenschaften.panel.port.zuweisung', {
              name,
              port: portBezeichnung(ziel.portIndex),
              blatt: blattHinweis,
            })
          : t('eigenschaften.panel.port.ungueltig')}
      </p>
      <button
        type="button"
        onClick={() =>
          commands.execute(
            erzeugeSwitchPortZuweisenCommand(
              doc,
              blattId,
              leitung.id,
              null,
              t('eigenschaften.panel.port.loesenUndo'),
            ),
          )
        }
      >
        {t('eigenschaften.panel.port.loesen')}
      </button>
    </>
  )
}

function TexthoeheFeld({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<
    Objekt,
    {
      type:
        | 'stueckliste'
        | 'leitungsliste'
        | 'switchplan'
        | 'trunkliste'
        | 'raumliste'
        | 'betriebsmittelliste'
        | 'stromkreisverzeichnis'
        | 'aktorkanalliste'
        | 'potentialliste'
        | 'steuerungslogik'
        | 'leitungsbaum'
    }
  >
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  return (
    <label className="feld">
      {t('eigenschaften.panel.tabelle.texthoehe')}
      <ZahlenFeld
        min={0.5}
        step={0.5}
        value={Math.round(objekt.textHoehe * 1000) / 10}
        onCommit={(cm) =>
          aktualisiere({ textHoehe: cm / 100 }, t('eigenschaften.panel.text.hoeheUndo'))
        }
      />
    </label>
  )
}

function EinpassenFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'leitungsbaum' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  return (
    <>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={objekt.einpassen}
          onChange={(e) =>
            aktualisiere(
              { einpassen: e.target.checked },
              t('eigenschaften.panel.leitungsbaum.einpassenUndo'),
            )
          }
        />
        {t('eigenschaften.panel.leitungsbaum.einpassen')}
      </label>
      {objekt.einpassen && (
        <label className="feld">
          {t('eigenschaften.panel.leitungsbaum.zielbreite')}
          <ZahlenFeldOptional
            min={0.1}
            step={0.5}
            value={objekt.zielBreite}
            onCommit={(wert) =>
              aktualisiere(
                { zielBreite: wert },
                t('eigenschaften.panel.leitungsbaum.zielbreiteUndo'),
              )
            }
          />
        </label>
      )}
    </>
  )
}

function SwitchAuswahlFeld({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'switchplan' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const sprache = useSprache()
  const zeichnung = useProject()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const istPanel = objekt.planArt === 'patchpanel'
  const geraet = istPanel
    ? t('eigenschaften.panel.switchplan.patchpanel')
    : t('eigenschaften.panel.switchplan.switch')
  const switches = ermittleAlleSwitches(
    zeichnung,
    katalogKomponenten,
    istPanel ? 'patchpanel' : 'switch',
    sprache,
  )
  const wert = objekt.switchObjektId ?? ''

  return (
    <label className="feld">
      {geraet}
      <select
        value={wert}
        onChange={(e) => {
          const gewaehlt = switches.find((sw) => sw.objektId === e.target.value)
          aktualisiere(
            {
              switchBlattId: gewaehlt ? gewaehlt.blattId : null,
              switchObjektId: gewaehlt ? gewaehlt.objektId : null,
            },
            istPanel
              ? t('eigenschaften.panel.switchplan.waehlenPatchpanel')
              : t('eigenschaften.panel.switchplan.waehlenSwitch'),
          )
        }}
      >
        <option value="">{t('eigenschaften.panel.switchplan.bitteWaehlen')}</option>
        {switches.map((sw) => (
          <option key={sw.objektId} value={sw.objektId}>
            {sw.bezeichnung} ({sw.blattName})
          </option>
        ))}
      </select>
      {switches.length === 0 && (
        <span className="feld-info">
          {istPanel
            ? t('eigenschaften.panel.switchplan.keinPatchpanel')
            : t('eigenschaften.panel.switchplan.keinSwitch')}
        </span>
      )}
    </label>
  )
}

function KabelschachtFelder({ objekt }: { objekt: Extract<Objekt, { type: 'kabelschacht' }> }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const zeichnung = useProject()

  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const straenge = ermittleSchachtStraenge(zeichnung, objekt.verbundId)
  const eigene = straenge.filter((strang) =>
    strang.anschluesse.some((a) => a.schachtId === objekt.id),
  )
  const anzeigen = new Map(
    beschreibeSchachtStraenge(zeichnung, objekt.verbundId, katalogKomponenten).map((a) => [
      a.nummer,
      a,
    ]),
  )
  const verweise = schachtEtagenVerweise(zeichnung, blatt.id, objekt.verbundId)
  const wirksam = wirksameGeschosshoehe(zeichnung, objekt.verbundId, blatt.id)
  const hoeheAusKoten = wirksam?.ausKoten ? wirksam : null
  const blattName = (id: string) => zeichnung.blaetter.find((b) => b.id === id)?.name ?? '?'

  function aendere(patch: Parameters<typeof erzeugeSchachtAendernCommand>[3], label: string) {
    commands.execute(erzeugeSchachtAendernCommand(doc, blatt.id, objekt.id, patch, label))
  }

  function springeZu(blattId: string, objektId: string) {
    window.dispatchEvent(
      new CustomEvent('eleasycad:sprung-zu-blatt', { detail: { blattId, objektId } }),
    )
  }

  function verbundWechseln() {
    useUiStore.getState().oeffneSchachtVerbundDialog({
      titel: t('eigenschaften.panel.kabelschacht.verbundWechseln'),
      aktuellerVerbundId: objekt.verbundId,
      geschosshoehe: objekt.geschosshoehe,
      callback: (auswahl) => {
        if (!auswahl) return
        const verbundId = auswahl.art === 'neu' ? erzeugeId('verbund') : auswahl.verbundId
        if (auswahl.art === 'vorhanden' && verbundId === objekt.verbundId) {
          aendere(
            { geschosshoehe: auswahl.geschosshoehe },
            t('eigenschaften.panel.kabelschacht.geschosshoeheUndo'),
          )
          return
        }
        const betroffen = zaehleAnschluesseAmSchacht(doc, objekt.id)
        const wechseln = () =>
          commands.execute(
            erzeugeSchachtVerbundWechselCommand(
              doc,
              blatt.id,
              objekt.id,
              { verbundId, name: auswahl.name, geschosshoehe: auswahl.geschosshoehe },
              t('eigenschaften.panel.kabelschacht.verbundWechselnUndo'),
            ),
          )
        if (betroffen === 0) {
          wechseln()
          return
        }
        useUiStore.getState().oeffneBestaetigung({
          titel: t('eigenschaften.panel.kabelschacht.verbundWechselnFrage'),
          nachricht: t('eigenschaften.panel.kabelschacht.verbundWechselnNachricht', {
            n: betroffen,
          }),
          bestaetigenText: t('eigenschaften.panel.kabelschacht.wechseln'),
          destruktiv: false,
          callback: (bestaetigt) => {
            if (bestaetigt) wechseln()
          },
        })
      },
    })
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.kabelschacht.name')}
        <input
          value={objekt.name}
          onChange={(e) =>
            commands.execute(
              erzeugeSchachtVerbundUmbenennenCommand(
                doc,
                objekt.verbundId,
                e.target.value,
                t('eigenschaften.panel.kabelschacht.umbenennen'),
              ),
            )
          }
        />
        <span className="feld-info">
          {t('eigenschaften.panel.kabelschacht.nameGilt', {
            n: verbundBlaetter(zeichnung, objekt.verbundId).length,
          })}
        </span>
      </label>
      <label className="feld">
        {t('eigenschaften.panel.gemeinsam.breiteM')}
        <ZahlenFeld
          min={0.01}
          step={0.05}
          value={objekt.breite}
          onCommit={(wert) =>
            aendere({ breite: wert }, t('eigenschaften.panel.gemeinsam.breiteUndo'))
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.panel.gemeinsam.hoeheM')}
        <ZahlenFeld
          min={0.01}
          step={0.05}
          value={objekt.hoehe}
          onCommit={(wert) =>
            aendere({ hoehe: wert }, t('eigenschaften.panel.gemeinsam.hoeheUndo'))
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.panel.gemeinsam.drehung')}
        <ZahlenFeld
          step={5}
          value={Math.round(toDegrees(objekt.drehung))}
          onCommit={(grad) =>
            aendere({ drehung: toRadians(grad) }, t('eigenschaften.panel.gemeinsam.drehungUndo'))
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.panel.kabelschacht.geschosshoehe')}
        {hoeheAusKoten ? (
          <>
            <input value={hoeheAusKoten.meter.toFixed(2)} disabled readOnly />
            <span className="feld-info">{t('eigenschaften.panel.kabelschacht.ausKoten')}</span>
          </>
        ) : (
          <ZahlenFeld
            min={0}
            step={0.1}
            value={objekt.geschosshoehe}
            onCommit={(wert) =>
              aendere(
                { geschosshoehe: wert },
                t('eigenschaften.panel.kabelschacht.geschosshoeheUndo'),
              )
            }
          />
        )}
      </label>
      <button type="button" className="feld-button" onClick={verbundWechseln}>
        {t('eigenschaften.panel.kabelschacht.verbundWechselnKnopf')}
      </button>
      <div className="feld">
        {t('eigenschaften.panel.kabelschacht.straenge')}
        {eigene.length === 0 && (
          <span className="feld-info">
            {t('eigenschaften.panel.kabelschacht.nichtsAngeschlossen')}
          </span>
        )}
        {eigene.length > 0 && (
          <span className="feld-info">{t('eigenschaften.panel.kabelschacht.strangnameGilt')}</span>
        )}
        <ul className="schacht-straenge">
          {eigene.map((strang) => {
            const anzeige = anzeigen.get(strang.nummer)
            return (
              <li key={strang.nummer}>
                <strong>S{strang.nummer}</strong>{' '}
                {anzeige?.kurz ??
                  (strang.art === 'trunk'
                    ? t('eigenschaften.panel.objektnamen.trunk')
                    : t('eigenschaften.panel.objektnamen.leitung'))}
                <StrangNameFeld verbundId={objekt.verbundId} nummer={strang.nummer} />
                <ul>
                  {strang.anschluesse.map((a, index) => (
                    <li key={`${a.objektId}-${a.seite}`}>
                      <button
                        type="button"
                        className="verweis"
                        onClick={() => springeZu(a.blattId, a.objektId)}
                      >
                        {blattName(a.blattId)}
                        {a.blattId === blatt.id
                          ? ` ${t('eigenschaften.panel.kabelschacht.diesesBlatt')}`
                          : ''}
                      </button>
                      {anzeige?.eintraege[index] && (
                        <span className="feld-info"> · {anzeige.eintraege[index].text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
      {(verweise.nachOben.length > 0 || verweise.nachUnten.length > 0) && (
        <div className="feld">
          {t('eigenschaften.panel.kabelschacht.fuehrtWeiter')}
          <ul className="schacht-straenge">
            {verweise.nachOben.map((b) => (
              <li key={b.id}>
                <button type="button" className="verweis" onClick={() => springeZu(b.id, '')}>
                  ↑ {b.name}
                </button>
              </li>
            ))}
            {verweise.nachUnten.map((b) => (
              <li key={b.id}>
                <button type="button" className="verweis" onClick={() => springeZu(b.id, '')}>
                  ↓ {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function verbundBlaetter(zeichnung: ReturnType<typeof useProject>, verbundId: string): string[] {
  return zeichnung.blaetter
    .filter((b) => b.objekte.some((o) => o.type === 'kabelschacht' && o.verbundId === verbundId))
    .map((b) => b.id)
}

function PlankopfFelder({ objekt, blattId }: { objekt: PlankopfObjekt; blattId: string }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = doc.getZeichnung()
  const ohneZeichenflaeche = plankopfNutztErsatzMassstab(zeichnung, blattId)

  function setzeBreite(breiteMm: number) {
    if (!Number.isFinite(breiteMm) || breiteMm <= 0) return
    const faktor = breiteMm / objekt.breiteMm
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blattId,
        t('eigenschaften.panel.plankopf.breiteUndo'),
        (objekte) =>
          objekte.map((o) =>
            o.id === objekt.id && o.type === 'plankopf'
              ? {
                  ...o,
                  breiteMm,
                  zeilen: o.zeilen.map((z) => ({ ...z, hoeheMm: z.hoeheMm * faktor })),
                }
              : o,
          ),
      ),
    )
  }

  function untenRechtsAusrichten() {
    const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
    const flaeche = blatt?.zeichenflaeche
    if (!flaeche) return
    const { breite } = zeichenflaecheGroesseWelt(flaeche)
    const modell = bauePlankopfModell(objekt, { zeichnung, blattId })
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blattId,
        t('eigenschaften.panel.plankopf.ausrichtenUndo'),
        (objekte) =>
          objekte.map((o) =>
            o.id === objekt.id && o.type === 'plankopf'
              ? {
                  ...o,
                  position: {
                    x: flaeche.ursprung.x + breite - modell.gesamtBreite,
                    y: flaeche.ursprung.y + modell.gesamtHoehe,
                  },
                }
              : o,
          ),
      ),
    )
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.plankopf.breite')}
        <ZahlenFeld
          min={20}
          step={5}
          value={Math.round(objekt.breiteMm * 10) / 10}
          onCommit={setzeBreite}
        />
      </label>
      {ohneZeichenflaeche && (
        <p className="panel-hinweis">
          {t('eigenschaften.panel.plankopf.ohneZeichenflaeche', {
            nenner: String(PLANKOPF_ERSATZ_MASSSTAB),
          })}
        </p>
      )}
      <button
        type="button"
        onClick={() => useUiStore.getState().setPlankopfDialogObjektId(objekt.id)}
      >
        {t('eigenschaften.panel.plankopf.felderBeschriften')}
      </button>
      <button type="button" onClick={untenRechtsAusrichten} disabled={ohneZeichenflaeche}>
        {t('eigenschaften.panel.plankopf.untenRechts')}
      </button>
    </>
  )
}

function ifcBauteilText(blatt: Blatt, guid: string): string {
  const bauteil =
    blatt.hintergrund?.typ === 'ifc'
      ? blatt.hintergrund.bauteile?.find((b) => b.guid === guid)
      : undefined
  if (!bauteil) return tAktuell('eigenschaften.panel.ifc.uebernommen')
  const gruppe = ifcGruppeInfo(ifcGruppeVonKlasse(bauteil.klasse)).name
  return tAktuell('eigenschaften.panel.ifc.bauteil', {
    name: bauteil.name ?? tAktuell('eigenschaften.panel.ifc.ohneNamen'),
    gruppe,
    klasse: bauteil.klasse,
  })
}

function StromkreisverzeichnisFelder({
  objekt,
  aktualisiere,
}: {
  objekt: Extract<Objekt, { type: 'stromkreisverzeichnis' | 'aktorkanalliste' }>
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const zeichnung = useProject()
  const auswahl = istSchaltplan(zeichnung)
    ? [zeichnung.verteilerKennzeichen].filter((k): k is string => !!k)
    : alleVerteiler(zeichnung).map((v) => v.verteiler.verteiler?.kennzeichen ?? '')
  return (
    <>
      <label className="feld">
        {t('eigenschaften.panel.verzeichnis.verteiler')}
        <select
          value={objekt.verteiler ?? ''}
          onChange={(e) =>
            aktualisiere(
              { verteiler: e.target.value || null },
              t('eigenschaften.panel.verzeichnis.verteilerUndo'),
            )
          }
        >
          <option value="">
            {istSchaltplan(zeichnung)
              ? t('eigenschaften.panel.verzeichnis.dieserVerteilerplan')
              : t('eigenschaften.panel.verzeichnis.ersterVerteiler')}
          </option>
          {[...new Set(auswahl)].filter(Boolean).map((k) => (
            <option key={k} value={k}>
              {verteilerKennzeichenText(k)}
            </option>
          ))}
        </select>
      </label>
      <label className="feld">
        {t('eigenschaften.panel.verzeichnis.titelAutomatisch')}
        <input
          value={objekt.titel ?? ''}
          placeholder={
            objekt.type === 'aktorkanalliste'
              ? aktorkanallistenTitel(objekt, objekt.verteiler)
              : stromkreisverzeichnisTitel(objekt, objekt.verteiler)
          }
          onChange={(e) =>
            aktualisiere(
              { titel: e.target.value || null },
              t('eigenschaften.panel.gemeinsam.titelUndo'),
            )
          }
        />
      </label>
      <TexthoeheFeld objekt={objekt} aktualisiere={aktualisiere} />
    </>
  )
}

function UnterbrechungsHinweis({
  objektId,
  bezeichnung,
}: {
  objektId: string
  bezeichnung: string | undefined
}) {
  const t = useT()
  const zeichnung = useProject()
  const verweis = useMemo(
    () => ermittleUnterbrechungsVerweise(zeichnung).get(objektId),
    [zeichnung, objektId],
  )
  if (!bezeichnung?.trim())
    return <p className="feld-info">{t('eigenschaften.panel.unterbrechung.ohneBezeichnung')}</p>
  return (
    <p className="feld-info">
      {verweis
        ? t('eigenschaften.panel.unterbrechung.fortsetzung', { verweis })
        : t('eigenschaften.panel.unterbrechung.keine')}
    </p>
  )
}
