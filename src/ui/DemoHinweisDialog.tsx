import { useState } from 'react'
import { formatiereAblaufdatum } from './ablaufdatum'
import { useUiStore } from './store/ui-store'
import { useSettingsStore } from './store/settings-store'
import { useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'
import { UnterstuetzenVerweise } from './UnterstuetzenVerweise'

export function DemoHinweisDialog(_props: { resttage: number }) {
  const { settingsStore } = useAppContext()
  const t = useT()
  const [weggeklickt, setWeggeklickt] = useState(false)
  const geladen = useSettingsStore((s) => s.geladen)
  const gesehen = useSettingsStore((s) => s.communityHinweisVersion)
  const status = useUiStore((s) => s.produktlizenzStatus)

  const lizenzProblem = status?.status === 'abgelaufen' || status?.status === 'ungueltig'
  if (weggeklickt || !geladen) return null
  if (!lizenzProblem && gesehen === __APP_VERSION__) return null

  const schliessen = () => {
    setWeggeklickt(true)
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
        <UnterstuetzenVerweise />
        <div className="dialog-aktionen">
          <button type="button" onClick={oeffneMeineLizenz}>
            {t('community.start.lizenzEinspielen')}
          </button>
          <button type="button" className="primaer" onClick={schliessen}>
            {t('community.start.verstanden')}
          </button>
        </div>
      </div>
    </div>
  )
}
