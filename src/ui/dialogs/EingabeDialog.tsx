import { useEffect, useRef, useState } from 'react'
import type { EingabeDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function EingabeDialog() {
  const dialog = useUiStore((s) => s.eingabeDialog)
  const schliessen = useUiStore((s) => s.schliesseEingabeDialog)
  const t = useT()
  const [wert, setWert] = useState('')
  const [auswahl, setAuswahl] = useState('')
  const [zweiteAuswahl, setZweiteAuswahl] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [vorherigerDialog, setVorherigerDialog] = useState<EingabeDialogZustand | null>(null)
  if (dialog !== vorherigerDialog) {
    setVorherigerDialog(dialog)
    setWert(dialog?.optionen.anfangswert ?? '')
    setAuswahl(dialog?.optionen.auswahl?.anfangswert ?? '')
    setZweiteAuswahl(dialog?.optionen.zweiteAuswahl?.anfangswert ?? '')
  }

  useEffect(() => {
    if (dialog) requestAnimationFrame(() => inputRef.current?.focus())
  }, [dialog])

  if (!dialog) return null

  function bestaetigen() {
    if (!dialog) return
    dialog.callback(
      wert,
      dialog.optionen.auswahl ? auswahl : undefined,
      dialog.optionen.zweiteAuswahl ? zweiteAuswahl : undefined,
    )
    schliessen()
  }

  function abbrechen() {
    if (!dialog) return
    dialog.callback(null)
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={abbrechen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{dialog.optionen.titel}</h2>
        <label className="dialog-feld">
          {dialog.optionen.label}
          <input
            ref={inputRef}
            type={dialog.optionen.typ === 'zahl' ? 'text' : 'text'}
            inputMode={dialog.optionen.typ === 'zahl' ? 'decimal' : undefined}
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') bestaetigen()
              if (e.key === 'Escape') abbrechen()
            }}
          />
        </label>
        {dialog.optionen.auswahl && (
          <label className="dialog-feld">
            {dialog.optionen.auswahl.label}
            <select value={auswahl} onChange={(e) => setAuswahl(e.target.value)}>
              {dialog.optionen.auswahl.optionen.map((o) => (
                <option key={o.wert} value={o.wert}>
                  {o.text}
                </option>
              ))}
            </select>
          </label>
        )}
        {dialog.optionen.zweiteAuswahl && (
          <label className="dialog-feld">
            {dialog.optionen.zweiteAuswahl.label}
            <select value={zweiteAuswahl} onChange={(e) => setZweiteAuswahl(e.target.value)}>
              {dialog.optionen.zweiteAuswahl.optionen.map((o) => (
                <option key={o.wert} value={o.wert}>
                  {o.text}
                </option>
              ))}
            </select>
          </label>
        )}
        {dialog.optionen.hinweis && <p className="dialog-hinweis">{dialog.optionen.hinweis}</p>}
        <div className="dialog-aktionen">
          <button type="button" onClick={abbrechen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={bestaetigen}>
            {t('zeichendialoge.gemeinsam.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
