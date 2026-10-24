import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { DatenschutzInhalt } from './DatenschutzInhalt'

export function DatenschutzDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.datenschutzDialogOffen)
  const schliessen = () => useUiStore.getState().setDatenschutzDialogOffen(false)
  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-datenschutz" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.datenschutz.titel')}</h2>

        <DatenschutzInhalt />

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
