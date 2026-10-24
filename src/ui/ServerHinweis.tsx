import { isTauri } from '@tauri-apps/api/core'
import { useState } from 'react'
import { useT } from './sprache-anbindung'
import { useAppContext } from './use-app-context'

export function ServerHinweis() {
  const t = useT()
  const { pruefeServer } = useAppContext()
  const [pruefeGerade, setPruefeGerade] = useState(false)
  const inTauriApp = isTauri()

  async function erneutVersuchen() {
    setPruefeGerade(true)
    try {
      await pruefeServer()
    } finally {
      setPruefeGerade(false)
    }
  }

  return (
    <div className="server-hinweis">
      <div className="server-hinweis-karte">
        <h1>{t('verwaltungsdialoge.serverHinweis.titel')}</h1>
        {inTauriApp ? (
          <>
            <p>{t('verwaltungsdialoge.serverHinweis.appText')}</p>
            <p>{t('verwaltungsdialoge.serverHinweis.appHilft')}</p>
            <ol className="server-hinweis-massnahmen">
              <li>{t('verwaltungsdialoge.serverHinweis.appWarten')}</li>
              <li>{t('verwaltungsdialoge.serverHinweis.appNeuStarten')}</li>
              <li>
                {t('verwaltungsdialoge.serverHinweis.appFirewallVor')} <code>127.0.0.1</code>{' '}
                {t('verwaltungsdialoge.serverHinweis.appFirewallNach')}
              </li>
            </ol>
            <p className="server-hinweis-klein">
              {t('verwaltungsdialoge.serverHinweis.datenVor')} <code>~/el.easy.CAD Community</code>{' '}
              {t('verwaltungsdialoge.serverHinweis.datenNach')}
            </p>
          </>
        ) : (
          <>
            <p>{t('verwaltungsdialoge.serverHinweis.webText')}</p>
            <p>{t('verwaltungsdialoge.serverHinweis.webStarten')}</p>
            <pre className="server-hinweis-befehl">pnpm start</pre>
            <p className="server-hinweis-klein">
              {t('verwaltungsdialoge.serverHinweis.webEntwickelnVor')} <code>pnpm dev</code>
              {t('verwaltungsdialoge.serverHinweis.webEntwickelnNach')}{' '}
              {t('verwaltungsdialoge.serverHinweis.datenVor')} <code>~/el.easy.CAD Community</code>{' '}
              {t('verwaltungsdialoge.serverHinweis.datenNach')}
            </p>
          </>
        )}
        <button type="button" onClick={() => void erneutVersuchen()} disabled={pruefeGerade}>
          {pruefeGerade
            ? t('verwaltungsdialoge.serverHinweis.pruefe')
            : t('verwaltungsdialoge.serverHinweis.erneutVersuchen')}
        </button>
      </div>
    </div>
  )
}
