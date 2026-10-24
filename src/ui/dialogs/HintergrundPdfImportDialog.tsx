import { useEffect, useRef, useState } from 'react'
import { rendereSeitenVorschau } from '../../rendering'
import { useUiStore } from '../store/ui-store'
import type { HintergrundPdfImportErgebnis } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

const PT_ZU_MM = 25.4 / 72
const GROSSE_VORSCHAU_BREITE_PX = 720
const THUMBNAIL_BREITE_PX = 120
const MINDESTGROESSE_PX = 6

interface Rechteck {
  x: number
  y: number
  breite: number
  hoehe: number
}

interface GrosseVorschau {
  url: string
  breitePx: number
  hoehePx: number
  skala: number
}

function klemme(wert: number, min: number, max: number): number {
  return Math.min(Math.max(wert, min), max)
}

function rohZuMm(pt: number): number {
  return Math.round(pt * PT_ZU_MM)
}

export function HintergrundPdfImportDialog() {
  const zustand = useUiStore((s) => s.hintergrundPdfImportDialog)
  const t = useT()

  const [seite, setSeite] = useState(1)
  const [auswahl, setAuswahl] = useState<Rechteck | null>(null)
  const [vorschau, setVorschau] = useState<GrosseVorschau | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})
  const ziehStartRef = useRef<{ x: number; y: number } | null>(null)

  const [vorherigerZustand, setVorherigerZustand] = useState(zustand)
  if (zustand !== vorherigerZustand) {
    setVorherigerZustand(zustand)
    setSeite(1)
    setAuswahl(null)
    setVorschau(null)
    setThumbnails({})
  }

  useEffect(() => {
    if (!zustand) return
    let abgebrochen = false
    rendereSeitenVorschau(zustand.sitzung.dokument, seite, GROSSE_VORSCHAU_BREITE_PX).then((v) => {
      if (abgebrochen) return
      setVorschau({
        url: v.canvas.toDataURL(),
        breitePx: v.canvas.width,
        hoehePx: v.canvas.height,
        skala: v.skala,
      })
    })
    return () => {
      abgebrochen = true
    }
  }, [zustand, seite])

  useEffect(() => {
    if (!zustand || zustand.sitzung.dokument.numPages <= 1) return
    let abgebrochen = false
    for (let n = 1; n <= zustand.sitzung.dokument.numPages; n++) {
      rendereSeitenVorschau(zustand.sitzung.dokument, n, THUMBNAIL_BREITE_PX).then((v) => {
        if (abgebrochen) return
        setThumbnails((bisherige) => ({ ...bisherige, [n]: v.canvas.toDataURL() }))
      })
    }
    return () => {
      abgebrochen = true
    }
  }, [zustand])

  if (!zustand) return null
  const { dateiname, sitzung, callback } = zustand
  const numPages = sitzung.dokument.numPages

  function abbrechen() {
    callback(null)
    useUiStore.getState().schliesseHintergrundPdfImportDialog()
  }

  function uebernehmen() {
    if (!vorschau) return
    const crop = auswahl ?? { x: 0, y: 0, breite: vorschau.breitePx, hoehe: vorschau.hoehePx }
    const ergebnis: HintergrundPdfImportErgebnis = {
      seite,
      ausschnittOffset: { x: crop.x / vorschau.skala, y: crop.y / vorschau.skala },
      breiteRoh: crop.breite / vorschau.skala,
      hoeheRoh: crop.hoehe / vorschau.skala,
    }
    callback(ergebnis)
    useUiStore.getState().schliesseHintergrundPdfImportDialog()
  }

  function aufZiehStart(e: React.PointerEvent<HTMLDivElement>) {
    const rahmen = e.currentTarget.getBoundingClientRect()
    const start = { x: e.clientX - rahmen.left, y: e.clientY - rahmen.top }
    ziehStartRef.current = start
    e.currentTarget.setPointerCapture(e.pointerId)
    setAuswahl({ ...start, breite: 0, hoehe: 0 })
  }

  function aufZiehen(e: React.PointerEvent<HTMLDivElement>) {
    const start = ziehStartRef.current
    if (!start || !vorschau) return
    const rahmen = e.currentTarget.getBoundingClientRect()
    const x = klemme(e.clientX - rahmen.left, 0, vorschau.breitePx)
    const y = klemme(e.clientY - rahmen.top, 0, vorschau.hoehePx)
    setAuswahl({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      breite: Math.abs(x - start.x),
      hoehe: Math.abs(y - start.y),
    })
  }

  function aufZiehEnde() {
    ziehStartRef.current = null
    setAuswahl((a) =>
      a && a.breite >= MINDESTGROESSE_PX && a.hoehe >= MINDESTGROESSE_PX ? a : null,
    )
  }

  const massangabe = vorschau
    ? auswahl
      ? t('zeichendialoge.pdfImport.ausschnitt', {
          breite: String(rohZuMm(auswahl.breite / vorschau.skala)),
          hoehe: String(rohZuMm(auswahl.hoehe / vorschau.skala)),
        })
      : t('zeichendialoge.pdfImport.ganzeSeiteMass', {
          breite: String(rohZuMm(vorschau.breitePx / vorschau.skala)),
          hoehe: String(rohZuMm(vorschau.hoehePx / vorschau.skala)),
        })
    : null

  return (
    <div className="dialog-overlay" onMouseDown={abbrechen}>
      <div className="dialog dialog-breit" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.pdfImport.titel')}</h2>
        <p className="dialog-hinweis">
          {t(
            numPages > 1
              ? 'zeichendialoge.pdfImport.hinweisMehrereSeiten'
              : 'zeichendialoge.pdfImport.hinweisEineSeite',
            { datei: dateiname },
          )}
        </p>

        {numPages > 1 && (
          <div className="hintergrund-pdf-seiten">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                aria-label={t('zeichendialoge.pdfImport.seite', { n })}
                className={n === seite ? 'hintergrund-pdf-seite aktiv' : 'hintergrund-pdf-seite'}
                onClick={() => setSeite(n)}
              >
                {thumbnails[n] ? (
                  <img
                    src={thumbnails[n]}
                    alt={t('zeichendialoge.pdfImport.seite', { n })}
                    draggable={false}
                  />
                ) : (
                  <span className="hintergrund-pdf-seite-lade">…</span>
                )}
                <span className="hintergrund-pdf-seite-nr">{n}</span>
              </button>
            ))}
          </div>
        )}

        <div className="hintergrund-pdf-vorschau-bereich">
          {vorschau ? (
            <div
              className="hintergrund-pdf-vorschau"
              style={{ width: vorschau.breitePx, height: vorschau.hoehePx }}
              onPointerDown={aufZiehStart}
              onPointerMove={aufZiehen}
              onPointerUp={aufZiehEnde}
            >
              <img
                src={vorschau.url}
                alt={t('zeichendialoge.pdfImport.seite', { n: seite })}
                draggable={false}
              />
              {auswahl && (
                <div
                  className="hintergrund-pdf-auswahl"
                  style={{
                    left: auswahl.x,
                    top: auswahl.y,
                    width: auswahl.breite,
                    height: auswahl.hoehe,
                  }}
                />
              )}
            </div>
          ) : (
            <p className="dialog-hinweis">{t('zeichendialoge.pdfImport.laedt')}</p>
          )}
        </div>
        {massangabe && <p className="dialog-hinweis">{massangabe}</p>}

        <div className="dialog-aktionen">
          <button type="button" onClick={() => setAuswahl(null)} disabled={!auswahl}>
            {t('zeichendialoge.pdfImport.ganzeSeiteVerwenden')}
          </button>
          <button type="button" onClick={abbrechen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={uebernehmen} disabled={!vorschau}>
            {t('zeichendialoge.gemeinsam.uebernehmen')}
          </button>
        </div>
      </div>
    </div>
  )
}
