import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { PROJEKT_URL } from '../community'
import { UnterstuetzenVerweise, Verweis } from '../UnterstuetzenVerweise'
import { LizenztextKnopf } from './LizenztextDialog'

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
        <p>
          {t('community.ueber.fassung')} ·{' '}
          {t('verwaltungsdialoge.ueber.version', { version: __APP_VERSION__ })}
        </p>
        <p className="dialog-hinweis">{t('community.ueber.lizenz')}</p>
        <p className="dialog-hinweis">{t('community.ueber.keineDaten')}</p>
        <UnterstuetzenVerweise />
        <p className="dialog-copyright">
          © 2026 Thomas Marx · <Verweis url={PROJEKT_URL}>github.com/tommx0/el-easy-cad</Verweis>
        </p>
        <div className="dialog-aktionen">
          <LizenztextKnopf />
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
