import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { KontextAktion } from '../tools'
import { useAppContext, useProject } from './use-app-context'
import {
  ermittleAuswahlAktionen,
  ermittleTeilstueckAktionen,
  type KontextMenuEintrag,
} from './kontextmenu-eintraege'
import { KontextMenuListe } from './components/KontextMenuListe'
import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'
import { werkzeugName } from './werkzeug-namen'
import { useT } from './sprache-anbindung'

const RAND = 8
const AUFLEUCHTEN_MS = 700

type Versatz = { x: number; y: number }

export function Kontextleiste() {
  const t = useT()
  const umgebung = useAppContext()
  const { settingsStore } = umgebung
  const aktionen = useUiStore((s) => s.kontextAktionen)
  const aktivesToolId = useUiStore((s) => s.aktivesToolId)
  const auswahlIds = useUiStore((s) => s.auswahlIds)
  useProject()
  const teilstuecke = useUiStore((s) => s.teilstueckAuswahl)
  const auswahlAktionen =
    aktivesToolId === 'auswahl'
      ? ermittleAuswahlAktionen(auswahlIds, umgebung)
      : aktivesToolId === 'teilstueck-zone'
        ? ermittleTeilstueckAktionen(teilstuecke, umgebung)
        : []
  const touch = useUiStore((s) => s.touchBedienung)
  const statusText = useUiStore((s) => s.statusText)
  const escWirkt = useUiStore((s) => s.aktivesToolId !== 'auswahl' || s.auswahlIds.length > 0)
  const eingeschaltet = useSettingsStore((s) => s.kontextleisteSichtbar)
  const gespeicherterVersatz = useSettingsStore((s) => s.kontextleisteVersatz)
  const setVersatz = useSettingsStore((s) => s.setKontextleisteVersatz)

  const leisteRef = useRef<HTMLDivElement | null>(null)
  const [ziehVersatz, setZiehVersatz] = useState<Versatz | null>(null)
  const ziehStartRef = useRef<{ zeiger: Versatz; versatz: Versatz } | null>(null)
  const [lage, setLage] = useState({ korrekturX: 0, korrekturY: 0, anhebung: 0 })
  const neu = useAufleuchten(aktionen, aktivesToolId)

  const sichtbar =
    (eingeschaltet || touch) &&
    (aktionen.length > 0 || auswahlAktionen.length > 0 || (touch && escWirkt))
  const versatz = ziehVersatz ?? gespeicherterVersatz ?? { x: 0, y: 0 }

  useLayoutEffect(() => {
    const leiste = leisteRef.current
    const flaeche = leiste?.parentElement
    if (!leiste || !flaeche) return
    function messen() {
      if (!leiste || !flaeche) return
      const f = flaeche.getBoundingClientRect()
      const b = leiste.offsetWidth
      const h = leiste.offsetHeight
      const links = f.width / 2 - b / 2 + versatz.x
      let anhebung = 0
      if (!gespeicherterVersatz && !ziehVersatz) {
        const hinweis = flaeche.querySelector<HTMLElement>('.canvas-statusleiste')
        const r = hinweis?.getBoundingClientRect()
        if (r && r.width > 0 && r.right - f.left + RAND > links) anhebung = r.height + RAND
      }
      const oben = f.height - RAND - h - anhebung + versatz.y
      const korrekturX = Math.min(Math.max(links, RAND), Math.max(RAND, f.width - b - RAND)) - links
      const korrekturY = Math.min(Math.max(oben, RAND), Math.max(RAND, f.height - h - RAND)) - oben
      setLage((alt) =>
        alt.korrekturX === korrekturX && alt.korrekturY === korrekturY && alt.anhebung === anhebung
          ? alt
          : { korrekturX, korrekturY, anhebung },
      )
    }
    messen()
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(flaeche)
    beobachter.observe(leiste)
    return () => beobachter.disconnect()
  }, [
    sichtbar,
    versatz.x,
    versatz.y,
    gespeicherterVersatz,
    ziehVersatz,
    statusText,
    aktionen,
    auswahlAktionen.length,
  ])

  if (!sichtbar) return null

  function griffRunter(e: PointerEvent<HTMLSpanElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    ziehStartRef.current = {
      zeiger: { x: e.clientX, y: e.clientY },
      versatz: { x: versatz.x + lage.korrekturX, y: versatz.y + lage.korrekturY - lage.anhebung },
    }
    setZiehVersatz(ziehStartRef.current.versatz)
  }

  function griffBewegen(e: PointerEvent<HTMLSpanElement>) {
    const start = ziehStartRef.current
    if (!start) return
    setZiehVersatz({
      x: start.versatz.x + e.clientX - start.zeiger.x,
      y: start.versatz.y + e.clientY - start.zeiger.y,
    })
  }

  function griffLoslassen() {
    if (!ziehStartRef.current || !ziehVersatz) return
    ziehStartRef.current = null
    setVersatz(settingsStore, {
      x: Math.round(ziehVersatz.x + lage.korrekturX),
      y: Math.round(ziehVersatz.y + lage.korrekturY),
    })
    setZiehVersatz(null)
  }

  const x = versatz.x + lage.korrekturX
  const y = versatz.y + lage.korrekturY - lage.anhebung

  return (
    <div
      ref={leisteRef}
      className={`kontextleiste${touch ? ' kontextleiste-touch' : ''}${ziehVersatz ? ' kontextleiste-zieht' : ''}${auswahlAktionen.length > 0 ? ' kontextleiste-auswahl' : ''}`}
      role="toolbar"
      aria-label={t('kontextleiste.tastenfunktionen')}
      style={{ transform: `translate(calc(-50% + ${x}px), ${y}px)` }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <div className="kontextleiste-inhalt">
        <div className="kontextleiste-kopf">
          <span className="kontextleiste-titel">{werkzeugName(aktivesToolId)}</span>
          <span
            className="kontextleiste-griff"
            title={t('kontextleiste.ziehenTitel')}
            aria-hidden="true"
            onPointerDown={griffRunter}
            onPointerMove={griffBewegen}
            onPointerUp={griffLoslassen}
            onPointerCancel={griffLoslassen}
            onDoubleClick={() => setVersatz(settingsStore, null)}
          >
            ⋮⋮
          </span>
        </div>
        <div className="kontextleiste-knoepfe">
          {gruppiere(aktionen).map((teil) =>
            Array.isArray(teil) ? (
              <Gruppe key={`g-${teil[0].gruppe}`} aktionen={teil} neu={neu} />
            ) : (
              <Knopf key={teil.taste} aktion={teil} neu={neu.has(teil.taste)} />
            ),
          )}
          {escWirkt && (
            <Knopf
              aktion={{
                taste: 'Escape',
                kennung: 'Esc',
                beschriftung: t('kontextleiste.abbrechen'),
              }}
              neu={false}
            />
          )}
        </div>
        {auswahlAktionen.length > 0 && (
          <div
            className="kontextleiste-knoepfe"
            role="group"
            aria-label={t('kontextleiste.aktionen')}
          >
            <span className="kontextleiste-gruppe-name">{t('kontextleiste.aktionen')}</span>
            {auswahlAktionen.map((eintrag) => (
              <AktionsKnopf key={eintrag.id} eintrag={eintrag} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AktionsKnopf({ eintrag }: { eintrag: KontextMenuEintrag }) {
  const [offen, setOffen] = useState<{ links: number; unten: number } | null>(null)
  const menueRef = useRef<HTMLDivElement | null>(null)
  const knopfRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!offen) return
    function aussen(e: globalThis.PointerEvent) {
      const ziel = e.target as Node
      if (menueRef.current?.contains(ziel) || knopfRef.current?.contains(ziel)) return
      setOffen(null)
    }
    window.addEventListener('pointerdown', aussen, true)
    return () => window.removeEventListener('pointerdown', aussen, true)
  }, [offen])

  return (
    <>
      <button
        ref={knopfRef}
        type="button"
        className="kontextleiste-knopf kontextleiste-aktion"
        title={eintrag.hinweis}
        aria-haspopup={eintrag.untermenue ? 'menu' : undefined}
        aria-expanded={eintrag.untermenue ? !!offen : undefined}
        onClick={(e) => {
          if (!eintrag.untermenue) {
            eintrag.ausfuehren?.()
            return
          }
          if (offen) {
            setOffen(null)
            return
          }
          const r = e.currentTarget.getBoundingClientRect()
          setOffen({ links: r.left, unten: window.innerHeight - r.top + 4 })
        }}
      >
        <span>{eintrag.label}</span>
        {eintrag.untermenue && <span aria-hidden="true">▾</span>}
      </button>
      {offen &&
        eintrag.untermenue &&
        createPortal(
          <div
            ref={menueRef}
            className="kontextmenu"
            role="menu"
            style={{ left: offen.links, bottom: offen.unten }}
            onPointerDown={(e) => e.preventDefault()}
          >
            <KontextMenuListe eintraege={eintrag.untermenue} schliessen={() => setOffen(null)} />
          </div>,
          document.body,
        )}
    </>
  )
}

function gruppiere(aktionen: readonly KontextAktion[]): (KontextAktion | KontextAktion[])[] {
  const teile: (KontextAktion | KontextAktion[])[] = []
  for (const a of aktionen) {
    const letzte = teile[teile.length - 1]
    if (a.gruppe && Array.isArray(letzte) && letzte[0].gruppe === a.gruppe) letzte.push(a)
    else teile.push(a.gruppe ? [a] : a)
  }
  return teile
}

function druecke(taste: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: taste }))
}

function Knopf({ aktion, neu }: { aktion: KontextAktion; neu: boolean }) {
  return (
    <button
      type="button"
      className={`kontextleiste-knopf${neu ? ' kontextleiste-neu' : ''}${aktion.taste === 'Escape' ? ' kontextleiste-esc' : ''}`}
      aria-keyshortcuts={aktion.kennung}
      aria-pressed={aktion.an}
      onClick={() => druecke(aktion.taste)}
    >
      <kbd className="kontextleiste-taste">{aktion.kennung}</kbd>
      <span>{aktion.beschriftung}</span>
      {aktion.an !== undefined && (
        <span className={`kontextleiste-haken${aktion.an ? ' an' : ''}`} aria-hidden="true">
          {aktion.an ? '✓' : ''}
        </span>
      )}
    </button>
  )
}

function Gruppe({ aktionen, neu }: { aktionen: KontextAktion[]; neu: ReadonlySet<string> }) {
  const wert = aktionen.find((a) => a.wert !== undefined)?.wert
  return (
    <span className="kontextleiste-gruppe" role="group" aria-label={aktionen[0].gruppe}>
      <span className="kontextleiste-gruppe-name">{aktionen[0].gruppe}</span>
      {aktionen.map((a, i) => (
        <span key={a.taste} className="kontextleiste-gruppe-teil">
          {wert !== undefined && i === 1 && <span className="kontextleiste-wert">{wert}</span>}
          <button
            type="button"
            className={`kontextleiste-knopf kontextleiste-knopf-klein${a.gewaehlt ? ' gewaehlt' : ''}${neu.has(a.taste) ? ' kontextleiste-neu' : ''}`}
            title={a.beschriftung}
            aria-label={a.beschriftung}
            aria-keyshortcuts={a.kennung}
            aria-pressed={a.gewaehlt}
            onClick={() => druecke(a.taste)}
          >
            {a.kennung}
          </button>
        </span>
      ))}
    </span>
  )
}

function useAufleuchten(aktionen: readonly KontextAktion[], toolId: string): ReadonlySet<string> {
  const vorherRef = useRef<{ tasten: Set<string>; toolId: string }>({ tasten: new Set(), toolId })
  const zeitRef = useRef<number | undefined>(undefined)
  const [neu, setNeu] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const vorher = vorherRef.current
    const jetzt = new Set(aktionen.map((a) => a.taste))
    vorherRef.current = { tasten: jetzt, toolId }
    if (vorher.toolId !== toolId || vorher.tasten.size === 0) return
    const hinzu = [...jetzt].filter((t) => !vorher.tasten.has(t))
    if (hinzu.length === 0) return
    window.clearTimeout(zeitRef.current)
    setNeu(new Set(hinzu))
    zeitRef.current = window.setTimeout(() => setNeu(new Set()), AUFLEUCHTEN_MS)
  }, [aktionen, toolId])

  useEffect(() => () => window.clearTimeout(zeitRef.current), [])

  return neu
}
