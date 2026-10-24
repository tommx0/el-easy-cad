import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'

export function UeberDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.ueberDialogOffen)
  const schliessen = () => useUiStore.getState().setUeberDialogOffen(false)
  const oeffneLizenzen = () => {
    useUiStore.getState().setUeberDialogOffen(false)
    useUiStore.getState().setLizenzenDialogOffen(true)
  }

  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.ueber.titel')}</h2>
        <p>{t('verwaltungsdialoge.ueber.beschreibung')}</p>
        <p>{t('verwaltungsdialoge.ueber.version', { version: __APP_VERSION__ })}</p>
        <p className="dialog-copyright">© 2026 Thomas Marx</p>
        <div className="dialog-aktionen">
          <button type="button" onClick={oeffneLizenzen}>
            {t('verwaltungsdialoge.ueber.lizenzen')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
