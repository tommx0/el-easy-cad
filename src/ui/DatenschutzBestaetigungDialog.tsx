import { invoke, isTauri } from '@tauri-apps/api/core'
import { useT } from './sprache-anbindung'
import { useAppContext } from './use-app-context'
import { useUiStore } from './store/ui-store'
import { useSettingsStore } from './store/settings-store'
import { DatenschutzInhalt, DATENSCHUTZ_STAND } from './dialogs/DatenschutzInhalt'

export function DatenschutzBestaetigungDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.datenschutzBestaetigungOffen)
  const { settingsStore } = useAppContext()

  if (!offen) return null

  const beenden = () => {
    if (isTauri()) {
      void invoke('programm_beenden')
    } else {
      window.close()
    }
  }

  function akzeptieren() {
    useSettingsStore.getState().setDatenschutzAkzeptiert(settingsStore, DATENSCHUTZ_STAND)
    useUiStore.getState().setDatenschutzBestaetigungOffen(false)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog dialog-datenschutz">
        <h2>{t('verwaltungsdialoge.datenschutz.titel')}</h2>
        <p>{t('verwaltungsdialoge.datenschutz.bestaetigenHinweis')}</p>

        <DatenschutzInhalt />

        <div className="dialog-aktionen">
          <button type="button" onClick={beenden}>
            {t('verwaltungsdialoge.datenschutz.programmBeenden')}
          </button>
          <button type="button" className="primaer" onClick={akzeptieren}>
            {t('verwaltungsdialoge.datenschutz.akzeptiert')}
          </button>
        </div>
      </div>
    </div>
  )
}
