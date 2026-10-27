import { useState } from 'react'
import {
  KOMBINATION_FAKTOR_MAX,
  KOMBINATION_FAKTOR_MIN,
  SCHALTPLAN_RASTER,
  STANDARD_KOMBINATION_FAKTOR,
  istSchaltplan,
} from '../../document-model'
import { erzeugeZeichnungAendernCommand, FANGARTEN_RANGFOLGE } from '../../tools'
import { ladeAssetHoch, assetUrl, type UpdateSuche } from '../../persistence'
import { useAppContext, useAktivesBlatt, useProject } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { KabeltypFeld } from '../components/KabeltypFeld'
import { setzeStandardKabeltyp } from '../kabeltyp-abgleich'
import { fangartName } from '../objektfang-namen'
import { useSettingsStore } from '../store/settings-store'
import { TastenkuerzelEinstellungen } from './TastenkuerzelEinstellungen'
import { WerkzeugleisteEinstellungen } from './WerkzeugleisteEinstellungen'
import { SymbolleisteEinstellungen } from './SymbolleisteEinstellungen'
import {
  SPRACHEN,
  SPRACH_EIGENNAMEN,
  SPRACHWAHL_FREIGEGEBEN,
  spracheAusKennung,
} from '../../sprache'
import type { Schluessel } from '../../sprache'
import { systemKennung, useT } from '../sprache-anbindung'
import { lizenzStatusText } from '../community'

function SpracheAbschnitt() {
  const { settingsStore } = useAppContext()
  const t = useT()
  const sprache = useSettingsStore((s) => s.sprache)
  const setSprache = useSettingsStore((s) => s.setSprache)
  const system = SPRACH_EIGENNAMEN[spracheAusKennung(systemKennung())]

  return (
    <>
      <h3>{t('einstellungen.sprache.titel')}</h3>
      <label className="dialog-feld">
        {t('einstellungen.sprache.beschriftung')}
        <select
          value={sprache ?? ''}
          onChange={(e) => setSprache(settingsStore, e.target.value || null)}
        >
          <option value="">{t('einstellungen.sprache.wieSystem', { sprache: system })}</option>
          {SPRACHEN.map((code) => (
            <option key={code} value={code}>
              {SPRACH_EIGENNAMEN[code]}
            </option>
          ))}
        </select>
      </label>
      <p className="dialog-hinweis">{t('einstellungen.sprache.hinweis')}</p>
    </>
  )
}
import { ZusatzmodulEinstellungen } from './ZusatzmodulEinstellungen'
import { KiAssistentEinstellungen } from './KiAssistentEinstellungen'
import { BeschriftungGroesseInhalt } from './BeschriftungGroesseDialog'
import { ZahlenFeld } from '../ZahlenFeld'
import { WAND_BEVORZUGUNG_MAX } from '../../routing'
import { STANDARD_NICHT_DRUCKBEREICH } from '../../rendering'
import { waehleEinstellungsDatei } from '../einstellungen-austausch'

function LizenzVerweis() {
  const t = useT()
  const status = useUiStore((s) => s.produktlizenzStatus)
  function oeffnen() {
    useUiStore.getState().setEinstellungenOffen(false)
    useUiStore.getState().setMeineLizenzDialogOffen(true)
  }
  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.lizenz.titel')}</h3>
      <p className="dialog-hinweis">{lizenzStatusText(status, t)}</p>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.einstellungenDialog.lizenz.hinweis')}</p>
      <div className="dialog-aktionen">
        <button type="button" onClick={oeffnen}>
          {t('verwaltungsdialoge.einstellungenDialog.lizenz.oeffnen')}
        </button>
      </div>
    </>
  )
}

function UpdateAbschnitt() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const updateSuche = useSettingsStore((s) => s.updateSuche)
  const setUpdateSuche = useSettingsStore((s) => s.setUpdateSuche)
  function jetztSuchen() {
    useUiStore.getState().setEinstellungenOffen(false)
    useUiStore.getState().setUpdateDialog({ art: 'frage', anlass: 'menue' })
  }
  return (
    <>
      <h3>{t('community.update.einstellungTitel')}</h3>
      <label className="dialog-feld">
        {t('community.update.einstellung')}
        <select
          value={updateSuche}
          onChange={(e) => setUpdateSuche(settingsStore, e.target.value as UpdateSuche)}
        >
          <option value="fragen">{t('community.update.einstellungFragen')}</option>
          <option value="immer">{t('community.update.einstellungImmer')}</option>
          <option value="nie">{t('community.update.einstellungNie')}</option>
        </select>
      </label>
      <p className="dialog-hinweis">{t('community.update.hinweisGithub')}</p>
      <div className="dialog-aktionen">
        <button type="button" onClick={jetztSuchen}>
          {t('community.update.einstellungJetzt')}
        </button>
      </div>
    </>
  )
}

function AllgemeinAbschnitt() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const zeichnung = useProject()
  const gridBasisSchritt = useSettingsStore((s) => s.gridBasisSchritt)
  const setGridBasisSchritt = useSettingsStore((s) => s.setGridBasisSchritt)
  const nichtDruckbereich = useSettingsStore((s) => s.nichtDruckbereich)
  const setNichtDruckbereich = useSettingsStore((s) => s.setNichtDruckbereich)
  const pfeiltastenSchritte = useSettingsStore((s) => s.pfeiltastenSchritte)
  const setPfeiltastenSchritt = useSettingsStore((s) => s.setPfeiltastenSchritt)
  const vorgabehoehen = useSettingsStore((s) => s.installationshoehenVorgabenCm)
  const setVorgabehoehen = useSettingsStore((s) => s.setInstallationshoehenVorgaben)
  const kombinationsFaktor = useSettingsStore((s) => s.kombinationsFaktor)
  const setKombinationsFaktor = useSettingsStore((s) => s.setKombinationsFaktor)
  const kontextleiste = useSettingsStore((s) => s.kontextleisteSichtbar)
  const setKontextleiste = useSettingsStore((s) => s.setKontextleisteSichtbar)
  const stromkreisImPanel = useSettingsStore((s) => s.stromkreisImPanel)
  const verknuepfungNachLeitung = useSettingsStore((s) => s.verknuepfungNachLeitung)
  const setVerknuepfungNachLeitung = useSettingsStore((s) => s.setVerknuepfungNachLeitung)
  const setStromkreisImPanel = useSettingsStore((s) => s.setStromkreisImPanel)

  return (
    <>
      {SPRACHWAHL_FREIGEGEBEN && <SpracheAbschnitt />}
      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.tastenfunktionen')}</h3>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={kontextleiste}
          onChange={(e) => setKontextleiste(settingsStore, e.target.checked)}
        />
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.kontextleiste')}
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.kontextleisteHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.verteiler')}</h3>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={stromkreisImPanel}
          onChange={(e) => setStromkreisImPanel(settingsStore, e.target.checked)}
        />
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.stromkreisImPanel')}
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.stromkreisHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.raster')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.rasterBasis')}
        <ZahlenFeld
          min={0.01}
          step={0.05}
          value={gridBasisSchritt}
          onCommit={(wert) => setGridBasisSchritt(settingsStore, wert)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.rasterHinweis')}
      </p>
      {istSchaltplan(zeichnung) && (
        <p className="dialog-hinweis">
          {t('verwaltungsdialoge.einstellungenDialog.allgemein.rasterSchaltplan', {
            cm: SCHALTPLAN_RASTER * 100,
          })}
        </p>
      )}

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.nichtDruckbereich')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.nichtDruckbereichFarbe')}
        <input
          type="color"
          value={nichtDruckbereich.farbe}
          onChange={(e) =>
            setNichtDruckbereich(settingsStore, { ...nichtDruckbereich, farbe: e.target.value })
          }
        />
      </label>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.nichtDruckbereichDeckkraft')}
        <ZahlenFeld
          min={0}
          max={100}
          step={5}
          value={Math.round(nichtDruckbereich.deckkraft * 100)}
          onCommit={(prozent) =>
            setNichtDruckbereich(settingsStore, {
              ...nichtDruckbereich,
              deckkraft: Math.min(100, Math.max(0, prozent)) / 100,
            })
          }
        />
      </label>
      <div className="dialog-knopfreihe">
        <button
          type="button"
          onClick={() => setNichtDruckbereich(settingsStore, STANDARD_NICHT_DRUCKBEREICH)}
        >
          {t('verwaltungsdialoge.einstellungenDialog.allgemein.nichtDruckbereichStandard')}
        </button>
      </div>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.nichtDruckbereichHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.pfeiltasten')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.pfeiltaste')}
        <ZahlenFeld
          min={0.1}
          step={1}
          value={Math.round(pfeiltastenSchritte.kleinMeter * 1000) / 10}
          onCommit={(cm) =>
            setPfeiltastenSchritt(settingsStore, 'klein', Math.round(cm * 10) / 1000)
          }
        />
      </label>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.umschaltPfeiltaste')}
        <ZahlenFeld
          min={0.1}
          step={10}
          value={Math.round(pfeiltastenSchritte.grossMeter * 1000) / 10}
          onCommit={(cm) =>
            setPfeiltastenSchritt(settingsStore, 'gross', Math.round(cm * 10) / 1000)
          }
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.pfeiltastenHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.installationshoehe')}</h3>
      <div className="vorgabehoehen-liste">
        {vorgabehoehen.map((cm, i) => (
          <span key={i} className="vorgabehoehen-zeile">
            <ZahlenFeld
              min={0}
              step={5}
              value={cm}
              ariaLabel={t('verwaltungsdialoge.einstellungenDialog.allgemein.vorgabehoehe', {
                nr: i + 1,
              })}
              onCommit={(neuerWert) =>
                setVorgabehoehen(
                  settingsStore,
                  vorgabehoehen.map((alt, j) => (j === i ? neuerWert : alt)),
                )
              }
            />
            <span className="vorgabehoehen-einheit">cm</span>
            <button
              type="button"
              aria-label={t(
                'verwaltungsdialoge.einstellungenDialog.allgemein.vorgabehoeheEntfernen',
                { cm },
              )}
              title={t('verwaltungsdialoge.einstellungenDialog.entfernen')}
              onClick={() =>
                setVorgabehoehen(
                  settingsStore,
                  vorgabehoehen.filter((_, j) => j !== i),
                )
              }
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="dialog-knopfreihe">
        <button
          type="button"
          onClick={() =>
            setVorgabehoehen(settingsStore, [
              ...vorgabehoehen,
              vorgabehoehen.length > 0 ? Math.max(...vorgabehoehen) + 10 : 30,
            ])
          }
        >
          {t('verwaltungsdialoge.einstellungenDialog.allgemein.hoeheHinzufuegen')}
        </button>
      </div>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.vorgabehoehenHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.kombinationen')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.symbolgroesse')}
        <ZahlenFeld
          min={KOMBINATION_FAKTOR_MIN * 100}
          max={KOMBINATION_FAKTOR_MAX * 100}
          step={5}
          value={Math.round(kombinationsFaktor * 100)}
          onCommit={(prozent) => setKombinationsFaktor(settingsStore, prozent / 100)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.kombinationenHinweis', {
          prozent: Math.round(STANDARD_KOMBINATION_FAKTOR * 100),
        })}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.gruppen')}</h3>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={verknuepfungNachLeitung}
          onChange={(e) => setVerknuepfungNachLeitung(settingsStore, e.target.checked)}
        />
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.verknuepfung')}
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.verknuepfungHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.allgemein.uebertragen')}</h3>
      <div className="dialog-knopfreihe">
        <button
          type="button"
          onClick={() => useUiStore.getState().setEinstellungenAustausch({ art: 'sichern' })}
        >
          {t('verwaltungsdialoge.einstellungenDialog.allgemein.sichern')}
        </button>
        <button type="button" onClick={() => void waehleEinstellungsDatei()}>
          {t('verwaltungsdialoge.einstellungenDialog.allgemein.einspielen')}
        </button>
      </div>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.allgemein.uebertragenHinweis')}
      </p>
    </>
  )
}

function RoutingAbschnitt() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const routing = useSettingsStore((s) => s.routing)
  const setRoutingSetting = useSettingsStore((s) => s.setRoutingSetting)
  const erstNachLoslassen = useSettingsStore((s) => s.leitungenErstNachLoslassen)
  const setErstNachLoslassen = useSettingsStore((s) => s.setLeitungenErstNachLoslassen)

  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.routing.titel')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.kostenProMeter')}
        <ZahlenFeld
          min={0}
          step={0.1}
          value={routing.kostenProLaenge}
          onCommit={(wert) => setRoutingSetting(settingsStore, 'kostenProLaenge', wert)}
        />
      </label>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.kosten90')}
        <ZahlenFeld
          min={0}
          step={0.05}
          value={routing.kosten90}
          onCommit={(wert) => setRoutingSetting(settingsStore, 'kosten90', wert)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.kostenHinweis')}
      </p>

      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={erstNachLoslassen}
          onChange={(e) => setErstNachLoslassen(settingsStore, e.target.checked)}
        />
        {t('verwaltungsdialoge.einstellungenDialog.routing.erstNachLoslassen')}
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.erstNachLoslassenHinweis')}
      </p>

      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.parallelAbstand')}
        <ZahlenFeld
          min={0}
          max={20}
          step={0.5}
          value={Math.round(routing.parallelAbstandMeter * 1000) / 10}
          onCommit={(cm) => setRoutingSetting(settingsStore, 'parallelAbstandMeter', cm / 100)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.parallelAbstandHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.routing.feineinstellungen')}</h3>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.sicherheitsabstand')}
        <ZahlenFeld
          min={0}
          max={50}
          step={1}
          value={Math.round(routing.sicherheitsabstandMeter * 100)}
          onCommit={(cm) => setRoutingSetting(settingsStore, 'sicherheitsabstandMeter', cm / 100)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.sicherheitsabstandHinweis')}
      </p>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.sucherweiterungen')}
        <ZahlenFeld
          min={1}
          max={10}
          step={1}
          value={routing.maxSuchbereichErweiterungen}
          onCommit={(wert) =>
            setRoutingSetting(settingsStore, 'maxSuchbereichErweiterungen', Math.round(wert))
          }
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.sucherweiterungenHinweis')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.routing.wandfuehrung')}</h3>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={routing.wandfuehrung}
          onChange={(e) => setRoutingSetting(settingsStore, 'wandfuehrung', e.target.checked)}
        />
        {t('verwaltungsdialoge.einstellungenDialog.routing.wandfuehrungAn')}
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.wandfuehrungHinweis')}
      </p>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.wandabstand')}
        <ZahlenFeld
          min={0}
          max={100}
          step={1}
          disabled={!routing.wandfuehrung}
          value={Math.round(routing.wandabstandMeter * 100)}
          onCommit={(cm) => setRoutingSetting(settingsStore, 'wandabstandMeter', cm / 100)}
        />
      </label>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.bevorzugung')}
        <ZahlenFeld
          min={0}
          max={WAND_BEVORZUGUNG_MAX * 100}
          step={5}
          disabled={!routing.wandfuehrung}
          value={Math.round(routing.wandBevorzugung * 100)}
          onCommit={(prozent) =>
            setRoutingSetting(
              settingsStore,
              'wandBevorzugung',
              Math.min(Math.max(prozent, 0), WAND_BEVORZUGUNG_MAX * 100) / 100,
            )
          }
        />
      </label>
      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.routing.aufschlag')}
        <ZahlenFeld
          min={0}
          step={0.5}
          disabled={!routing.wandfuehrung}
          value={routing.wandQuerungsKosten}
          onCommit={(wert) => setRoutingSetting(settingsStore, 'wandQuerungsKosten', wert)}
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.routing.bevorzugungHinweis')}
      </p>
    </>
  )
}

function ObjektfangAbschnitt() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const objektfangArten = useSettingsStore((s) => s.objektfangArten)
  const toggleObjektfangArt = useSettingsStore((s) => s.toggleObjektfangArt)

  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.objektfang.titel')}</h3>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.objektfang.hinweis')}
      </p>
      {FANGARTEN_RANGFOLGE.map((art) => (
        <label key={art} className="feld feld-checkbox">
          <input
            type="checkbox"
            checked={objektfangArten.includes(art)}
            onChange={() => toggleObjektfangArt(settingsStore, art)}
          />
          {fangartName(art)}
        </label>
      ))}
    </>
  )
}

function LeitungenAbschnitt() {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()

  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.leitungen.titel')}</h3>
      <KabeltypFeld
        titel={t('verwaltungsdialoge.einstellungenDialog.leitungen.standardKabeltyp')}
        wertId={zeichnung.standardKabeltypId}
        zusatzTypen={zeichnung.kabeltypen}
        freierTextErlaubt={false}
        leerText={t('verwaltungsdialoge.einstellungenDialog.leitungen.keinStandard')}
        aendern={(wahl) => setzeStandardKabeltyp(doc, commands, wahl)}
      />
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.leitungen.standardKabeltypHinweis')}
      </p>

      <label className="dialog-feld">
        {t('verwaltungsdialoge.einstellungenDialog.leitungen.anschlussreserve')}
        <ZahlenFeld
          min={0}
          step={10}
          value={Math.round(zeichnung.anschlussreserveMeter * 100)}
          onCommit={(cm) =>
            commands.execute(
              erzeugeZeichnungAendernCommand(
                doc,
                t('verwaltungsdialoge.einstellungenDialog.leitungen.anschlussreserveAendern'),
                {
                  anschlussreserveMeter: cm / 100,
                },
              ),
            )
          }
        />
      </label>
      <p className="dialog-hinweis">
        {t('verwaltungsdialoge.einstellungenDialog.leitungen.anschlussreserveHinweis')}
      </p>
    </>
  )
}

function BlattAbschnitt() {
  const t = useT()
  const blatt = useAktivesBlatt()
  const zeichnung = useProject()
  const schaltplan = istSchaltplan(zeichnung)

  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.blatt.zeichnungsart')}</h3>
      <p className="dialog-hinweis">
        {schaltplan
          ? t('verwaltungsdialoge.einstellungenDialog.blatt.istSchaltplan')
          : t('verwaltungsdialoge.einstellungenDialog.blatt.istBauplan')}
      </p>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.blatt.zeichenflaeche')}</h3>
      <p className="dialog-hinweis">
        {blatt.zeichenflaeche
          ? t('verwaltungsdialoge.einstellungenDialog.blatt.zeichenflaecheAngaben', {
              name: blatt.name,
              format: blatt.zeichenflaeche.papierformat,
              lage: t(
                blatt.zeichenflaeche.ausrichtung === 'hoch'
                  ? 'verwaltungsdialoge.einstellungenDialog.blatt.hoch'
                  : 'verwaltungsdialoge.einstellungenDialog.blatt.quer',
              ),
              nenner: String(blatt.zeichenflaeche.massstabNenner),
            })
          : t('verwaltungsdialoge.einstellungenDialog.blatt.ohneZeichenflaeche', {
              name: blatt.name,
            })}
      </p>
      <div className="dialog-aktionen">
        <button
          type="button"
          onClick={() => useUiStore.getState().setZeichenflaecheEinrichtenOffen(true)}
        >
          {t('verwaltungsdialoge.einstellungenDialog.blatt.einrichten')}
        </button>
        <button type="button" onClick={() => useUiStore.getState().setBlattVerwaltungOffen(true)}>
          {t('verwaltungsdialoge.einstellungenDialog.blatt.verwalten')}
        </button>
      </div>

      <h3>{t('verwaltungsdialoge.einstellungenDialog.blatt.beschriftung')}</h3>
      <BeschriftungGroesseInhalt />
    </>
  )
}

function FirmaAbschnitt() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const firmenlogoAssetId = useSettingsStore((s) => s.firmenlogoAssetId)
  const firmenlogoDateiname = useSettingsStore((s) => s.firmenlogoDateiname)
  const setFirmenlogo = useSettingsStore((s) => s.setFirmenlogo)
  const [wirdHochgeladen, setWirdHochgeladen] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  async function dateiAusgewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    e.target.value = ''
    if (!datei) return

    setFehler(null)
    setWirdHochgeladen(true)
    try {
      const assetId = await ladeAssetHoch(datei, datei.name)
      setFirmenlogo(settingsStore, assetId, datei.name)
    } catch (fehlerObjekt) {
      setFehler(
        fehlerObjekt instanceof Error
          ? fehlerObjekt.message
          : t('verwaltungsdialoge.einstellungenDialog.firma.nichtHochgeladen'),
      )
    } finally {
      setWirdHochgeladen(false)
    }
  }

  return (
    <>
      <h3>{t('verwaltungsdialoge.einstellungenDialog.firma.titel')}</h3>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.einstellungenDialog.firma.hinweis')}</p>
      {firmenlogoAssetId && (
        <div className="firmenlogo-vorschau-zeile">
          <img
            className="firmenlogo-vorschau"
            src={assetUrl(firmenlogoAssetId)}
            alt={firmenlogoDateiname ?? t('verwaltungsdialoge.einstellungenDialog.firma.titel')}
          />
          <span className="dialog-hinweis">{firmenlogoDateiname}</span>
          <button type="button" onClick={() => setFirmenlogo(settingsStore, null, null)}>
            {t('verwaltungsdialoge.einstellungenDialog.entfernen')}
          </button>
        </div>
      )}
      <label className="produktlizenz-sperre-upload">
        <span>
          {wirdHochgeladen
            ? t('verwaltungsdialoge.einstellungenDialog.firma.wirdHochgeladen')
            : firmenlogoAssetId
              ? t('verwaltungsdialoge.einstellungenDialog.firma.anderesLogo')
              : t('verwaltungsdialoge.einstellungenDialog.firma.hochladen')}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void dateiAusgewaehlt(e)}
          disabled={wirdHochgeladen}
        />
      </label>
      {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}
    </>
  )
}

type EinstellungenTab =
  | 'allgemein'
  | 'routing'
  | 'objektfang'
  | 'leitungen'
  | 'blatt'
  | 'firma'
  | 'tastenkuerzel'
  | 'werkzeugleiste'
  | 'symbolleiste'
  | 'ki'
  | 'module'
  | 'lizenz'

const TABS: { id: EinstellungenTab; label: Schluessel }[] = [
  { id: 'allgemein', label: 'verwaltungsdialoge.einstellungenDialog.reiter.allgemein' },
  { id: 'routing', label: 'verwaltungsdialoge.einstellungenDialog.reiter.routing' },
  { id: 'objektfang', label: 'verwaltungsdialoge.einstellungenDialog.reiter.objektfang' },
  { id: 'leitungen', label: 'verwaltungsdialoge.einstellungenDialog.reiter.leitungen' },
  { id: 'blatt', label: 'verwaltungsdialoge.einstellungenDialog.reiter.blatt' },
  { id: 'firma', label: 'verwaltungsdialoge.einstellungenDialog.reiter.firma' },
  { id: 'tastenkuerzel', label: 'verwaltungsdialoge.einstellungenDialog.reiter.tastenkuerzel' },
  { id: 'werkzeugleiste', label: 'verwaltungsdialoge.einstellungenDialog.reiter.werkzeugleiste' },
  { id: 'symbolleiste', label: 'verwaltungsdialoge.einstellungenDialog.reiter.symbolleiste' },
  { id: 'ki', label: 'verwaltungsdialoge.einstellungenDialog.reiter.ki' },
  { id: 'module', label: 'verwaltungsdialoge.einstellungenDialog.reiter.module' },
  { id: 'lizenz', label: 'verwaltungsdialoge.einstellungenDialog.reiter.lizenz' },
]

export function EinstellungenDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.einstellungenOffen)
  const schliessen = () => useUiStore.getState().setEinstellungenOffen(false)
  const gemerkterTab = useUiStore((s) => s.einstellungenTab)
  const tab: EinstellungenTab = TABS.some((eintrag) => eintrag.id === gemerkterTab)
    ? (gemerkterTab as EinstellungenTab)
    : 'allgemein'
  const setTab = (neu: EinstellungenTab) => useUiStore.getState().setEinstellungenTab(neu)

  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-einstellungen" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.einstellungenDialog.titel')}</h2>
        <div className="einstellungen-layout">
          <div className="einstellungen-tabs">
            {TABS.map((eintrag) => (
              <button
                key={eintrag.id}
                type="button"
                className={tab === eintrag.id ? 'aktiv' : ''}
                onClick={() => setTab(eintrag.id)}
              >
                {t(eintrag.label)}
              </button>
            ))}
          </div>
          <div className="einstellungen-inhalt">
            {tab === 'allgemein' && <AllgemeinAbschnitt />}
            {tab === 'routing' && <RoutingAbschnitt />}
            {tab === 'objektfang' && <ObjektfangAbschnitt />}
            {tab === 'leitungen' && <LeitungenAbschnitt />}
            {tab === 'blatt' && <BlattAbschnitt />}
            {tab === 'firma' && <FirmaAbschnitt />}
            {tab === 'tastenkuerzel' && <TastenkuerzelEinstellungenTab />}
            {tab === 'werkzeugleiste' && <WerkzeugleisteEinstellungenTab />}
            {tab === 'symbolleiste' && <SymbolleisteEinstellungenTab />}
            {tab === 'ki' && <KiAssistentEinstellungen />}
            {tab === 'module' && <ZusatzmodulEinstellungen />}
            {tab === 'lizenz' && (
              <>
                <LizenzVerweis />
                <UpdateAbschnitt />
              </>
            )}
          </div>
        </div>

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TastenkuerzelEinstellungenTab() {
  const { settingsStore } = useAppContext()
  return <TastenkuerzelEinstellungen settingsStore={settingsStore} />
}

function WerkzeugleisteEinstellungenTab() {
  const { settingsStore } = useAppContext()
  return <WerkzeugleisteEinstellungen settingsStore={settingsStore} />
}

function SymbolleisteEinstellungenTab() {
  const { settingsStore } = useAppContext()
  return <SymbolleisteEinstellungen settingsStore={settingsStore} />
}
