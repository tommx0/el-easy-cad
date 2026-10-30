import { useMemo, useState } from 'react'
import type {
  BlattRaeume,
  CatalogComponent,
  RaumAuswahl,
  Schnellvorgabe,
  VerteilerArt,
  VerteilerVorschlag,
} from '../../document-model'
import {
  erzeugeVerteilerplan,
  istVerteiler,
  planspracheVon,
  artVon,
  netzDerVorgabe,
  netzVon,
  knxAktorTitel,
  quellenSchluessel,
  raeumeZurAuswahl,
  raumAuswahlSchluessel,
  verteilerKennzeichenText,
  VERTEILER_ARTEN,
  vorschlagErgebnisse,
} from '../../document-model'
import { erzeugeBestueckungCommand } from '../../tools'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useVerknuepfung } from '../use-verknuepfung'
import { verteilerplanZu } from '../verknuepfung'
import { PruefHinweis } from '../components/PruefHinweis'
import { useT } from '../sprache-anbindung'
import {
  raumVorschlagStart,
  rechneRaumVorschlag,
  reserveZahl,
  type RaumVorschlagZustand,
} from './raeume-vorschlag'

export function RaumVorschlagFelder({
  raeume,
  zustand,
  onZustand,
  vorschlag,
  katalog,
  mitKette,
}: {
  raeume: readonly BlattRaeume[]
  zustand: RaumVorschlagZustand
  onZustand: (z: RaumVorschlagZustand) => void
  vorschlag: VerteilerVorschlag
  katalog: readonly CatalogComponent[]
  mitKette: boolean
}) {
  const t = useT()
  const gewaehlt = new Set(zustand.auswahl.map(raumAuswahlSchluessel))
  const setze = (patch: Partial<RaumVorschlagZustand>) => onZustand({ ...zustand, ...patch })
  const setzeVorgabe = (patch: Partial<Schnellvorgabe>) =>
    setze({ vorgabe: { ...zustand.vorgabe, ...patch } })
  const umschalten = (a: RaumAuswahl[], an: boolean) => {
    const weg = new Set(a.map(raumAuswahlSchluessel))
    const rest = zustand.auswahl.filter((x) => !weg.has(raumAuswahlSchluessel(x)))
    setze({ auswahl: an ? [...rest, ...a] : rest })
  }
  const ergebnisse = useMemo(
    () => vorschlagErgebnisse(vorschlag.liste, katalog),
    [vorschlag.liste, katalog],
  )
  const auswahlVon = (r: BlattRaeume['raeume'][number]): RaumAuswahl =>
    r.raumId ? { blattId: r.blattId, raumId: r.raumId } : { blattId: r.blattId }

  return (
    <div className="raeume-vorschlag">
      {raeume.length === 0 ? (
        <p className="dialog-hinweis">{t('verteilerdialoge.raeume.keineRaeume')}</p>
      ) : (
        raeume.map((b) => {
          const waehlbar = b.raeume.filter((r) => !r.versorgtVon).map(auswahlVon)
          const alle =
            waehlbar.length > 0 && waehlbar.every((a) => gewaehlt.has(raumAuswahlSchluessel(a)))
          return (
            <fieldset key={b.blattId} className="raeume-vorschlag-blatt">
              <legend>
                <label className="dialog-feld-checkbox">
                  <input
                    type="checkbox"
                    checked={alle}
                    disabled={waehlbar.length === 0}
                    onChange={(e) => umschalten(waehlbar, e.target.checked)}
                  />
                  {t('verteilerdialoge.raeume.blattAlle', { name: b.blattName })}
                </label>
              </legend>
              {b.raeume.map((r) => {
                const a = auswahlVon(r)
                return (
                  <label
                    key={raumAuswahlSchluessel(a)}
                    className="dialog-feld-checkbox"
                    title={
                      r.versorgtVon
                        ? t('verteilerdialoge.raeume.versorgtVon', { name: r.versorgtVon })
                        : undefined
                    }
                  >
                    <input
                      type="checkbox"
                      checked={gewaehlt.has(raumAuswahlSchluessel(a))}
                      disabled={!!r.versorgtVon}
                      onChange={(e) => umschalten([a], e.target.checked)}
                    />
                    {r.name}
                    <span className="raeume-vorschlag-zusatz">
                      {` (${r.anzahl})`}
                      {r.gemeinsamMit ? ` → ${r.gemeinsamMit}` : ''}
                      {r.versorgtVon ? ` · ${r.versorgtVon}` : ''}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )
        })
      )}

      <div className="assistent-vorgabe">
        {mitKette && (
          <>
            <ArtWahl art={zustand.vorgabe.art} onArt={(art) => setzeVorgabe({ art })} />
            <span className="assistent-zeile">
              {t('verteilerdialoge.raeume.netz')}
              <label className="dialog-radio-zeile">
                <input
                  type="radio"
                  checked={zustand.vorgabe.drehstrom}
                  onChange={() => setzeVorgabe({ drehstrom: true })}
                />
                {t('verteilerdialoge.raeume.drehstrom')}
              </label>
              <label className="dialog-radio-zeile">
                <input
                  type="radio"
                  checked={!zustand.vorgabe.drehstrom}
                  onChange={() => setzeVorgabe({ drehstrom: false })}
                />
                {t('verteilerdialoge.raeume.wechselstrom')}
              </label>
            </span>
            <span className="assistent-zeile">
              <label className="dialog-radio-zeile">
                <input
                  type="checkbox"
                  checked={zustand.vorgabe.einspeiseklemme}
                  onChange={(e) => setzeVorgabe({ einspeiseklemme: e.target.checked })}
                />
                {t('verteilerdialoge.raeume.einspeiseklemme')}
              </label>
              {zustand.vorgabe.art === 'HV' && (
                <>
                  <label className="dialog-radio-zeile">
                    <input
                      type="checkbox"
                      checked={zustand.vorgabe.sls}
                      onChange={(e) => setzeVorgabe({ sls: e.target.checked })}
                    />
                    {t('verteilerdialoge.raeume.sls')}
                  </label>
                  <label className="dialog-radio-zeile">
                    <input
                      type="checkbox"
                      checked={zustand.vorgabe.blitzschutz}
                      onChange={(e) => setzeVorgabe({ blitzschutz: e.target.checked })}
                    />
                    {t('verteilerdialoge.raeume.blitzschutz')}
                  </label>
                  <label className="dialog-radio-zeile">
                    <input
                      type="checkbox"
                      checked={zustand.vorgabe.zaehler}
                      onChange={(e) => setzeVorgabe({ zaehler: e.target.checked })}
                    />
                    {t('verteilerdialoge.raeume.zaehler')}
                  </label>
                  <label className="dialog-radio-zeile">
                    <input
                      type="checkbox"
                      checked={zustand.vorgabe.sicherungNachZaehler}
                      onChange={(e) => setzeVorgabe({ sicherungNachZaehler: e.target.checked })}
                    />
                    {t('verteilerdialoge.raeume.sicherungNachZaehler')}
                  </label>
                </>
              )}
            </span>
          </>
        )}
        <span className="assistent-zeile">
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={zustand.vorgabe.rcd > 0}
              onChange={(e) => setzeVorgabe({ rcd: e.target.checked ? 1 : 0 })}
            />
            {t('verteilerdialoge.raeume.rcdJeBlatt')}
          </label>
          <label className="dialog-feld">
            {t('verteilerdialoge.raeume.rcdTyp')}
            <input
              value={zustand.vorgabe.rcdTyp}
              disabled={zustand.vorgabe.rcd === 0}
              placeholder={t('verteilerdialoge.raeume.rcdTypBeispiel')}
              onChange={(e) => setzeVorgabe({ rcdTyp: e.target.value })}
            />
          </label>
          <label className="dialog-feld">
            {t('verteilerdialoge.raeume.lsTyp')}
            <input
              value={zustand.vorgabe.lsTyp}
              placeholder={t('verteilerdialoge.raeume.lsTypBeispiel')}
              onChange={(e) => setzeVorgabe({ lsTyp: e.target.value })}
            />
          </label>
        </span>
        <span className="assistent-zeile">
          <label className="dialog-radio-zeile">
            <input
              type="checkbox"
              checked={zustand.knx}
              onChange={(e) => setze({ knx: e.target.checked })}
            />
            {t('verteilerdialoge.raeume.knxGleich')}
          </label>
          <label className="dialog-feld knx-reserve">
            {t('verteilerdialoge.knxZuordnen.reserve')}
            <input
              type="number"
              min={0}
              max={200}
              disabled={!zustand.knx}
              value={zustand.reserve}
              onChange={(e) => setze({ reserve: e.target.value })}
            />
          </label>
        </span>
      </div>

      {vorschlag.zeilen.length === 0 ? (
        raeume.length > 0 && (
          <p className="dialog-hinweis">{t('verteilerdialoge.raeume.keineKomponenten')}</p>
        )
      ) : (
        <table className="knx-zuordnen-tabelle raeume-vorschlag-tabelle">
          <thead>
            <tr>
              <th>{t('verteilerdialoge.raeume.blatt')}</th>
              <th>{t('verteilerdialoge.raeume.stromkreis')}</th>
              <th>{t('verteilerdialoge.raeume.bauteile')}</th>
              <th>{t('verteilerdialoge.knxZuordnen.ergebnis')}</th>
            </tr>
          </thead>
          <tbody>
            {vorschlag.zeilen.map((z) => (
              <tr key={quellenSchluessel(z.quelle)}>
                <td>{z.blattName}</td>
                <td>
                  {z.beschriftung}
                  {z.knx ? ' · KNX' : ''}
                  {z.polzahl === 3 ? ' (3~)' : ''}
                </td>
                <td title={z.bauteile}>{z.bauteile}</td>
                <td>
                  {ergebnisse.get(quellenSchluessel(z.quelle)) ?? '–'}
                  {z.vorhanden ? ` · ${t('verteilerdialoge.knxZuordnen.vorhanden')}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {vorschlag.knx && vorschlag.knx.geraete.length > 0 && (
        <p className="knx-zuordnen-geraete">
          {t('verteilerdialoge.raeume.knxAktoren', {
            liste: vorschlag.knx.geraete
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
      {vorschlag.verwaist.length > 0 && (
        <fieldset className="knx-zuordnen-freigeben">
          <legend>{t('verteilerdialoge.raeume.verwaist')}</legend>
          {vorschlag.verwaist.map((v) => (
            <label key={v.eintragId} className="dialog-feld-checkbox">
              <input
                type="checkbox"
                checked={!zustand.behalten.has(v.eintragId)}
                onChange={(e) => {
                  const behalten = new Set(zustand.behalten)
                  if (e.target.checked) behalten.delete(v.eintragId)
                  else behalten.add(v.eintragId)
                  setze({ behalten })
                }}
              />
              {t('verteilerdialoge.raeume.entfernen', { text: v.text })}
            </label>
          ))}
        </fieldset>
      )}
      {[...vorschlag.hinweise, ...(vorschlag.knx?.hinweise ?? [])].map((h) => (
        <p key={h} className="dialog-hinweis verteiler-warnung">
          {h}
        </p>
      ))}
      {vorschlag.fehlend.length > 0 && (
        <p className="dialog-hinweis verteiler-warnung">
          {t('verteilerdialoge.raeume.fehlend', { liste: vorschlag.fehlend.join(', ') })}
        </p>
      )}
    </div>
  )
}

export function RaeumeVorschlagenDialog() {
  const ziel = useUiStore((s) => s.raeumeVorschlagen)
  if (!ziel) return null
  return <Inhalt blattId={ziel.blattId} objektId={ziel.objektId} />
}

function Inhalt({ blattId, objektId }: { blattId: string; objektId: string }) {
  const t = useT()
  const { doc, commands, settingsStore, sitzung, verknuepfung } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const gemerkt = useSettingsStore((s) => s.verteilerplanEinstellungen)
  const stand = useVerknuepfung()
  const objekt = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o) => o.id === objektId)
  const verteiler = objekt && istVerteiler(objekt) ? objekt : null
  const kennzeichen = verteiler?.verteiler.kennzeichen ?? ''
  const treffer = verteilerplanZu(stand, kennzeichen)
  const raeume = useMemo(
    () => raeumeZurAuswahl(zeichnung, katalog, objektId),
    [zeichnung, katalog, objektId],
  )
  const [zustand, setZustand] = useState(() =>
    raumVorschlagStart(
      raeume,
      verteiler?.verteiler.raeume,
      gemerkt.knxReserveProzent,
      netzVon(verteiler?.verteiler),
      artVon(verteiler?.verteiler),
    ),
  )
  const vorschlag = verteiler
    ? rechneRaumVorschlag(zustand, {
        zeichnung,
        katalog,
        bestueckung: verteiler.verteiler.bestueckung,
        verteiler,
      })
    : null

  function schliessen() {
    useUiStore.getState().setRaeumeVorschlagen(null)
  }

  function uebernehmen() {
    if (!verteiler || !vorschlag) return
    commands.execute(
      erzeugeBestueckungCommand(
        doc,
        blattId,
        verteiler.id,
        t('verteilerdialoge.raeume.titel'),
        vorschlag.liste,
        new Map(),
        vorschlag.entfernt,
        {
          raeume: zustand.auswahl,
          netz: netzDerVorgabe(zustand.vorgabe),
          art: zustand.vorgabe.art,
        },
      ),
    )
    const reserve = reserveZahl(zustand)
    if (zustand.knx && reserve !== gemerkt.knxReserveProzent)
      useSettingsStore.getState().setVerteilerplanEinstellungen(settingsStore, {
        ...gemerkt,
        knxReserveProzent: reserve,
      })
    schliessen()
    if (treffer) frageNeuErzeugen(treffer.plan.dokument.id, treffer.plan.dokument.name)
  }

  function frageNeuErzeugen(dokumentId: string, name: string) {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verteilerdialoge.raeume.neuErzeugenTitel'),
      nachricht: t('verteilerdialoge.raeume.neuErzeugenNachricht', { name }),
      bestaetigenText: t('verteilerdialoge.raeume.neuErzeugen'),
      destruktiv: true,
      callback: (bestaetigt) => {
        if (bestaetigt) void neuErzeugen(dokumentId, name)
      },
    })
  }

  async function neuErzeugen(dokumentId: string, name: string) {
    const aktuell = doc
      .getZeichnung()
      .blaetter.find((b) => b.id === blattId)
      ?.objekte.find((o) => o.id === objektId)
    if (!aktuell || !istVerteiler(aktuell)) return
    try {
      const ergebnis = erzeugeVerteilerplan(aktuell, katalog, {
        name,
        maxSicherungenJeBlatt: gemerkt.maxSicherungenJeBlatt,
        maxKlemmenJeBlatt: gemerkt.maxKlemmenJeBlatt,
        aufteilung: gemerkt.aufteilung,
        plansprache: planspracheVon(doc.getZeichnung()),
      })
      await sitzung.ersetzeVerteilerplan(dokumentId, ergebnis.zeichnung)
      const offen = sitzung.getOffenesDokument()
      if (offen)
        void verknuepfung.aktualisiere({
          projektId: offen.projektId,
          dokumentId: offen.dokumentId,
          zeichnungsart: doc.getZeichnung().zeichnungsart,
        })
      useUiStore.getState().zeigeToast(t('verteilerdialoge.raeume.neuErzeugt', { name }))
    } catch (fehler) {
      useUiStore
        .getState()
        .zeigeToast(
          fehler instanceof Error ? fehler.message : t('verteilerdialoge.raeume.neuErzeugenFehler'),
        )
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-knx-zuordnen" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {t('verteilerdialoge.raeume.titelMit', {
            kennzeichen: verteilerKennzeichenText(kennzeichen),
          })}
        </h2>
        {!verteiler || !vorschlag ? (
          <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.verteilerFehlt')}</p>
        ) : (
          <>
            {treffer && (
              <p className="dialog-hinweis verteiler-hinweis">
                {t('verteilerdialoge.raeume.verknuepft', { name: treffer.plan.dokument.name })}
              </p>
            )}
            <p className="dialog-hinweis">{t('verteilerdialoge.raeume.erklaerung')}</p>
            <RaumVorschlagFelder
              raeume={raeume}
              zustand={zustand}
              onZustand={setZustand}
              vorschlag={vorschlag}
              katalog={katalog}
              mitKette={verteiler.verteiler.bestueckung.length === 0}
            />
          </>
        )}
        {verteiler && vorschlag && <PruefHinweis />}
        <div className="dialog-aktionen">
          <button onClick={schliessen}>{t('verteilerdialoge.allgemein.abbrechen')}</button>
          <button
            className="primaer"
            disabled={!vorschlag || vorschlag.zeilen.length + vorschlag.verwaist.length === 0}
            onClick={uebernehmen}
          >
            {t('verteilerdialoge.allgemein.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ArtWahl({ art, onArt }: { art: VerteilerArt; onArt: (art: VerteilerArt) => void }) {
  const t = useT()
  return (
    <span className="assistent-zeile">
      {t('verteilerdialoge.raeume.art')}
      {VERTEILER_ARTEN.map((a) => (
        <label key={a.art} className="dialog-radio-zeile">
          <input type="radio" checked={art === a.art} onChange={() => onArt(a.art)} />
          {a.name}
        </label>
      ))}
    </span>
  )
}
