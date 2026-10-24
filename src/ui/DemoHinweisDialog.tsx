import { useState } from 'react'
import { useT } from './sprache-anbindung'
import { useUiStore } from './store/ui-store'

export function DemoHinweisDialog({ resttage }: { resttage: number }) {
  const t = useT()
  const [weggeklickt, setWeggeklickt] = useState(false)
  if (weggeklickt) return null

  const oeffneMeineLizenz = () => {
    setWeggeklickt(true)
    useUiStore.getState().setMeineLizenzDialogOffen(true)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{t('verwaltungsdialoge.demoHinweis.titel')}</h2>
        <p>{t('verwaltungsdialoge.demoHinweis.text')}</p>
        <p>
          {resttage > 0
            ? t('verwaltungsdialoge.demoHinweis.resttage', { n: resttage })
            : t('verwaltungsdialoge.demoHinweis.laeuftHeuteAb')}
        </p>
        <div className="dialog-aktionen">
          <button type="button" onClick={oeffneMeineLizenz}>
            {t('verwaltungsdialoge.demoHinweis.lizenzEinspielen')}
          </button>
          <button type="button" className="primaer" onClick={() => setWeggeklickt(true)}>
            {t('verwaltungsdialoge.demoHinweis.verstanden')}
          </button>
        </div>
      </div>
    </div>
  )
}
