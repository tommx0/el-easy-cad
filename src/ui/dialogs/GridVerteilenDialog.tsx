import { useState } from 'react'
import { useUiStore } from '../store/ui-store'
import { ZahlenFeld } from '../ZahlenFeld'
import { useT } from '../sprache-anbindung'

export function GridVerteilenDialog() {
  const dialog = useUiStore((s) => s.gridVerteilenDialog)
  const schliessen = useUiStore((s) => s.schliesseGridVerteilenDialog)
  const t = useT()

  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [abstandX, setAbstandX] = useState(0)
  const [abstandY, setAbstandY] = useState(0)

  const [vorherigerDialog, setVorherigerDialog] = useState(dialog)
  if (dialog !== vorherigerDialog) {
    setVorherigerDialog(dialog)
    if (dialog) {
      setX(dialog.standard.x)
      setY(dialog.standard.y)
      setAbstandX(dialog.standard.abstandX)
      setAbstandY(dialog.standard.abstandY)
    }
  }

  if (!dialog) return null

  function bestaetigen() {
    dialog!.callback({ x, y, abstandX, abstandY })
    schliessen()
  }

  function abbrechen() {
    dialog!.callback(null)
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={abbrechen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.gridVerteilen.titel')}</h2>
        <label className="feld">
          {t('zeichendialoge.gridVerteilen.x')}
          <ZahlenFeld value={x} step={1} onCommit={setX} />
        </label>
        <label className="feld">
          {t('zeichendialoge.gridVerteilen.y')}
          <ZahlenFeld value={y} step={1} onCommit={setY} />
        </label>
        <label className="feld">
          {t('zeichendialoge.gridVerteilen.abstandHorizontal')}
          <ZahlenFeld value={abstandX} min={0} step={1} onCommit={setAbstandX} />
        </label>
        <label className="feld">
          {t('zeichendialoge.gridVerteilen.abstandVertikal')}
          <ZahlenFeld value={abstandY} min={0} step={1} onCommit={setAbstandY} />
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
