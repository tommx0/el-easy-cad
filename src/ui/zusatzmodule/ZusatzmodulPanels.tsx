import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useT } from '../sprache-anbindung'
import { useZusatzmodulStore, type ZusatzmodulPanelEintrag } from '../store/zusatzmodul-store'

function PanelBehaelter({ panel }: { panel: ZusatzmodulPanelEintrag }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { erzeuge } = panel
  useEffect(() => {
    const behaelter = ref.current
    if (!behaelter) return
    let aufraeumen: void | (() => void)
    try {
      aufraeumen = erzeuge(behaelter)
    } catch (fehler) {
      behaelter.textContent = fehler instanceof Error ? fehler.message : String(fehler)
    }
    return () => {
      try {
        aufraeumen?.()
      } finally {
        behaelter.replaceChildren()
      }
    }
  }, [erzeuge])
  return <div ref={ref} className="zusatzmodul-panel-inhalt" hidden={!panel.sichtbar} />
}

export function ZusatzmodulPanelsRechts() {
  const panels = useZusatzmodulStore((s) => s.panels).filter((p) => p.ort === 'rechts')
  if (panels.length === 0) return null
  return (
    <div className="zusatzmodul-panels-rechts">
      {panels.map((panel) => (
        <section key={panel.schluessel} className="zusatzmodul-panel">
          <button
            type="button"
            className="zusatzmodul-panel-kopf"
            aria-expanded={panel.sichtbar}
            onClick={() =>
              useZusatzmodulStore
                .getState()
                .aenderePanel(panel.schluessel, { sichtbar: !panel.sichtbar })
            }
          >
            <span aria-hidden="true">{panel.sichtbar ? '▾' : '▸'}</span>
            {panel.titel}
          </button>
          <PanelBehaelter panel={panel} />
        </section>
      ))}
    </div>
  )
}

const DOCK_FANG_PX = 24
const LOESEN_PX = 40
const DOCK_BREITE = { min: 200, max: 600, vorgabe: 300 }

function docke(schluessel: string, seite: 'links' | 'rechts' | undefined) {
  useZusatzmodulStore.getState().aenderePanel(schluessel, { angedockt: seite })
}

const START_ABSTAND = { rechts: 300, oben: 140, versatz: 28 }

function SchwebendesPanel({ panel, index }: { panel: ZusatzmodulPanelEintrag; index: number }) {
  const t = useT()
  const breite = panel.breite ?? 260
  const [lage, setLage] = useState(() => ({
    x: Math.max(
      16,
      window.innerWidth -
        Math.max(START_ABSTAND.rechts, breite + 40) -
        index * START_ABSTAND.versatz,
    ),
    y: Math.max(
      16,
      Math.min(
        START_ABSTAND.oben + index * START_ABSTAND.versatz,
        window.innerHeight - (panel.hoehe ?? 0) - 16,
      ),
    ),
  }))
  const zugRef = useRef<{ dx: number; dy: number } | null>(null)

  function beginneZug(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    zugRef.current = { dx: e.clientX - lage.x, dy: e.clientY - lage.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  return (
    <div
      className="zusatzmodul-panel-schwebend"
      style={{
        left: lage.x,
        top: lage.y,
        ...(panel.breite ? { width: panel.breite } : {}),
        ...(panel.hoehe ? { height: panel.hoehe, maxHeight: 'calc(100vh - 32px)' } : {}),
      }}
      hidden={!panel.sichtbar}
      role="dialog"
      aria-label={panel.titel}
    >
      <div
        className="zusatzmodul-panel-griff"
        onPointerDown={beginneZug}
        onPointerMove={(e) => {
          const zug = zugRef.current
          if (!zug) return
          setLage({
            x: Math.min(Math.max(0, e.clientX - zug.dx), window.innerWidth - 80),
            y: Math.min(Math.max(0, e.clientY - zug.dy), window.innerHeight - 40),
          })
        }}
        onPointerUp={(e) => {
          const gezogen = zugRef.current !== null
          zugRef.current = null
          if (!gezogen || !panel.andockbar) return
          if (e.clientX <= DOCK_FANG_PX) docke(panel.schluessel, 'links')
          else if (e.clientX >= window.innerWidth - DOCK_FANG_PX) docke(panel.schluessel, 'rechts')
        }}
      >
        <span>{panel.titel}</span>
        {panel.andockbar && (
          <span className="zusatzmodul-panel-dockknoepfe">
            <button
              type="button"
              title={t('verwaltungsdialoge.zusatzmodule.panelLinks')}
              aria-label={t('verwaltungsdialoge.zusatzmodule.panelLinks')}
              onClick={() => docke(panel.schluessel, 'links')}
            >
              ⇤
            </button>
            <button
              type="button"
              title={t('verwaltungsdialoge.zusatzmodule.panelRechts')}
              aria-label={t('verwaltungsdialoge.zusatzmodule.panelRechts')}
              onClick={() => docke(panel.schluessel, 'rechts')}
            >
              ⇥
            </button>
          </span>
        )}
        <button
          type="button"
          aria-label={t('verwaltungsdialoge.allgemein.schliessen')}
          onClick={() =>
            useZusatzmodulStore.getState().aenderePanel(panel.schluessel, { sichtbar: false })
          }
        >
          ✕
        </button>
      </div>
      <PanelBehaelter panel={{ ...panel, sichtbar: true }} />
    </div>
  )
}

export function ZusatzmodulPanelsSchwebend() {
  const panels = useZusatzmodulStore((s) => s.panels).filter(
    (p) => p.ort === 'schwebend' && !p.angedockt,
  )
  return (
    <>
      {panels.map((panel, index) => (
        <SchwebendesPanel key={panel.schluessel} panel={panel} index={index} />
      ))}
    </>
  )
}

function AngedocktesPanel({
  panel,
  seite,
}: {
  panel: ZusatzmodulPanelEintrag
  seite: 'links' | 'rechts'
}) {
  const t = useT()
  const breite =
    panel.dockBreite ??
    Math.min(DOCK_BREITE.max, Math.max(DOCK_BREITE.min, panel.breite ?? DOCK_BREITE.vorgabe))
  const kanteRef = useRef<{ x: number; breite: number } | null>(null)
  const kopfRef = useRef<{ x: number; y: number } | null>(null)
  return (
    <aside
      className={`zusatzmodul-panel-angedockt ${seite}`}
      style={{ width: breite }}
      aria-label={panel.titel}
    >
      <div
        className="zusatzmodul-panel-griff"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          kopfRef.current = { x: e.clientX, y: e.clientY }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const start = kopfRef.current
          if (!start) return
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) >= LOESEN_PX) {
            kopfRef.current = null
            docke(panel.schluessel, undefined)
          }
        }}
        onPointerUp={() => {
          kopfRef.current = null
        }}
      >
        <span>{panel.titel}</span>
        <span className="zusatzmodul-panel-dockknoepfe">
          <button
            type="button"
            title={t('verwaltungsdialoge.zusatzmodule.panelLoesen')}
            aria-label={t('verwaltungsdialoge.zusatzmodule.panelLoesen')}
            onClick={() => docke(panel.schluessel, undefined)}
          >
            ⧉
          </button>
          <button
            type="button"
            aria-label={t('verwaltungsdialoge.allgemein.schliessen')}
            onClick={() =>
              useZusatzmodulStore.getState().aenderePanel(panel.schluessel, { sichtbar: false })
            }
          >
            ✕
          </button>
        </span>
      </div>
      <div className="zusatzmodul-panel-dockinhalt">
        <PanelBehaelter panel={{ ...panel, sichtbar: true }} />
      </div>
      <div
        className="zusatzmodul-panel-dockkante"
        role="separator"
        aria-orientation="vertical"
        title={t('verwaltungsdialoge.zusatzmodule.panelBreite')}
        onPointerDown={(e) => {
          kanteRef.current = { x: e.clientX, breite }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const zug = kanteRef.current
          if (!zug) return
          const delta = seite === 'links' ? e.clientX - zug.x : zug.x - e.clientX
          const neu = Math.min(DOCK_BREITE.max, Math.max(DOCK_BREITE.min, zug.breite + delta))
          useZusatzmodulStore.getState().aenderePanel(panel.schluessel, { dockBreite: neu })
        }}
        onPointerUp={() => {
          kanteRef.current = null
        }}
      />
    </aside>
  )
}

export function ZusatzmodulPanelsAngedockt({ seite }: { seite: 'links' | 'rechts' }) {
  const panels = useZusatzmodulStore((s) => s.panels).filter(
    (p) => p.ort === 'schwebend' && p.angedockt === seite && p.sichtbar,
  )
  return (
    <>
      {panels.map((panel) => (
        <AngedocktesPanel key={panel.schluessel} panel={panel} seite={seite} />
      ))}
    </>
  )
}
