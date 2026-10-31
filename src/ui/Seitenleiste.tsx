import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { istKalibrierbar } from '../document-model'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { useUiStore } from './store/ui-store'
import { useSettingsStore } from './store/settings-store'
import { BETA_WERKZEUGE, werkzeugAngeboten } from './leitungsverlegung'
import { BetaEtikett } from './components/BetaEtikett'
import { sucheTrifft } from './seitenleiste-suche'
import { anzeige } from './befehle/kuerzel'
import { werkzeugName } from './werkzeug-namen'
import { useFensterKlein } from './use-fenster-klein'
import {
  IconAbdocken,
  IconAndocken,
  IconSchliessen,
  IconSeitenleiste,
  IconSuche,
  WerkzeugIcon,
} from './components/Icons'
import { useT } from './sprache-anbindung'
import { BEMASSUNG_VARIANTEN, istBemassungVariante } from './bemassung-varianten'
import {
  begrenzeSeitenleistenBreite,
  istListenansicht,
  SEITENLEISTE_BREITE_STANDARD,
} from './seitenleiste-breite'

const TOOLTIP_VERZOEGERUNG_MS = 300

const LANGES_DRUECKEN_MS = 500

export function Seitenleiste() {
  const t = useT()
  const { aktiviereTool, settingsStore } = useAppContext()
  const blatt = useAktivesBlatt()
  const zeichnungsart = useProject().zeichnungsart
  const aktivesToolId = useUiStore((s) => s.aktivesToolId)
  const belegung = useSettingsStore((s) => s.belegung)
  const werkzeugeGeraeteweit = useSettingsStore((s) => s.werkzeugleiste)
  const leitungsverlegung = useSettingsStore((s) => s.leitungsverlegung)
  const werkzeugeAlle = werkzeugeGeraeteweit.filter((id) =>
    werkzeugAngeboten(id, zeichnungsart, leitungsverlegung),
  )
  const [suche, setSuche] = useState('')
  const sucheFeldRef = useRef<HTMLInputElement | null>(null)
  const werkzeuge = werkzeugeAlle.filter((id) => {
    const ids = id === 'bemassung' ? BEMASSUNG_VARIANTEN : [id]
    return sucheTrifft(
      suche,
      ids.flatMap((v) => {
        const eingestellt = belegung[`werkzeug.${v}`]
        return [werkzeugName(v), eingestellt ? anzeige(eingestellt) : undefined]
      }),
    )
  })
  const sichtbar = useSettingsStore((s) => s.seitenleisteSichtbar)
  const angedockt = useSettingsStore((s) => s.seitenleisteAngedockt)
  const toggleSichtbar = useSettingsStore((s) => s.toggleSeitenleisteSichtbar)
  const toggleAngedockt = useSettingsStore((s) => s.toggleSeitenleisteAngedockt)
  const gespeicherteBreite = useSettingsStore((s) => s.seitenleisteBreite)
  const setGespeicherteBreite = useSettingsStore((s) => s.setSeitenleisteBreite)
  const [ziehBreite, setZiehBreite] = useState<number | null>(null)
  const kantenZugRef = useRef<{ startX: number; startBreite: number } | null>(null)
  const position = useUiStore((s) => s.seitenleisteSchwebePosition)
  const setPosition = useUiStore((s) => s.setSeitenleisteSchwebePosition)
  const groesse = useUiStore((s) => s.seitenleisteSchwebeGroesse)
  const setGroesse = useUiStore((s) => s.setSeitenleisteSchwebeGroesse)
  const fensterKlein = useFensterKlein()
  const [schwebtBeimUeberfahren, setSchwebtBeimUeberfahren] = useState(false)
  const [tooltip, setTooltip] = useState<{
    text: string
    beta: boolean
    x: number
    y: number
  } | null>(null)
  const tooltipTimerRef = useRef<number | null>(null)
  const bemassungVariante = useSettingsStore((s) => s.bemassungVariante)
  const [variantenMenue, setVariantenMenue] = useState<{ x: number; y: number } | null>(null)
  const variantenMenueRef = useRef<HTMLDivElement | null>(null)
  const langesDrueckenTimerRef = useRef<number | null>(null)
  const langesDrueckenAusgeloestRef = useRef(false)
  const versteckt = !sichtbar || (angedockt && fensterKlein)
  const angedockteBreite = ziehBreite ?? gespeicherteBreite
  const wirksameBreite =
    angedockt || versteckt ? angedockteBreite : (groesse?.breite ?? SEITENLEISTE_BREITE_STANDARD)
  const alsListe = istListenansicht(wirksameBreite)

  const [vorherVersteckt, setVorherVersteckt] = useState(versteckt)
  if (versteckt !== vorherVersteckt) {
    setVorherVersteckt(versteckt)
    if (!versteckt) setSchwebtBeimUeberfahren(false)
  }

  const panelRef = useRef<HTMLDivElement | null>(null)
  const zugRef = useRef<{
    startX: number
    startY: number
    startPos: { x: number; y: number }
  } | null>(null)
  const groessenZugRef = useRef<{
    startX: number
    startY: number
    startBreite: number
    startHoehe: number
  } | null>(null)

  function tooltipVerbergen() {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = null
    }
    setTooltip(null)
  }

  useEffect(
    () => () => {
      if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current)
      if (langesDrueckenTimerRef.current !== null) {
        window.clearTimeout(langesDrueckenTimerRef.current)
      }
    },
    [],
  )

  useLayoutEffect(() => {
    const menue = variantenMenueRef.current
    if (!variantenMenue || !menue) return
    const rand = 8
    const hoechstens = Math.max(rand, window.innerHeight - menue.offsetHeight - rand)
    menue.style.top = `${Math.min(variantenMenue.y, hoechstens)}px`
  }, [variantenMenue])

  useEffect(() => {
    if (!variantenMenue) return
    function beiKlick(e: PointerEvent) {
      const ziel = e.target as HTMLElement
      if (variantenMenueRef.current?.contains(ziel)) return
      if (ziel.closest('.werkzeug-varianten-pfeil')) return
      setVariantenMenue(null)
    }
    function beiTaste(e: KeyboardEvent) {
      if (e.key === 'Escape') setVariantenMenue(null)
    }
    window.addEventListener('pointerdown', beiKlick)
    window.addEventListener('keydown', beiTaste)
    return () => {
      window.removeEventListener('pointerdown', beiKlick)
      window.removeEventListener('keydown', beiTaste)
    }
  }, [variantenMenue])

  function werkzeugButton(listenId: string) {
    const varianten = listenId === 'bemassung'
    const id = varianten ? bemassungVariante : listenId
    const label = werkzeugName(id)
    const eingestellt = belegung[`werkzeug.${id}`]
    const kuerzel = eingestellt ? anzeige(eingestellt) : undefined
    const deaktiviert =
      (id === 'kalibrieren' && !istKalibrierbar(blatt.hintergrund)) ||
      (id === 'hintergrund-ausblenden' && !blatt.hintergrund)
    const aktiv = varianten ? istBemassungVariante(aktivesToolId) : aktivesToolId === id
    const button = (
      <button
        key={listenId}
        type="button"
        className={`werkzeug-button ${alsListe ? 'werkzeug-listen-button' : 'werkzeug-icon-button'}${aktiv ? ' aktiv' : ''}`}
        aria-label={label}
        aria-pressed={aktiv}
        aria-keyshortcuts={kuerzel}
        disabled={deaktiviert}
        onClick={() => {
          tooltipVerbergen()
          if (langesDrueckenAusgeloestRef.current) {
            langesDrueckenAusgeloestRef.current = false
            return
          }
          aktiviereTool(id)
        }}
        onContextMenu={
          varianten
            ? (e) => {
                e.preventDefault()
                tooltipVerbergen()
                variantenMenueOeffnen(e.currentTarget)
              }
            : undefined
        }
        onPointerDown={
          varianten
            ? (e) => {
                langesDrueckenAusgeloestRef.current = false
                if (e.pointerType === 'mouse') return
                const element = e.currentTarget
                langesDrueckenTimerRef.current = window.setTimeout(() => {
                  langesDrueckenTimerRef.current = null
                  langesDrueckenAusgeloestRef.current = true
                  variantenMenueOeffnen(element)
                }, LANGES_DRUECKEN_MS)
              }
            : undefined
        }
        onPointerUp={varianten ? langesDrueckenAbbrechen : undefined}
        onPointerCancel={varianten ? langesDrueckenAbbrechen : undefined}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse' || alsListe) return
          const rechteck = e.currentTarget.getBoundingClientRect()
          const text = kuerzel ? `${label} · ${kuerzel}` : label
          if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current)
          tooltipTimerRef.current = window.setTimeout(() => {
            tooltipTimerRef.current = null
            setTooltip({
              text,
              beta: BETA_WERKZEUGE.has(id),
              x: rechteck.right + 8,
              y: rechteck.top + rechteck.height / 2,
            })
          }, TOOLTIP_VERZOEGERUNG_MS)
        }}
        onPointerLeave={() => {
          tooltipVerbergen()
          if (varianten) langesDrueckenAbbrechen()
        }}
      >
        <WerkzeugIcon id={id} />
        {alsListe && (
          <>
            <span className="werkzeug-listen-kuerzel">{kuerzel}</span>
            <span className="werkzeug-listen-name">{label}</span>
          </>
        )}
      </button>
    )
    if (!varianten) return button
    return (
      <div key={listenId} className="werkzeug-varianten">
        {button}
        <button
          type="button"
          className="werkzeug-varianten-pfeil"
          aria-label={t('seitenleiste.bemassungsart')}
          aria-haspopup="menu"
          aria-expanded={variantenMenue !== null}
          onClick={(e) => {
            tooltipVerbergen()
            if (variantenMenue) setVariantenMenue(null)
            else variantenMenueOeffnen(e.currentTarget.parentElement ?? e.currentTarget)
          }}
        />
      </div>
    )
  }

  function langesDrueckenAbbrechen() {
    if (langesDrueckenTimerRef.current === null) return
    window.clearTimeout(langesDrueckenTimerRef.current)
    langesDrueckenTimerRef.current = null
  }

  function variantenMenueOeffnen(element: HTMLElement) {
    const rechteck = element.getBoundingClientRect()
    setVariantenMenue({ x: rechteck.right + 6, y: rechteck.top })
  }

  function variantenMenueInhalt() {
    if (!variantenMenue) return null
    return createPortal(
      <div
        ref={variantenMenueRef}
        className="werkzeug-varianten-menue"
        role="menu"
        style={{ left: variantenMenue.x, top: variantenMenue.y }}
      >
        {BEMASSUNG_VARIANTEN.map((variante) => {
          const eingestellt = belegung[`werkzeug.${variante}`]
          return (
            <button
              key={variante}
              type="button"
              role="menuitemradio"
              aria-checked={variante === bemassungVariante}
              className={`menu-eintrag${variante === aktivesToolId ? ' aktiv' : ''}`}
              onClick={() => {
                setVariantenMenue(null)
                aktiviereTool(variante)
              }}
            >
              <span className="menu-eintrag-icon">
                <WerkzeugIcon id={variante} />
              </span>
              <span className="menu-eintrag-text">{werkzeugName(variante)}</span>
              {eingestellt && <span className="menu-eintrag-kuerzel">{anzeige(eingestellt)}</span>}
            </button>
          )
        })}
      </div>,
      document.body,
    )
  }

  function aufKopfPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (angedockt) return
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    zugRef.current = { startX: e.clientX, startY: e.clientY, startPos: position }
  }

  function aufKopfPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const zug = zugRef.current
    const panel = panelRef.current
    if (!zug || !panel) return
    const rahmen = (panel.offsetParent as HTMLElement | null)?.getBoundingClientRect()
    const maxX = Math.max(0, (rahmen?.width ?? window.innerWidth) - panel.offsetWidth)
    const maxY = Math.max(0, (rahmen?.height ?? window.innerHeight) - panel.offsetHeight)
    setPosition({
      x: Math.min(Math.max(0, zug.startPos.x + (e.clientX - zug.startX)), maxX),
      y: Math.min(Math.max(0, zug.startPos.y + (e.clientY - zug.startY)), maxY),
    })
  }

  function aufKopfPointerUp() {
    zugRef.current = null
  }

  const MIN_BREITE = 80
  const MIN_HOEHE = 160

  function aufGroesseGriffPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const panel = panelRef.current
    groessenZugRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startBreite: groesse?.breite ?? panel?.offsetWidth ?? 112,
      startHoehe: groesse?.hoehe ?? panel?.offsetHeight ?? 320,
    }
  }

  function aufGroesseGriffPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const zug = groessenZugRef.current
    const panel = panelRef.current
    if (!zug || !panel) return
    const rahmen = (panel.offsetParent as HTMLElement | null)?.getBoundingClientRect()
    const maxBreite = Math.max(MIN_BREITE, (rahmen?.width ?? window.innerWidth) - position.x)
    const maxHoehe = Math.max(MIN_HOEHE, (rahmen?.height ?? window.innerHeight) - position.y)
    setGroesse({
      breite: Math.min(Math.max(MIN_BREITE, zug.startBreite + (e.clientX - zug.startX)), maxBreite),
      hoehe: Math.min(Math.max(MIN_HOEHE, zug.startHoehe + (e.clientY - zug.startY)), maxHoehe),
    })
  }

  function aufGroesseGriffPointerUp() {
    groessenZugRef.current = null
  }

  function aufKantePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    kantenZugRef.current = { startX: e.clientX, startBreite: gespeicherteBreite }
    setZiehBreite(gespeicherteBreite)
  }

  function aufKantePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const zug = kantenZugRef.current
    if (!zug) return
    setZiehBreite(begrenzeSeitenleistenBreite(zug.startBreite + (e.clientX - zug.startX)))
  }

  function aufKantePointerUp() {
    if (!kantenZugRef.current) return
    kantenZugRef.current = null
    if (ziehBreite !== null && ziehBreite !== gespeicherteBreite) {
      setGespeicherteBreite(settingsStore, ziehBreite)
    }
    setZiehBreite(null)
  }

  function kopfAktionen() {
    return (
      <div className="seitenleiste-kopf-aktionen">
        <button
          type="button"
          className="werkzeug-button nur-icon"
          onClick={() => toggleAngedockt(settingsStore)}
          title={angedockt ? t('seitenleiste.abdocken') : t('seitenleiste.andocken')}
          aria-label={angedockt ? t('seitenleiste.abdocken') : t('seitenleiste.andocken')}
        >
          {angedockt ? <IconAbdocken /> : <IconAndocken />}
        </button>
        <button
          type="button"
          className="werkzeug-button nur-icon"
          onClick={() => toggleSichtbar(settingsStore)}
          title={sichtbar ? t('seitenleiste.ausblenden') : t('seitenleiste.einblenden')}
          aria-label={sichtbar ? t('seitenleiste.ausblenden') : t('seitenleiste.einblenden')}
        >
          <IconSeitenleiste />
        </button>
      </div>
    )
  }

  function suchfeld() {
    return (
      <div className="seitenleiste-suche">
        <IconSuche />
        <input
          ref={sucheFeldRef}
          type="text"
          role="searchbox"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('seitenleiste.suchePlatzhalter')}
          aria-label={t('seitenleiste.suche')}
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              if (suche) setSuche('')
              else e.currentTarget.blur()
            } else if (e.key === 'Enter' && suche.trim() && werkzeuge[0]) {
              e.preventDefault()
              const id = werkzeuge[0]
              aktiviereTool(id === 'bemassung' ? bemassungVariante : id)
              e.currentTarget.blur()
            }
          }}
        />
        {suche && (
          <button
            type="button"
            className="seitenleiste-suche-loeschen"
            aria-label={t('seitenleiste.sucheLoeschen')}
            title={t('seitenleiste.sucheLoeschen')}
            onClick={() => {
              setSuche('')
              sucheFeldRef.current?.focus()
            }}
          >
            <IconSchliessen />
          </button>
        )}
      </div>
    )
  }

  function werkzeugListe() {
    return (
      <div
        className={`seitenleiste-liste${alsListe ? ' als-liste' : ''}`}
        role="toolbar"
        aria-label={t('seitenleiste.werkzeugleiste')}
        aria-orientation="vertical"
      >
        {werkzeuge.map(werkzeugButton)}
        {werkzeuge.length === 0 && (
          <p className="seitenleiste-suche-leer">{t('seitenleiste.sucheKeineTreffer')}</p>
        )}
        {variantenMenueInhalt()}
        {tooltip &&
          createPortal(
            <div
              className="werkzeug-tooltip"
              role="tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
              {tooltip.beta && <BetaEtikett />}
            </div>,
            document.body,
          )}
      </div>
    )
  }

  if (versteckt) {
    return (
      <div
        className="seitenleiste-rand-zone"
        onMouseEnter={() => setSchwebtBeimUeberfahren(true)}
        onMouseLeave={() => setSchwebtBeimUeberfahren(false)}
      >
        <button
          type="button"
          className="seitenleiste-griff"
          onClick={() => toggleSichtbar(settingsStore)}
          title={sichtbar ? t('seitenleiste.ausblenden') : t('seitenleiste.einblenden')}
          aria-label={sichtbar ? t('seitenleiste.ausblenden') : t('seitenleiste.einblenden')}
        >
          <IconSeitenleiste />
        </button>
        {schwebtBeimUeberfahren && (
          <div
            className="seitenleiste seitenleiste-schwebend seitenleiste-vorschau"
            style={{ width: angedockteBreite }}
          >
            <div className="seitenleiste-kopf">{kopfAktionen()}</div>
            {suchfeld()}
            {werkzeugListe()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`seitenleiste${angedockt ? '' : ' seitenleiste-schwebend'}`}
      style={
        angedockt
          ? { flexBasis: angedockteBreite }
          : {
              top: position.y,
              left: position.x,
              ...(groesse ? { width: groesse.breite, height: groesse.hoehe } : {}),
            }
      }
      ref={panelRef}
    >
      <div
        className="seitenleiste-kopf"
        onPointerDown={aufKopfPointerDown}
        onPointerMove={aufKopfPointerMove}
        onPointerUp={aufKopfPointerUp}
      >
        {kopfAktionen()}
      </div>
      {suchfeld()}
      {werkzeugListe()}
      {angedockt && (
        <div
          className={`seitenleiste-kante${ziehBreite !== null ? ' zieht' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label={t('seitenleiste.breite')}
          aria-valuenow={angedockteBreite}
          title={t('seitenleiste.breiteTitel')}
          onPointerDown={aufKantePointerDown}
          onPointerMove={aufKantePointerMove}
          onPointerUp={aufKantePointerUp}
          onPointerCancel={aufKantePointerUp}
          onDoubleClick={() => setGespeicherteBreite(settingsStore, SEITENLEISTE_BREITE_STANDARD)}
        />
      )}
      {!angedockt && (
        <div
          className="seitenleiste-groesse-griff"
          onPointerDown={aufGroesseGriffPointerDown}
          onPointerMove={aufGroesseGriffPointerMove}
          onPointerUp={aufGroesseGriffPointerUp}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
