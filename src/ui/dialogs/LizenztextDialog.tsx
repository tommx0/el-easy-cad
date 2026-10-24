import { useState } from 'react'
import { createPortal } from 'react-dom'
import lizenztext from '../../../LICENSE?raw'
import { useT } from '../sprache-anbindung'

function LizenztextDialog({ schliessen }: { schliessen: () => void }) {
  const t = useT()
  return createPortal(
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-datenschutz" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('community.lizenztext.titel')}</h2>
        <p className="dialog-hinweis">{t('community.lizenztext.hinweis')}</p>
        <div className="datenschutz-content">
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', margin: 0 }}>{lizenztext}</pre>
        </div>
        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function LizenztextKnopf() {
  const t = useT()
  const [offen, setOffen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOffen(true)}>
        {t('community.lizenztext.knopf')}
      </button>
      {offen && <LizenztextDialog schliessen={() => setOffen(false)} />}
    </>
  )
}
