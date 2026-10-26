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

const START_ABSTAND = { rechts: 300, oben: 140, versatz: 28 }

function SchwebendesPanel({ panel, index }: { panel: ZusatzmodulPanelEintrag; index: number }) {
  const t = useT()
  const [lage, setLage] = useState(() => ({
    x: Math.max(16, window.innerWidth - START_ABSTAND.rechts - index * START_ABSTAND.versatz),
    y: START_ABSTAND.oben + index * START_ABSTAND.versatz,
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
      style={{ left: lage.x, top: lage.y }}
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
        onPointerUp={() => {
          zugRef.current = null
        }}
      >
        <span>{panel.titel}</span>
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
  const panels = useZusatzmodulStore((s) => s.panels).filter((p) => p.ort === 'schwebend')
  return (
    <>
      {panels.map((panel, index) => (
        <SchwebendesPanel key={panel.schluessel} panel={panel} index={index} />
      ))}
    </>
  )
}
