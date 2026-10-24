import { useState } from 'react'
import {
  benutzteZonenIds,
  dupliziereInstallationszone,
  erzeugeInstallationszone,
  type ZonenBauteil,
  type ZonenDefinition,
} from '../../document-model'
import { gleicheInstallationszonenAb, zonenNichtImBestand } from '../installationszonen-abgleich'
import { geltendeZonen, zonenAnzeige, zonenAuswahl, zonenBeschreibung } from '../installationszonen'
import { useInstallationszonenStore } from '../store/installationszonen-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import { useSprache, useT } from '../sprache-anbindung'
import { BAUTEIL_TEXT } from '../installationszonen'

const BAUTEILE: ZonenBauteil[] = ['decke', 'wand', 'boden']

export function InstallationszonenDialog() {
  const offen = useUiStore((s) => s.installationszonenDialogOffen)
  const { installationszonenStore, doc } = useAppContext()
  const zeichnung = useProject()
  const bestand = useInstallationszonenStore((s) => s.zonen)
  const [bearbeitet, setBearbeitet] = useState<ZonenDefinition | null>(null)
  const t = useT()
  const sprache = useSprache()

  if (!offen) return null

  const schliessen = () => {
    setBearbeitet(null)
    useUiStore.getState().setInstallationszonenDialogOffen(false)
  }
  const reihenfolge = zonenAuswahl(zeichnung.installationszonen, {
    bestand,
    aktuelle: geltendeZonen(zeichnung.installationszonen, bestand).map((z) => z.id),
  })
  const imBestand = new Set(bestand.map((z) => z.id))
  const fehlende = zonenNichtImBestand(doc)
  const benutzt = benutzteZonenIds(zeichnung)

  function meldeFehler(fehler: unknown, text: string) {
    useUiStore.getState().zeigeToast(fehler instanceof Error ? fehler.message : text)
  }

  async function nachAenderung() {
    await useInstallationszonenStore.getState().laden(installationszonenStore)
    gleicheInstallationszonenAb(doc)
  }

  async function speichere(zone: ZonenDefinition) {
    try {
      await installationszonenStore.speichern(zone)
      await nachAenderung()
      setBearbeitet(null)
    } catch (fehler) {
      meldeFehler(fehler, t('katalogdialoge.gemeinsam.speichernFehlgeschlagen'))
    }
  }

  async function loesche(zone: ZonenDefinition) {
    if (benutzt.has(zone.id)) {
      useUiStore.getState().zeigeToast(
        t('katalogdialoge.installationszonen.inBenutzung', {
          name: zonenAnzeige(zone, sprache),
        }),
      )
      return
    }
    try {
      await installationszonenStore.loeschen(zone.id)
      await nachAenderung()
    } catch (fehler) {
      meldeFehler(fehler, t('katalogdialoge.gemeinsam.loeschenFehlgeschlagen'))
    }
  }

  async function uebernehmeAusZeichnung() {
    try {
      for (const zone of fehlende)
        await installationszonenStore.speichern({
          ...zone,
          herkunft: 'benutzer',
          seedVersion: undefined,
        })
      await nachAenderung()
      useUiStore
        .getState()
        .zeigeToast(t('katalogdialoge.installationszonen.uebernommen', { n: fehlende.length }))
    } catch (fehler) {
      meldeFehler(fehler, t('katalogdialoge.installationszonen.uebernehmenFehlgeschlagen'))
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-gross" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('katalogdialoge.installationszonen.titel')}</h2>
        <p className="dialog-hinweis">{t('katalogdialoge.installationszonen.hinweis')}</p>

        {fehlende.length > 0 && (
          <p className="dialog-hinweis kabeltyp-uebernahme">
            {t('katalogdialoge.installationszonen.nichtImBestand', { n: fehlende.length })}{' '}
            <button type="button" onClick={() => void uebernehmeAusZeichnung()}>
              {t('katalogdialoge.installationszonen.inMeineUebernehmen')}
            </button>
          </p>
        )}

        <div className="kabeltyp-tabelle installationszonen-tabelle">
          {reihenfolge.map((zone) => {
            const standard = zone.herkunft === 'standard'
            const speicherbar = standard || imBestand.has(zone.id)
            return (
              <div key={zone.id} className={`kabeltyp-zeile${zone.aktiv ? '' : ' inaktiv'}`}>
                <span className="kabeltyp-zeile-name">
                  <span
                    className="installationszone-farbe"
                    style={zone.farbe ? { background: zone.farbe } : undefined}
                  />
                  {zonenAnzeige(zone, sprache)}{' '}
                  <span className="kabeltyp-zeile-herkunft">{zone.kuerzel}</span>
                </span>
                <span className="kabeltyp-zeile-bemerkung">{zonenBeschreibung(zone)}</span>
                <span className="kabeltyp-zeile-herkunft">
                  {standard
                    ? t('katalogdialoge.gemeinsam.standard')
                    : t('katalogdialoge.gemeinsam.eigen')}
                </span>
                <button
                  type="button"
                  disabled={!speicherbar}
                  title={
                    zone.aktiv
                      ? t('katalogdialoge.installationszonen.ausAuswahl')
                      : t('katalogdialoge.gemeinsam.wiederAnbieten')
                  }
                  onClick={() => void speichere({ ...zone, aktiv: !zone.aktiv })}
                >
                  {zone.aktiv
                    ? t('katalogdialoge.gemeinsam.aktiv')
                    : t('katalogdialoge.installationszonen.ausgeblendet')}
                </button>
                <button
                  type="button"
                  disabled={standard}
                  title={
                    standard
                      ? t('katalogdialoge.installationszonen.standardDuplizieren')
                      : undefined
                  }
                  onClick={() => setBearbeitet(zone)}
                >
                  {t('katalogdialoge.gemeinsam.bearbeiten')}
                </button>
                <button
                  type="button"
                  onClick={() => setBearbeitet(dupliziereInstallationszone(zone))}
                >
                  {t('katalogdialoge.gemeinsam.duplizieren')}
                </button>
                <button
                  type="button"
                  disabled={standard || !imBestand.has(zone.id)}
                  title={
                    standard ? t('katalogdialoge.installationszonen.nurAusblenden') : undefined
                  }
                  onClick={() => void loesche(zone)}
                >
                  {t('katalogdialoge.gemeinsam.loeschen')}
                </button>
              </div>
            )
          })}
        </div>

        {bearbeitet && (
          <ZonenFormular
            key={bearbeitet.id}
            zone={bearbeitet}
            abbrechen={() => setBearbeitet(null)}
            speichern={(zone) => void speichere(zone)}
          />
        )}

        <div className="dialog-aktionen">
          <button type="button" onClick={() => setBearbeitet(erzeugeInstallationszone(''))}>
            {t('katalogdialoge.installationszonen.neu')}
          </button>
          <button type="button" onClick={schliessen}>
            {t('katalogdialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

const zuCm = (m: number | undefined) => (m === undefined ? undefined : Math.round(m * 1000) / 10)
const zuM = (cm: number | null) => (cm === null ? undefined : cm / 100)

function ZonenFormular({
  zone,
  abbrechen,
  speichern,
}: {
  zone: ZonenDefinition
  abbrechen: () => void
  speichern: (zone: ZonenDefinition) => void
}) {
  const [entwurf, setEntwurf] = useState(zone)
  const t = useT()
  const setze = (patch: Partial<ZonenDefinition>) => setEntwurf({ ...entwurf, ...patch })
  const hoehe = entwurf.hoehe ?? { bezug: 'boden' as const, abstand: 1 }

  function bereinigt(): ZonenDefinition {
    const { tiefe: _t, hoehe: _h, farbe: _f, ...rest } = entwurf
    return {
      ...rest,
      bezeichnung: entwurf.bezeichnung.trim(),
      kuerzel: entwurf.kuerzel.trim(),
      ...(entwurf.verlegung === 'in' && entwurf.tiefe !== undefined
        ? { tiefe: entwurf.tiefe }
        : {}),
      ...(entwurf.bauteil === 'wand' ? { hoehe } : {}),
      ...(entwurf.farbe ? { farbe: entwurf.farbe } : {}),
    }
  }

  return (
    <div className="kabeltyp-formular">
      <label className="dialog-feld">
        {t('katalogdialoge.installationszonen.bezeichnung')}
        <input
          autoFocus
          value={entwurf.bezeichnung}
          onChange={(e) => setze({ bezeichnung: e.target.value })}
        />
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.installationszonen.kuerzel')}
        <input
          value={entwurf.kuerzel}
          maxLength={3}
          onChange={(e) => setze({ kuerzel: e.target.value })}
        />
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.installationszonen.bauteil')}
        <select
          value={entwurf.bauteil}
          onChange={(e) => setze({ bauteil: e.target.value as ZonenBauteil })}
        >
          {BAUTEILE.map((bauteil) => (
            <option key={bauteil} value={bauteil}>
              {t(BAUTEIL_TEXT[bauteil])}
            </option>
          ))}
        </select>
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.installationszonen.verlegung')}
        <select
          value={entwurf.verlegung}
          onChange={(e) => setze({ verlegung: e.target.value as 'auf' | 'in' })}
        >
          <option value="auf">{t('katalogdialoge.installationszonen.verlegungAuf')}</option>
          <option value="in">{t('katalogdialoge.installationszonen.verlegungIn')}</option>
        </select>
      </label>
      {entwurf.verlegung === 'in' && (
        <label className="dialog-feld">
          {t('katalogdialoge.installationszonen.tiefe')}
          <ZahlenFeldOptional
            min={0}
            step={0.5}
            value={zuCm(entwurf.tiefe)}
            placeholder={
              entwurf.bauteil === 'decke'
                ? t('katalogdialoge.installationszonen.tiefeRohdecke')
                : '0'
            }
            onCommit={(cm) => setze({ tiefe: zuM(cm) })}
          />
        </label>
      )}
      {entwurf.bauteil === 'wand' && (
        <>
          <label className="dialog-feld">
            {t('katalogdialoge.installationszonen.hoeheGemessen')}
            <select
              value={hoehe.bezug}
              onChange={(e) =>
                setze({ hoehe: { ...hoehe, bezug: e.target.value as 'boden' | 'decke' } })
              }
            >
              <option value="boden">{t('katalogdialoge.installationszonen.ueberFussboden')}</option>
              <option value="decke">{t('katalogdialoge.installationszonen.unterDecke')}</option>
            </select>
          </label>
          <label className="dialog-feld">
            {t('katalogdialoge.installationszonen.abstand')}
            <ZahlenFeldOptional
              min={0}
              step={1}
              value={zuCm(hoehe.abstand)}
              onCommit={(cm) => setze({ hoehe: { ...hoehe, abstand: zuM(cm) ?? 0 } })}
            />
          </label>
        </>
      )}
      <label className="dialog-feld">
        {t('katalogdialoge.installationszonen.farbe3d')}
        <input
          type="color"
          value={entwurf.farbe ?? '#5c6bc0'}
          onChange={(e) => setze({ farbe: e.target.value })}
        />
      </label>
      <div className="dialog-aktionen">
        <button
          type="button"
          disabled={!entwurf.bezeichnung.trim() || !entwurf.kuerzel.trim()}
          onClick={() => speichern(bereinigt())}
        >
          {t('katalogdialoge.gemeinsam.uebernehmen')}
        </button>
        <button type="button" onClick={abbrechen}>
          {t('katalogdialoge.gemeinsam.abbrechen')}
        </button>
      </div>
    </div>
  )
}
