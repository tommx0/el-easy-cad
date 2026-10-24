import { useState } from 'react'
import type { KnxKanalart, KnxKlemmenZeile } from '../../document-model'
import {
  istVerteiler,
  KNX_KANALART_TEXT,
  KNX_KANALARTEN,
  KNX_RESERVE_STANDARD,
  knxAktorTitel,
  komponentenBezeichnung,
  planeKnxZuordnung,
  verteilerKennzeichenText,
  wendeKnxZuordnungAn,
} from '../../document-model'
import { erzeugeBestueckungCommand } from '../../tools'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useVerknuepfung } from '../use-verknuepfung'
import { verteilerplanZu } from '../verknuepfung'
import { useT } from '../sprache-anbindung'

export function KnxZuordnenDialog() {
  const ziel = useUiStore((s) => s.knxZuordnen)
  if (!ziel) return null
  return <Inhalt blattId={ziel.blattId} objektId={ziel.objektId} />
}

function Inhalt({ blattId, objektId }: { blattId: string; objektId: string }) {
  const t = useT()
  const { doc, commands, settingsStore } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const stand = useVerknuepfung()
  const gemerkt = useSettingsStore((s) => s.verteilerplanEinstellungen)
  const verteiler = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o) => o.id === objektId)
  const kennzeichen = verteiler && istVerteiler(verteiler) ? verteiler.verteiler.kennzeichen : ''
  const plan = verteilerplanZu(stand, kennzeichen)?.plan.zeichnung ?? null
  const [reserve, setReserve] = useState(String(gemerkt.knxReserveProzent ?? KNX_RESERVE_STANDARD))
  const [kanalart, setKanalart] = useState<Map<string, KnxKanalart | null>>(new Map())
  const [beschriftung, setBeschriftung] = useState<Map<string, string>>(new Map())
  const [freigeben, setFreigeben] = useState<Set<string> | null>(null)
  const reserveZahl = Math.max(0, Math.min(200, Math.round(Number(reserve) || 0)))

  const ergebnis =
    verteiler && istVerteiler(verteiler)
      ? planeKnxZuordnung(
          { zeichnung, verteiler, katalog, plan },
          {
            reserveProzent: reserveZahl,
            kanalart,
            beschriftung,
            ...(freigeben ? { freigeben } : {}),
          },
        )
      : null

  function schliessen() {
    useUiStore.getState().setKnxZuordnen(null)
  }

  if (!verteiler || !istVerteiler(verteiler) || !ergebnis) {
    return (
      <div className="dialog-overlay" onMouseDown={schliessen}>
        <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
          <h2>{t('verteilerdialoge.knxZuordnen.titel')}</h2>
          <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.verteilerFehlt')}</p>
          <div className="dialog-aktionen">
            <button onClick={schliessen}>{t('verteilerdialoge.allgemein.schliessen')}</button>
          </div>
        </div>
      </div>
    )
  }

  const gewaehltFrei = new Set(
    ergebnis.freigeben.map((f) => f.eintragId).filter((id) => !freigeben || freigeben.has(id)),
  )
  const aenderungen =
    ergebnis.zuweisungen.length +
    gewaehltFrei.size +
    ergebnis.neueGeraete.length +
    ergebnis.umbenennen.length

  function zuordnen() {
    if (!verteiler || !istVerteiler(verteiler) || !ergebnis) return
    const neu = wendeKnxZuordnungAn(verteiler.verteiler.bestueckung, ergebnis, gewaehltFrei)
    commands.execute(
      erzeugeBestueckungCommand(
        doc,
        blattId,
        verteiler.id,
        t('verteilerdialoge.knxZuordnen.titel'),
        neu,
      ),
    )
    if (reserveZahl !== gemerkt.knxReserveProzent)
      useSettingsStore.getState().setVerteilerplanEinstellungen(settingsStore, {
        ...gemerkt,
        knxReserveProzent: reserveZahl,
      })
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-knx-zuordnen" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {t('verteilerdialoge.knxZuordnen.titelMit', {
            kennzeichen: verteilerKennzeichenText(kennzeichen),
          })}
        </h2>
        <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.erklaerung')}</p>
        <label className="dialog-feld knx-reserve">
          {t('verteilerdialoge.knxZuordnen.reserve')}
          <input
            type="number"
            min={0}
            max={200}
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
          />
        </label>
        {ergebnis.zeilen.length === 0 ? (
          <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.keineKlemmen')}</p>
        ) : (
          <table className="knx-zuordnen-tabelle">
            <thead>
              <tr>
                <th>{t('verteilerdialoge.knxZuordnen.klemme')}</th>
                <th>{t('verteilerdialoge.knxZuordnen.kanalname')}</th>
                <th>{t('verteilerdialoge.knxZuordnen.ziele')}</th>
                <th>{t('verteilerdialoge.knxZuordnen.kanal')}</th>
                <th>{t('verteilerdialoge.knxZuordnen.ergebnis')}</th>
              </tr>
            </thead>
            <tbody>
              {ergebnis.zeilen.map((z) => (
                <Zeile
                  key={z.klemme.eintrag.id}
                  zeile={z}
                  ziele={z.ziele
                    .map((ziel) => komponentenBezeichnung(ziel.objekt, katalog))
                    .join(', ')}
                  onKanalart={(k) => setKanalart((alt) => new Map(alt).set(z.klemme.eintrag.id, k))}
                  onBeschriftung={(text) =>
                    setBeschriftung((alt) => new Map(alt).set(z.klemme.eintrag.id, text))
                  }
                />
              ))}
            </tbody>
          </table>
        )}
        {ergebnis.geraete.length > 0 && (
          <p className="knx-zuordnen-geraete">
            {t('verteilerdialoge.knxZuordnen.geraete', {
              liste: ergebnis.geraete
                .map((g) =>
                  t(
                    g.neu
                      ? 'verteilerdialoge.knxZuordnen.geraetNeu'
                      : 'verteilerdialoge.knxZuordnen.geraet',
                    {
                      kennzeichen: g.kennzeichen,
                      titel: knxAktorTitel(g.daten),
                      belegt: g.belegt,
                      frei: g.daten.baugroesse - g.belegt,
                    },
                  ),
                )
                .join(' · '),
            })}
          </p>
        )}
        {ergebnis.freigeben.length > 0 && (
          <fieldset className="knx-zuordnen-freigeben">
            <legend>{t('verteilerdialoge.knxZuordnen.freigeben')}</legend>
            {ergebnis.freigeben.map((f) => (
              <label key={f.eintragId} className="dialog-feld-checkbox">
                <input
                  type="checkbox"
                  checked={gewaehltFrei.has(f.eintragId)}
                  onChange={(e) => {
                    const neu = new Set(gewaehltFrei)
                    if (e.target.checked) neu.add(f.eintragId)
                    else neu.delete(f.eintragId)
                    setFreigeben(neu)
                  }}
                />
                -{f.schluessel}
              </label>
            ))}
          </fieldset>
        )}
        {ergebnis.hinweise.map((h) => (
          <p key={h} className="dialog-hinweis verteiler-warnung">
            {h}
          </p>
        ))}
        <div className="dialog-aktionen">
          <button onClick={schliessen}>{t('verteilerdialoge.allgemein.abbrechen')}</button>
          <button className="primaer" disabled={aenderungen === 0} onClick={zuordnen}>
            {t('verteilerdialoge.knxZuordnen.zuordnen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Zeile({
  zeile,
  ziele,
  onKanalart,
  onBeschriftung,
}: {
  zeile: KnxKlemmenZeile
  ziele: string
  onKanalart: (k: KnxKanalart | null) => void
  onBeschriftung: (text: string) => void
}) {
  const benennbar = zeile.vorhanden ? zeile.kanalEintragId !== null : zeile.kanalart !== null
  const t = useT()
  return (
    <>
      <tr className={zeile.hinweise.length > 0 ? 'mit-hinweis' : undefined}>
        <td>-{zeile.klemme.schluessel}</td>
        <td>
          {benennbar ? (
            <input
              type="text"
              aria-label={t('verteilerdialoge.knxZuordnen.kanalnameFuer', {
                name: zeile.klemme.schluessel,
              })}
              value={zeile.beschriftung}
              placeholder={
                zeile.beschriftungVorschlag || t('verteilerdialoge.knxZuordnen.ohneNamen')
              }
              onChange={(e) => onBeschriftung(e.target.value)}
            />
          ) : (
            zeile.beschriftung
          )}
        </td>
        <td title={ziele}>{ziele}</td>
        <td>
          {zeile.vorhanden ? (
            <span>{t('verteilerdialoge.knxZuordnen.vorhanden')}</span>
          ) : (
            <select
              aria-label={t('verteilerdialoge.knxZuordnen.kanalFuer', {
                name: zeile.klemme.schluessel,
              })}
              value={zeile.kanalart ?? ''}
              onChange={(e) => onKanalart((e.target.value || null) as KnxKanalart | null)}
            >
              {KNX_KANALARTEN.map((k) => (
                <option key={k} value={k}>
                  {KNX_KANALART_TEXT[k]}
                </option>
              ))}
              <option value="">{t('verteilerdialoge.knxZuordnen.keinKanal')}</option>
            </select>
          )}
        </td>
        <td>{zeile.ergebnis ? `-${zeile.ergebnis}` : '–'}</td>
      </tr>
      {zeile.hinweise.length > 0 && (
        <tr className="knx-zuordnen-hinweis">
          <td />
          <td colSpan={4}>⚠ {zeile.hinweise.join(' · ')}</td>
        </tr>
      )}
    </>
  )
}
