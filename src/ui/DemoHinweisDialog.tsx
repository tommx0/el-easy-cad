import { formatiereAblaufdatum } from './ablaufdatum'
import { useUiStore } from './store/ui-store'
import { useSettingsStore } from './store/settings-store'
import { useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'
import { useStarthinweisSichtbar } from './starthinweis'

export function DemoHinweisDialog(_props: { resttage: number }) {
  const { settingsStore } = useAppContext()
  const t = useT()
  const sichtbar = useStarthinweisSichtbar()
  const status = useUiStore((s) => s.produktlizenzStatus)

  const lizenzProblem = status?.status === 'abgelaufen' || status?.status === 'ungueltig'
  if (!sichtbar) return null

  const schliessen = () => {
    useUiStore.getState().setStarthinweisErledigt()
    useSettingsStore.getState().setCommunityHinweisVersion(settingsStore, __APP_VERSION__)
  }
  const oeffneMeineLizenz = () => {
    schliessen()
    useUiStore.getState().setMeineLizenzDialogOffen(true)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{t('community.start.titel')}</h2>
        {status?.status === 'abgelaufen' && (
          <p>
            <b>
              {t('community.start.abgelaufen', {
                datum: status.gueltigBis ? formatiereAblaufdatum(status.gueltigBis) : '',
              })}
            </b>
          </p>
        )}
        {status?.status === 'ungueltig' && (
          <p>
            <b>{t('community.start.ungueltig')}</b>
          </p>
        )}
        <p>{t('community.start.kostenlos')}</p>
        <p>{t('community.start.gewerblich')}</p>
        <div className="dialog-aktionen">
          {lizenzProblem && (
            <button type="button" onClick={oeffneMeineLizenz}>
              {t('community.start.lizenzEinspielen')}
            </button>
          )}
          <button type="button" className="primaer" onClick={schliessen}>
            {t('community.start.verstanden')}
          </button>
        </div>
      </div>
    </div>
  )
}
