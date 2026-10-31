import { useEffect, useMemo, useRef, useState } from 'react'
import {
  baueSzene,
  eingabeAusRichtungen,
  FARBSCHEMA_NAMEN,
  istSzeneLeer,
  KEINE_BEWEGUNG,
  type BegehenRichtung,
  type Farbschema,
  type SzenenInfo,
} from '../../dreid'
import {
  ladeDreidDeckkraft,
  ladeDreidKamera,
  ladeDreidSymbolgroesse,
  speichereDreidDeckkraft,
  speichereDreidKamera,
  speichereDreidSymbolgroesse,
} from '../../persistence'
import {
  erzeugeDreidViewer,
  STANDARD_DREID_DECKKRAFT,
  STANDARD_DREID_SYMBOLGROESSE,
  type DreidDeckkraft,
  type DreidModus,
  type DreidViewer,
} from '../../rendering'
import { useFreigeschalteteModule } from '../lizenz-module'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { istEingabeFeldFokussiert } from '../tastatur-fokus'
import { useAppContext, useProject } from '../use-app-context'
import type { Schluessel } from '../../sprache'
import { useLeitungsverlegungAus } from '../leitungsverlegung'
import { useT } from '../sprache-anbindung'

const KLICK_TOLERANZ_PX = 4

const DECKKRAFT_REGLER: { feld: keyof DreidDeckkraft; text: Schluessel }[] = [
  { feld: 'vorne', text: 'zeichendialoge.dreid.vordereWaende' },
  { feld: 'hinten', text: 'zeichendialoge.dreid.hintereWaende' },
  { feld: 'decken', text: 'zeichendialoge.dreid.decken' },
]

const BEGEHEN_TASTEN: Record<string, BegehenRichtung> = {
  KeyW: 'vor',
  ArrowUp: 'vor',
  KeyS: 'zurueck',
  ArrowDown: 'zurueck',
  KeyA: 'links',
  ArrowLeft: 'links',
  KeyD: 'rechts',
  ArrowRight: 'rechts',
  KeyE: 'hoch',
  PageUp: 'hoch',
  KeyQ: 'runter',
  PageDown: 'runter',
}

const STEUERKREUZ: { richtung: BegehenRichtung; zeichen: string; titel: Schluessel }[] = [
  { richtung: 'vor', zeichen: '▲', titel: 'zeichendialoge.dreid.vor' },
  { richtung: 'links', zeichen: '◀', titel: 'zeichendialoge.dreid.links' },
  { richtung: 'rechts', zeichen: '▶', titel: 'zeichendialoge.dreid.rechts' },
  { richtung: 'zurueck', zeichen: '▼', titel: 'zeichendialoge.dreid.zurueck' },
]
const HOEHENKNOEPFE: typeof STEUERKREUZ = [
  { richtung: 'hoch', zeichen: '⤒', titel: 'zeichendialoge.dreid.hoch' },
  { richtung: 'runter', zeichen: '⤓', titel: 'zeichendialoge.dreid.runter' },
]

export function DreidDialog() {
  const offen = useUiStore((s) => s.dreidDialogOffen)
  if (!offen) return null
  return <DreidDialogInhalt />
}

function DreidDialogInhalt() {
  const zeichnung = useProject()
  const { leseIfcHuelle } = useAppContext()
  const t = useT()
  const [huelleBlaetter, setHuelleBlaetter] = useState<ReadonlySet<string>>(() => new Set())
  const [huelle, setHuelle] = useState<
    | { art: 'laedt'; erledigt: number; gesamt: number }
    | { art: 'fertig' }
    | { art: 'fehler'; meldung: string }
    | null
  >(null)
  const katalog = useKatalogStore((s) => s.komponenten)
  const module = useFreigeschalteteModule()
  const [farbschema, setFarbschema] = useState<Farbschema>('plan')
  const leitungsverlegungAus = useLeitungsverlegungAus()
  const szene = useMemo(
    () =>
      baueSzene({ zeichnung, katalog, module, farbschema, huelleBlaetter, leitungsverlegungAus }),
    [zeichnung, katalog, module, farbschema, huelleBlaetter, leitungsverlegungAus],
  )
  const [sichtbar, setSichtbar] = useState<Set<string>>(
    () => new Set(szene.geschosse.map((g) => g.blattId)),
  )
  const [info, setInfo] = useState<SzenenInfo | null>(null)
  const [deckkraft, setDeckkraft] = useState<DreidDeckkraft>(
    () => ladeDreidDeckkraft() ?? STANDARD_DREID_DECKKRAFT,
  )
  const deckkraftRef = useRef(deckkraft)
  const [symbolgroesse, setSymbolgroesse] = useState(
    () => ladeDreidSymbolgroesse() ?? STANDARD_DREID_SYMBOLGROESSE,
  )
  const symbolgroesseRef = useRef(symbolgroesse)
  const [zustand, setZustand] = useState<'laedt' | 'bereit' | 'fehler'>('laedt')
  const [modus, setModus] = useState<DreidModus>(
    () => ladeDreidKamera(zeichnung.id)?.modus ?? 'umkreisen',
  )
  const modusRef = useRef(modus)
  modusRef.current = modus
  const gehaltenRef = useRef(new Map<string, BegehenRichtung>())
  const schnellRef = useRef(false)

  const flaecheRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<DreidViewer | null>(null)
  const druckRef = useRef<{ x: number; y: number } | null>(null)
  const ersteSzeneRef = useRef(true)
  const ohneGemerkteKameraRef = useRef(false)

  function schliessen() {
    const viewer = viewerRef.current
    if (viewer) speichereDreidKamera(zeichnung.id, viewer.kamera())
    useUiStore.getState().setDreidDialogOffen(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const flaeche = flaecheRef.current
    if (!canvas || !flaeche) return
    let abgebrochen = false
    let beobachter: ResizeObserver | null = null
    erzeugeDreidViewer(canvas)
      .then((viewer) => {
        if (abgebrochen) {
          viewer.freigeben()
          return
        }
        viewerRef.current = viewer
        viewer.setzeDeckkraft(deckkraftRef.current)
        viewer.setzeSymbolgroesse(symbolgroesseRef.current)
        const anpassen = () => viewer.groesseAnpassen(flaeche.clientWidth, flaeche.clientHeight)
        anpassen()
        beobachter = new ResizeObserver(anpassen)
        beobachter.observe(flaeche)
        setZustand('bereit')
      })
      .catch(() => {
        if (!abgebrochen) setZustand('fehler')
      })
    return () => {
      abgebrochen = true
      beobachter?.disconnect()
      viewerRef.current?.freigeben()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (zustand !== 'bereit' || !viewer) return
    const kamera = ersteSzeneRef.current ? ladeDreidKamera(zeichnung.id) : viewer.kamera()
    if (ersteSzeneRef.current) ohneGemerkteKameraRef.current = kamera === null
    ersteSzeneRef.current = false
    viewer.zeigeSzene(szene, kamera)
    viewer.setzeSichtbareGeschosse(sichtbar)
  }, [zustand, szene, zeichnung.id])

  useEffect(() => {
    const viewer = viewerRef.current
    if (zustand !== 'bereit' || !viewer) return
    const ifcBlaetter = szene.geschosse
      .filter((g) => zeichnung.blaetter.find((b) => b.id === g.blattId)?.hintergrund?.typ === 'ifc')
      .map((g) => ({ blattId: g.blattId, kote: g.kote }))
    if (ifcBlaetter.length === 0) return
    let aktiv = true
    const lauf = leseIfcHuelle(ifcBlaetter, viewer.ursprung(), (erledigt, gesamt) => {
      if (aktiv) setHuelle({ art: 'laedt', erledigt, gesamt })
    })
    lauf.ergebnis
      .then((netze) => {
        if (!aktiv) return
        for (const [blattId, netz] of netze) viewer.zeigeHuelle(blattId, netz)
        if (ohneGemerkteKameraRef.current && netze.size > 0 && modusRef.current === 'umkreisen')
          viewer.einpassen()
        setHuelleBlaetter(new Set(netze.keys()))
        setHuelle({ art: 'fertig' })
      })
      .catch((fehler: unknown) => {
        if (aktiv)
          setHuelle({
            art: 'fehler',
            meldung:
              fehler instanceof Error
                ? fehler.message
                : t('zeichendialoge.dreid.unbekannterFehler'),
          })
      })
    return () => {
      aktiv = false
      lauf.abbrechen()
    }
  }, [zustand])

  function bewegungMelden() {
    viewerRef.current?.setzeBewegung(
      eingabeAusRichtungen(gehaltenRef.current.values()),
      schnellRef.current,
    )
  }

  function halten(quelle: string, richtung: BegehenRichtung, schnell: boolean) {
    gehaltenRef.current.set(quelle, richtung)
    schnellRef.current = schnell
    bewegungMelden()
  }

  function loslassen(quelle: string) {
    gehaltenRef.current.delete(quelle)
    bewegungMelden()
  }

  function modusSetzen(neu: DreidModus) {
    gehaltenRef.current.clear()
    viewerRef.current?.setzeModus(neu)
    setModus(neu)
  }

  useEffect(() => {
    if (modus !== 'begehen') return
    const gehalten = gehaltenRef.current
    const tastenLoesen = () => {
      for (const quelle of [...gehalten.keys()])
        if (quelle.startsWith('taste:')) gehalten.delete(quelle)
    }
    function beiTaste(e: KeyboardEvent) {
      schnellRef.current = e.shiftKey
      if (e.key === 'Meta') tastenLoesen()
      const richtung = BEGEHEN_TASTEN[e.code]
      if (richtung && !e.ctrlKey && !e.metaKey && !e.altKey && !istEingabeFeldFokussiert()) {
        e.preventDefault()
        gehalten.set(`taste:${e.code}`, richtung)
      }
      bewegungMelden()
    }
    function beiTasteHoch(e: KeyboardEvent) {
      schnellRef.current = e.shiftKey
      gehalten.delete(`taste:${e.code}`)
      bewegungMelden()
    }
    function beiBlur() {
      gehalten.clear()
      bewegungMelden()
    }
    window.addEventListener('keydown', beiTaste, true)
    window.addEventListener('keyup', beiTasteHoch, true)
    window.addEventListener('blur', beiBlur)
    return () => {
      window.removeEventListener('keydown', beiTaste, true)
      window.removeEventListener('keyup', beiTasteHoch, true)
      window.removeEventListener('blur', beiBlur)
      gehalten.clear()
      viewerRef.current?.setzeBewegung(KEINE_BEWEGUNG, false)
    }
  }, [modus])

  function deckkraftSetzen(feld: keyof DreidDeckkraft, wert: number) {
    const neu = { ...deckkraft, [feld]: wert }
    deckkraftRef.current = neu
    setDeckkraft(neu)
    viewerRef.current?.setzeDeckkraft(neu)
    speichereDreidDeckkraft(neu)
  }

  function symbolgroesseSetzen(anteil: number) {
    symbolgroesseRef.current = anteil
    setSymbolgroesse(anteil)
    viewerRef.current?.setzeSymbolgroesse(anteil)
    speichereDreidSymbolgroesse(anteil)
  }

  function geschossUmschalten(blattId: string) {
    const neu = new Set(sichtbar)
    if (neu.has(blattId)) neu.delete(blattId)
    else neu.add(blattId)
    setSichtbar(neu)
    viewerRef.current?.setzeSichtbareGeschosse(neu)
  }

  const leer = istSzeneLeer(szene)
  const ifcAnzahl = szene.geschosse.filter(
    (g) => zeichnung.blaetter.find((b) => b.id === g.blattId)?.hintergrund?.typ === 'ifc',
  ).length
  const huellenStand =
    huelle ??
    (zustand === 'bereit' && ifcAnzahl > 0
      ? { art: 'laedt' as const, erledigt: 0, gesamt: ifcAnzahl }
      : null)

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-dreid"
        role="dialog"
        aria-label={t('zeichendialoge.dreid.titel')}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') schliessen()
        }}
      >
        <div className="dreid-kopf">
          <h2>{t('zeichendialoge.dreid.titel')}</h2>
          <div className="dreid-modus" role="group" aria-label={t('zeichendialoge.dreid.bewegung')}>
            {(['umkreisen', 'begehen'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={modus === m ? 'aktiv' : undefined}
                aria-pressed={modus === m}
                disabled={zustand !== 'bereit'}
                onClick={() => modusSetzen(m)}
              >
                {m === 'umkreisen'
                  ? t('zeichendialoge.dreid.umkreisen')
                  : t('zeichendialoge.dreid.begehen')}
              </button>
            ))}
          </div>
          <label className="dreid-farbschema">
            {t('zeichendialoge.dreid.farben')}
            <select
              value={farbschema}
              onChange={(e) => setFarbschema(e.target.value as Farbschema)}
            >
              {(Object.keys(FARBSCHEMA_NAMEN) as Farbschema[]).map((f) => (
                <option key={f} value={f}>
                  {FARBSCHEMA_NAMEN[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="dreid-inhalt">
          <div className="dreid-seite">
            <h3>{t('zeichendialoge.dreid.geschosse')}</h3>
            {szene.geschosse.map((g) => (
              <label key={g.blattId} className="dialog-feld-checkbox">
                <input
                  type="checkbox"
                  checked={sichtbar.has(g.blattId)}
                  onChange={() => geschossUmschalten(g.blattId)}
                />
                {g.name}
              </label>
            ))}
            <h3>{t('zeichendialoge.dreid.symbole')}</h3>
            <label className="dreid-regler">
              <span>
                {t('zeichendialoge.dreid.symbolgroesse')}{' '}
                <span className="dreid-regler-wert">{Math.round(symbolgroesse * 100)} %</span>
              </span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={Math.round(symbolgroesse * 100)}
                onChange={(e) => symbolgroesseSetzen(Number(e.target.value) / 100)}
              />
            </label>
            <h3>{t('zeichendialoge.dreid.gebaeude')}</h3>
            {DECKKRAFT_REGLER.map(({ feld, text }) => (
              <label key={feld} className="dreid-regler">
                <span>
                  {t(text)}{' '}
                  <span className="dreid-regler-wert">{Math.round(deckkraft[feld] * 100)} %</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(deckkraft[feld] * 100)}
                  onChange={(e) => deckkraftSetzen(feld, Number(e.target.value) / 100)}
                />
              </label>
            ))}
            {szene.legende.length > 0 && (
              <>
                <h3>{t('zeichendialoge.dreid.legende')}</h3>
                <ul className="dreid-legende">
                  {szene.legende.map((e) => (
                    <li key={e.farbe + e.text}>
                      <span className="dreid-farbfeld" style={{ background: e.farbe }} />
                      {e.text}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {huellenStand && huellenStand.art !== 'fertig' && (
              <p className="dialog-hinweis dreid-huelle">
                {huellenStand.art === 'laedt'
                  ? t('zeichendialoge.dreid.huelleLaedt', {
                      erledigt: huellenStand.erledigt,
                      gesamt: huellenStand.gesamt,
                    })
                  : t('zeichendialoge.dreid.huelleFehler', { meldung: huellenStand.meldung })}
              </p>
            )}
            <div className="dreid-info" aria-live="polite">
              {info ? (
                <>
                  <strong>{info.titel}</strong>
                  {info.zeilen.map((z) => (
                    <div key={z}>{z}</div>
                  ))}
                </>
              ) : (
                <span className="dialog-hinweis">{t('zeichendialoge.dreid.klickHinweis')}</span>
              )}
            </div>
          </div>

          <div className="dreid-flaeche" ref={flaecheRef}>
            <canvas
              ref={canvasRef}
              className="dreid-canvas"
              onPointerDown={(e) => {
                druckRef.current = { x: e.clientX, y: e.clientY }
              }}
              onPointerUp={(e) => {
                const druck = druckRef.current
                druckRef.current = null
                const viewer = viewerRef.current
                if (!druck || !viewer) return
                if (Math.hypot(e.clientX - druck.x, e.clientY - druck.y) > KLICK_TOLERANZ_PX) return
                const rechteck = e.currentTarget.getBoundingClientRect()
                setInfo(viewer.treffer(e.clientX - rechteck.left, e.clientY - rechteck.top))
              }}
            />
            {zustand === 'bereit' && modus === 'begehen' && (
              <>
                <div className="dreid-begehen-hinweis">
                  {t('zeichendialoge.dreid.begehenHinweis')}
                </div>
                <div className="dreid-steuerkreuz">
                  {STEUERKREUZ.map((k) => (
                    <SteuerKnopf key={k.richtung} {...k} halten={halten} loslassen={loslassen} />
                  ))}
                </div>
                <div className="dreid-steuer-hoehe">
                  {HOEHENKNOEPFE.map((k) => (
                    <SteuerKnopf key={k.richtung} {...k} halten={halten} loslassen={loslassen} />
                  ))}
                </div>
              </>
            )}
            {zustand === 'laedt' && (
              <div className="dreid-meldung">{t('zeichendialoge.dreid.laedt')}</div>
            )}
            {zustand === 'fehler' && (
              <div className="dreid-meldung">{t('zeichendialoge.dreid.keinWebgl')}</div>
            )}
            {zustand === 'bereit' && leer && (
              <div className="dreid-meldung">{t('zeichendialoge.dreid.leer')}</div>
            )}
          </div>
        </div>

        <div className="dialog-aktionen">
          <button
            type="button"
            disabled={zustand !== 'bereit'}
            onClick={() => {
              gehaltenRef.current.clear()
              viewerRef.current?.einpassen()
              setModus('umkreisen')
            }}
          >
            {t('zeichendialoge.dreid.einpassen')}
          </button>
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function SteuerKnopf({
  richtung,
  zeichen,
  titel,
  halten,
  loslassen,
}: {
  richtung: BegehenRichtung
  zeichen: string
  titel: Schluessel
  halten: (quelle: string, richtung: BegehenRichtung, schnell: boolean) => void
  loslassen: (quelle: string) => void
}) {
  const t = useT()
  const quelle = `knopf:${richtung}`
  return (
    <button
      type="button"
      className={`dreid-steuer-knopf dreid-steuer-${richtung}`}
      title={t(titel)}
      aria-label={t(titel)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        halten(quelle, richtung, e.shiftKey)
      }}
      onPointerUp={() => loslassen(quelle)}
      onPointerCancel={() => loslassen(quelle)}
      onLostPointerCapture={() => loslassen(quelle)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {zeichen}
    </button>
  )
}
