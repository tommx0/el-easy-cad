import { useEffect, useRef, useState } from 'react'
import { oeffneAdresse, sucheUpdate, type VerfuegbaresUpdate } from '../../persistence'
import { COMMUNITY_VERSION, PROJEKT_URL } from '../community'
import { useT } from '../sprache-anbindung'
import { useStarthinweisSichtbar } from '../starthinweis'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore, type UpdateDialogZustand } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { Verweis } from '../Verweis'

type Phase =
  | { art: 'frage' }
  | { art: 'sucht' }
  | { art: 'gefunden'; update: VerfuegbaresUpdate }
  | { art: 'aktuell' }
  | { art: 'fehler'; grund: string }

export function UpdateStartPruefung() {
  const geladen = useSettingsStore((s) => s.geladen)
  const status = useUiStore((s) => s.produktlizenzStatus)
  const starthinweis = useStarthinweisSichtbar()
  const erledigt = useRef(false)

  useEffect(() => {
    if (erledigt.current || !geladen || !status || starthinweis) return
    erledigt.current = true
    const einstellung = useSettingsStore.getState().updateSuche
    if (einstellung === 'nie') return
    if (einstellung === 'fragen') {
      useUiStore.getState().setUpdateDialog({ art: 'frage', anlass: 'start' })
      return
    }
    sucheUpdate(COMMUNITY_VERSION)
      .then((update) => {
        if (update) useUiStore.getState().setUpdateDialog({ art: 'gefunden', update })
      })
      .catch(() => {})
  }, [geladen, status, starthinweis])

  return null
}

export function UpdateDialog() {
  const zustand = useUiStore((s) => s.updateDialog)
  if (!zustand) return null
  return <UpdateDialogInhalt zustand={zustand} />
}

function UpdateDialogInhalt({ zustand }: { zustand: UpdateDialogZustand }) {
  const t = useT()
  const { settingsStore } = useAppContext()
  const [phase, setPhase] = useState<Phase>(
    zustand.art === 'gefunden' ? { art: 'gefunden', update: zustand.update } : { art: 'frage' },
  )
  const [merken, setMerken] = useState(false)
  const beimStart = zustand.art === 'frage' && zustand.anlass === 'start'

  const schliessen = () => useUiStore.getState().setUpdateDialog(null)

  const suchen = async () => {
    if (beimStart && merken) useSettingsStore.getState().setUpdateSuche(settingsStore, 'immer')
    setPhase({ art: 'sucht' })
    try {
      const update = await sucheUpdate(COMMUNITY_VERSION)
      setPhase(update ? { art: 'gefunden', update } : { art: 'aktuell' })
    } catch (fehler) {
      setPhase({ art: 'fehler', grund: fehler instanceof Error ? fehler.message : String(fehler) })
    }
  }

  const nichtSuchen = () => {
    if (beimStart && merken) useSettingsStore.getState().setUpdateSuche(settingsStore, 'nie')
    schliessen()
  }

  const releaseOeffnen = (update: VerfuegbaresUpdate) => {
    void oeffneAdresse(update.url)
    schliessen()
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        {phase.art === 'frage' && (
          <>
            <h2>{t('community.update.frageTitel')}</h2>
            <p>{t('community.update.frage')}</p>
            <p className="dialog-hinweis">{t('community.update.hinweisGithub')}</p>
            {beimStart && (
              <label className="feld feld-checkbox">
                <input
                  type="checkbox"
                  checked={merken}
                  onChange={(e) => setMerken(e.target.checked)}
                />
                {t('community.update.merken')}
              </label>
            )}
            <div className="dialog-aktionen">
              <button type="button" onClick={nichtSuchen}>
                {t('community.update.nichtSuchen')}
              </button>
              <button type="button" className="primaer" onClick={() => void suchen()}>
                {t('community.update.suchen')}
              </button>
            </div>
          </>
        )}
        {phase.art === 'sucht' && (
          <>
            <h2>{t('community.update.frageTitel')}</h2>
            <p>{t('community.update.sucht')}</p>
          </>
        )}
        {phase.art === 'gefunden' && (
          <>
            <h2>{t('community.update.gefundenTitel')}</h2>
            <p>
              {t('community.update.gefunden', {
                name: phase.update.name,
                aktuell: COMMUNITY_VERSION,
              })}
            </p>
            <p className="dialog-hinweis">
              <Verweis url={phase.update.url}>{phase.update.url}</Verweis>
            </p>
            <div className="dialog-aktionen">
              <button type="button" onClick={schliessen}>
                {t('verwaltungsdialoge.allgemein.schliessen')}
              </button>
              <button
                type="button"
                className="primaer"
                onClick={() => releaseOeffnen(phase.update)}
              >
                {t('community.update.releaseOeffnen')}
              </button>
            </div>
          </>
        )}
        {phase.art === 'aktuell' && (
          <>
            <h2>{t('community.update.aktuellTitel')}</h2>
            <p>{t('community.update.aktuell', { aktuell: COMMUNITY_VERSION })}</p>
            <div className="dialog-aktionen">
              <button type="button" className="primaer" onClick={schliessen}>
                {t('verwaltungsdialoge.allgemein.schliessen')}
              </button>
            </div>
          </>
        )}
        {phase.art === 'fehler' && (
          <>
            <h2>{t('community.update.fehlerTitel')}</h2>
            <p>{t('community.update.fehler', { grund: phase.grund })}</p>
            <p className="dialog-hinweis">
              <Verweis url={`${PROJEKT_URL}/releases`}>{`${PROJEKT_URL}/releases`}</Verweis>
            </p>
            <div className="dialog-aktionen">
              <button type="button" className="primaer" onClick={schliessen}>
                {t('verwaltungsdialoge.allgemein.schliessen')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
