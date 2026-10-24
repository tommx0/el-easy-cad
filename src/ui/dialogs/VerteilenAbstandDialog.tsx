import { useState } from 'react'
import { useUiStore } from '../store/ui-store'
import { ZahlenFeld } from '../ZahlenFeld'
import { useT } from '../sprache-anbindung'

export function VerteilenAbstandDialog() {
  const dialog = useUiStore((s) => s.verteilenAbstandDialog)
  const schliessen = useUiStore((s) => s.schliesseVerteilenAbstandDialog)
  const t = useT()

  const [abstand, setAbstand] = useState(0)

  const [vorherigerDialog, setVorherigerDialog] = useState(dialog)
  if (dialog !== vorherigerDialog) {
    setVorherigerDialog(dialog)
    if (dialog) setAbstand(dialog.standardAbstand)
  }

  if (!dialog) return null

  function bestaetigen() {
    dialog!.callback(abstand)
    schliessen()
  }

  function abbrechen() {
    dialog!.callback(null)
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={abbrechen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{dialog.titel}</h2>
        <label className="feld">
          {t('zeichendialoge.verteilenAbstand.abstand')}
          <ZahlenFeld value={abstand} min={0} step={1} onCommit={setAbstand} />
        </label>
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
