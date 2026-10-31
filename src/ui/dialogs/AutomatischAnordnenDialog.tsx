import { useEffect, useMemo, useRef, useState } from 'react'
import type { Blatt, BoundingBox, Objekt, Zeichnung } from '../../document-model'
import {
  expandBoundingBox,
  getBoundingBox,
  istSchaltplan,
  unionBoundingBox,
} from '../../document-model'
import type { KomponentenRenderKontext } from '../../rendering'
import {
  holeSwitchAnzeigeDaten,
  messeBeschriftungen,
  zeichneAnordnenVorschau,
} from '../../rendering'
import type { AnordnenEinstellungen, AnordnenVorschlag } from '../../tools'
import {
  anordnenKontext,
  auswahlRahmen,
  besteVorschlaege,
  BAUPLAN_BAHNABSTAND_MM,
  erzeugeVorschlagCommand,
  SCHALTPLAN_BAHNABSTAND_MM,
  STANDARD_ANORDNEN_EINSTELLUNGEN,
  wendeVorschlagAn,
} from '../../tools'
import { anordnenMeldung, anordnenNachricht, anordnenUmfang } from '../automatisch-anordnen'
import { starteAnordnenRechnung } from '../anordnen-rechner'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import { formatiereZahl } from '../../sprache'
import type { Schluessel } from '../../sprache'
import { leitungsverlegungAusFuer, useLeitungsverlegungAus } from '../leitungsverlegung'
import { useT } from '../sprache-anbindung'
import { planspracheVon, planUebersetzer } from '../../document-model'

export function AutomatischAnordnenDialog() {
  const dialog = useUiStore((s) => s.anordnenDialog)
  if (!dialog) return null
  return <DialogInhalt auswahlIds={dialog.auswahlIds} />
}

const NEU_RECHNEN_NACH_MS = 250

interface Stand {
  anzahl: number
  gesamt: number
  fertig: boolean
  fehler: string | null
}

function renderKontext(
  blatt: Blatt,
  objekte: Objekt[],
  zeichnung: Zeichnung,
  katalogKomponenten: KomponentenRenderKontext['katalogKomponenten'],
  catalogStore: KomponentenRenderKontext['catalogStore'],
  neuZeichnen: () => void,
): KomponentenRenderKontext {
  const switchDaten = holeSwitchAnzeigeDaten(zeichnung, katalogKomponenten)
  return {
    tp: planUebersetzer(zeichnung),
    plansprache: planspracheVon(zeichnung),
    katalogKomponenten,
    catalogStore,
    aufNeuZeichnenAnfordern: neuZeichnen,
    poeSummen: switchDaten.poeSummen,
    traegerMitModulen: switchDaten.traegerMitModulen,
    traegerVollBelegt: switchDaten.traegerVollBelegt,
    querverweisTexte: switchDaten.querverweisTexte,
    stromkreisTexte: switchDaten.stromkreisTexte,
    blattverweise: switchDaten.blattverweise,
    blattAnzeige: blatt,
    alleObjekteAufBlatt: objekte,
    schaltplan: istSchaltplan(zeichnung),
    leitungsverlegungAus: leitungsverlegungAusFuer(zeichnung),
  }
}

function DialogInhalt({ auswahlIds }: { auswahlIds: string[] }) {
  const { doc, commands, settingsStore, catalogStore } = useAppContext()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const gemerkt = useSettingsStore((s) => s.anordnenEinstellungen)
  const leitungsverlegungAus = useLeitungsverlegungAus()
  const einstellungen = useMemo(
    () => (leitungsverlegungAus ? { ...gemerkt, trunksBilden: false } : gemerkt),
    [gemerkt, leitungsverlegungAus],
  )
  const setEinstellungen = useSettingsStore((s) => s.setAnordnenEinstellungen)
  const routing = useSettingsStore((s) => s.routing)
  const schliessen = useUiStore((s) => s.schliesseAnordnenDialog)
  const t = useT()
  const [blatt] = useState(() => doc.getAktivesBlatt())
  const [zeichnung] = useState(() => doc.getZeichnung())
  const schaltplan = istSchaltplan(zeichnung)
  const umfang = useMemo(
    () => anordnenUmfang(blatt.objekte, auswahlIds, blatt.ebenen),
    [blatt, auswahlIds],
  )
  const nurVerlegen = !umfang || umfang.komponenten < 2

  const [vorschlaege, setVorschlaege] = useState<AnordnenVorschlag[]>([])
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [stand, setStand] = useState<Stand>({ anzahl: 0, gesamt: 0, fertig: false, fehler: null })

  useEffect(() => {
    let abbrechen: (() => void) | null = null
    const zeitgeber = setTimeout(() => {
      setVorschlaege([])
      setGewaehlt(null)
      setStand({ anzahl: 0, gesamt: 0, fertig: false, fehler: null })
      const ids = new Set(auswahlIds)
      const messCtx = document.createElement('canvas').getContext('2d')
      const rahmen = renderKontext(
        blatt,
        blatt.objekte,
        zeichnung,
        katalogKomponenten,
        catalogStore,
        () => {},
      )
      const kontext = {
        ...anordnenKontext(blatt, zeichnung, ids, einstellungen, routing),
        beschriftungen: messCtx ? messeBeschriftungen(messCtx, blatt.objekte, ids, rahmen) : {},
      }
      abbrechen = starteAnordnenRechnung(kontext, {
        vorschlag: (vorschlag, gesamt) => {
          setVorschlaege((alt) => [...alt, vorschlag])
          setStand((s) => ({ ...s, anzahl: s.anzahl + 1, gesamt }))
        },
        fertig: () => setStand((s) => ({ ...s, fertig: true })),
        fehler: (meldung) => setStand((s) => ({ ...s, fertig: true, fehler: meldung })),
      })
    }, NEU_RECHNEN_NACH_MS)
    return () => {
      clearTimeout(zeitgeber)
      abbrechen?.()
    }
  }, [blatt, zeichnung, auswahlIds, einstellungen, routing, katalogKomponenten, catalogStore])

  const gezeigt = besteVorschlaege(vorschlaege, auswahlRahmen(einstellungen))
  const auswahl = gezeigt.find((v) => v.schluessel === gewaehlt) ?? gezeigt[0] ?? null

  function aendere(teil: Partial<AnordnenEinstellungen>) {
    setEinstellungen(settingsStore, { ...gemerkt, ...teil })
  }

  function uebernehmen() {
    if (!auswahl) return
    commands.execute(erzeugeVorschlagCommand(doc, blatt.id, auswahl))
    const meldung = anordnenMeldung(auswahl.kennzahlen)
    if (meldung) useUiStore.getState().zeigeToast(meldung)
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-anordnen"
        role="dialog"
        aria-label={t('zeichendialoge.anordnen.titel')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>
          {nurVerlegen
            ? t('zeichendialoge.anordnen.titelVerlegen')
            : t('zeichendialoge.anordnen.titel')}
        </h2>
        {umfang && <p className="anordnen-nachricht">{anordnenNachricht(umfang, schaltplan)}</p>}
        <div className="anordnen-koerper">
          <Einstellungen
            einstellungen={einstellungen}
            aendere={aendere}
            nurVerlegen={nurVerlegen}
            schaltplan={schaltplan}
            mitZeichenflaeche={blatt.zeichenflaeche !== null}
            ohneTrunks={leitungsverlegungAus}
          />
          <div className="anordnen-varianten">
            <div className="anordnen-stand" aria-live="polite">
              {stand.fehler
                ? t('zeichendialoge.anordnen.fehler', { fehler: stand.fehler })
                : stand.fertig
                  ? t('zeichendialoge.anordnen.berechnet', { n: stand.anzahl })
                  : stand.gesamt
                    ? t('zeichendialoge.anordnen.berechneVon', {
                        n: stand.anzahl,
                        gesamt: stand.gesamt,
                      })
                    : t('zeichendialoge.anordnen.berechne', { n: stand.anzahl })}
            </div>
            {stand.fertig && !stand.fehler && gezeigt.length === 0 && vorschlaege.length > 0 && (
              <p className="anordnen-leer">
                {t('zeichendialoge.anordnen.keineOhneKreuzung', {
                  einstellung: `${t('zeichendialoge.anordnen.kreuzungenVermeiden')}: ${t('zeichendialoge.anordnen.kreuzungStark')}`,
                })}
              </p>
            )}
            <div className="anordnen-raster">
              {gezeigt.map((vorschlag, i) => (
                <VariantenKarte
                  key={vorschlag.schluessel}
                  vorschlag={vorschlag}
                  nummer={i + 1}
                  gewaehlt={vorschlag === auswahl}
                  waehlen={() => setGewaehlt(vorschlag.schluessel)}
                  blatt={blatt}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="dialog-aktionen">
          <button
            type="button"
            className="anordnen-zuruecksetzen"
            title={t('zeichendialoge.anordnen.zuruecksetzenTitel')}
            onClick={() => setEinstellungen(settingsStore, { ...STANDARD_ANORDNEN_EINSTELLUNGEN })}
          >
            {t('zeichendialoge.anordnen.zuruecksetzen')}
          </button>
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" disabled={!auswahl} onClick={uebernehmen}>
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Einstellungen({
  einstellungen: e,
  aendere,
  nurVerlegen,
  schaltplan,
  mitZeichenflaeche,
  ohneTrunks,
}: {
  einstellungen: AnordnenEinstellungen
  aendere: (teil: Partial<AnordnenEinstellungen>) => void
  nurVerlegen: boolean
  schaltplan: boolean
  mitZeichenflaeche: boolean
  ohneTrunks: boolean
}) {
  const t = useT()
  const haken = (
    feld:
      | 'lageBeruecksichtigen'
      | 'kinderSeitlich'
      | 'nurRechtwinklig'
      | 'buendeln'
      | 'raster'
      | 'trunksBilden',
    text: Schluessel,
    deaktiviert = false,
  ) => (
    <label className="feld feld-checkbox">
      <input
        type="checkbox"
        checked={deaktiviert ? true : e[feld]}
        disabled={deaktiviert}
        onChange={(ereignis) => aendere({ [feld]: ereignis.target.checked })}
      />
      {t(text)}
    </label>
  )
  return (
    <div className="anordnen-einstellungen">
      {!nurVerlegen && (
        <>
          <label className="feld">
            {t('zeichendialoge.anordnen.richtung')}
            <select
              value={e.richtung}
              onChange={(ereignis) =>
                aendere({ richtung: ereignis.target.value as AnordnenEinstellungen['richtung'] })
              }
            >
              <option value="automatisch">
                {t('zeichendialoge.anordnen.richtungAutomatisch')}
              </option>
              <option value="oben-unten">{t('zeichendialoge.anordnen.richtungObenUnten')}</option>
              <option value="links-rechts">
                {t('zeichendialoge.anordnen.richtungLinksRechts')}
              </option>
            </select>
          </label>
          {haken('lageBeruecksichtigen', 'zeichendialoge.anordnen.lageBeruecksichtigen')}
          {haken('kinderSeitlich', 'zeichendialoge.anordnen.kinderSeitlich')}
          <label className="feld">
            {t('zeichendialoge.anordnen.komponentenAbstand')}
            <ZahlenFeldOptional
              value={e.komponentenAbstandCm}
              min={1}
              step={5}
              placeholder={t('zeichendialoge.anordnen.automatisch')}
              onCommit={(wert) => aendere({ komponentenAbstandCm: wert })}
            />
          </label>
          <label className="feld">
            {t('zeichendialoge.anordnen.reihenAbstand')}
            <ZahlenFeldOptional
              value={e.reihenAbstandCm}
              min={1}
              step={5}
              placeholder={t('zeichendialoge.anordnen.wieKomponenten')}
              onCommit={(wert) => aendere({ reihenAbstandCm: wert })}
            />
          </label>
        </>
      )}
      <label className="feld">
        {t('zeichendialoge.anordnen.bahnabstand')}
        <ZahlenFeldOptional
          value={e.bahnabstandMm}
          min={0.5}
          step={0.5}
          placeholder={t('zeichendialoge.anordnen.vorgabe', {
            wert: schaltplan ? SCHALTPLAN_BAHNABSTAND_MM : BAUPLAN_BAHNABSTAND_MM,
          })}
          onCommit={(wert) => aendere({ bahnabstandMm: wert })}
        />
      </label>
      <label className="feld">
        {t('zeichendialoge.anordnen.kreuzungenVermeiden')}
        <select
          value={e.kreuzungen}
          onChange={(ereignis) =>
            aendere({ kreuzungen: ereignis.target.value as AnordnenEinstellungen['kreuzungen'] })
          }
        >
          <option value="gering">{t('zeichendialoge.anordnen.kreuzungGering')}</option>
          <option value="mittel">{t('zeichendialoge.anordnen.kreuzungMittel')}</option>
          <option value="stark">{t('zeichendialoge.anordnen.kreuzungStark')}</option>
          <option value="immer">{t('zeichendialoge.anordnen.kreuzungImmer')}</option>
        </select>
      </label>
      {haken('nurRechtwinklig', 'zeichendialoge.anordnen.nurRechtwinklig', schaltplan)}
      {!nurVerlegen && (
        <>
          {haken('buendeln', 'zeichendialoge.anordnen.buendeln')}
          {!schaltplan && !ohneTrunks && e.buendeln && (
            <>
              {haken('trunksBilden', 'zeichendialoge.anordnen.trunksBilden')}
              {e.trunksBilden && (
                <div className="anordnen-trunk-grenze">
                  <label className="feld">
                    {t('zeichendialoge.anordnen.abLeitungen')}
                    <ZahlenFeldOptional
                      value={e.trunkMindestLeitungen}
                      min={2}
                      step={1}
                      onCommit={(wert) =>
                        aendere({ trunkMindestLeitungen: Math.max(2, Math.round(wert ?? 5)) })
                      }
                    />
                  </label>
                  <label className="feld">
                    {t('zeichendialoge.anordnen.abLaenge')}
                    <ZahlenFeldOptional
                      value={e.trunkMindestLaengeM}
                      min={0.1}
                      step={0.5}
                      onCommit={(wert) => aendere({ trunkMindestLaengeM: wert ?? 2 })}
                    />
                  </label>
                </div>
              )}
            </>
          )}
          {haken('raster', 'zeichendialoge.anordnen.raster')}
          <label className="feld">
            {t('zeichendialoge.anordnen.lage')}
            <select
              value={mitZeichenflaeche ? e.lage : 'ecke'}
              disabled={!mitZeichenflaeche}
              onChange={(ereignis) =>
                aendere({ lage: ereignis.target.value as AnordnenEinstellungen['lage'] })
              }
            >
              <option value="ecke">{t('zeichendialoge.anordnen.lageEcke')}</option>
              <option value="mitte">{t('zeichendialoge.anordnen.lageMitte')}</option>
            </select>
          </label>
        </>
      )}
    </div>
  )
}

const RICHTUNG_TEXT: Record<'oben-unten' | 'links-rechts', Schluessel> = {
  'oben-unten': 'zeichendialoge.anordnen.kurzObenUnten',
  'links-rechts': 'zeichendialoge.anordnen.kurzLinksRechts',
}

function VariantenKarte({
  vorschlag,
  nummer,
  gewaehlt,
  waehlen,
  blatt,
}: {
  vorschlag: AnordnenVorschlag
  nummer: number
  gewaehlt: boolean
  waehlen: () => void
  blatt: Blatt
}) {
  const { kennzahlen: k, variante } = vorschlag
  const t = useT()
  const laenge = formatiereZahl(k.laenge, { maximumFractionDigits: 1 })
  const merkmale = [
    vorschlag.neueTrunks.length === 1
      ? t('zeichendialoge.anordnen.mitTrunk')
      : vorschlag.neueTrunks.length > 1
        ? t('zeichendialoge.anordnen.mitTrunks', { n: vorschlag.neueTrunks.length })
        : null,
    variante && variante.abstandFaktor < 1 ? t('zeichendialoge.anordnen.eng') : null,
    variante && variante.abstandFaktor > 1 ? t('zeichendialoge.anordnen.weit') : null,
  ].filter((m): m is string => m !== null)
  return (
    <button
      type="button"
      className={`anordnen-karte${gewaehlt ? ' gewaehlt' : ''}`}
      aria-pressed={gewaehlt}
      aria-label={t('zeichendialoge.anordnen.variante', { nr: nummer })}
      onClick={waehlen}
    >
      <VorschauBild vorschlag={vorschlag} blatt={blatt} />
      <span className="anordnen-karte-titel">
        {nummer === 1
          ? t('zeichendialoge.anordnen.varianteEmpfohlen', { nr: nummer })
          : t('zeichendialoge.anordnen.variante', { nr: nummer })}
        {variante ? ` · ${t(RICHTUNG_TEXT[variante.richtung])}` : ''}
      </span>
      {merkmale.length > 0 && (
        <span className="anordnen-karte-merkmale">{merkmale.join(' · ')}</span>
      )}
      <span className="anordnen-karte-zahlen">
        {t('zeichendialoge.anordnen.kreuzungen', { n: k.kreuzungen })} ·{' '}
        {t('zeichendialoge.anordnen.knicke', { n: k.knicke })} · {laenge} m
        {k.fehlgeschlagen > 0
          ? ` · ${t('zeichendialoge.anordnen.ohneWeg', { n: k.fehlgeschlagen })}`
          : ''}
      </span>
    </button>
  )
}

const BILD_BREITE = 240
const BILD_HOEHE = 160

function ausschnittVon(
  objekte: readonly Objekt[],
  vorschlag: AnordnenVorschlag,
): BoundingBox | null {
  const ids = new Set([
    ...vorschlag.positionen.keys(),
    ...vorschlag.verdrahtung.pfadSegmente.keys(),
    ...vorschlag.verdrahtung.wegpunkte.keys(),
  ])
  const boxen = objekte.filter((o) => ids.has(o.id)).map(getBoundingBox)
  if (boxen.length === 0) return null
  const huelle = boxen.reduce(unionBoundingBox)
  const rand = Math.max(huelle.max.x - huelle.min.x, huelle.max.y - huelle.min.y) * 0.06 + 0.1
  return expandBoundingBox(huelle, rand)
}

function VorschauBild({ vorschlag, blatt }: { vorschlag: AnordnenVorschlag; blatt: Blatt }) {
  const { catalogStore, doc } = useAppContext()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const objekte = wendeVorschlagAn([...blatt.objekte], vorschlag)
    const blattNachher: Blatt = { ...blatt, objekte }
    const ausschnitt = ausschnittVon(objekte, vorschlag)
    if (!ausschnitt) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = BILD_BREITE * dpr
    canvas.height = BILD_HOEHE * dpr
    const zeichnung = doc.getZeichnung()
    let laeuft = true
    const zeichne = () => {
      if (!laeuft) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const rahmen = renderKontext(
        blatt,
        objekte,
        zeichnung,
        katalogKomponenten,
        catalogStore,
        () => requestAnimationFrame(zeichne),
      )
      zeichneAnordnenVorschau(ctx, BILD_BREITE, BILD_HOEHE, blattNachher, ausschnitt, rahmen)
    }
    zeichne()
    return () => {
      laeuft = false
    }
  }, [vorschlag, blatt, catalogStore, doc, katalogKomponenten])

  return (
    <canvas
      ref={canvasRef}
      className="anordnen-bild"
      style={{ width: BILD_BREITE, height: BILD_HOEHE }}
    />
  )
}
